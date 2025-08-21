import { InitParamsStruct } from '@guardian-network/policy-contracts/src/typechain/contracts/PolicyHandler';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { parseEther } from 'ethers';
import { ethers } from 'hardhat';
import {
  EnforcedToken,
  EnforcedToken__factory,
  WhitelistArtifact,
  WhitelistArtifact__factory,
  WhitelistPolicyHandler,
  WhitelistPolicyHandler__factory,
} from '../src/typechain';
import { check, randomEthSigner } from './test-helpers';

const staticSigner = async () => {
  const staticSignerAddress = '0xd0b3F3eF4B41fE1db84c1DbBf1798deAE9Ffd0A5';
  return randomEthSigner(staticSignerAddress);
};

const policyInitParams = async () => {
  return <InitParamsStruct>(
    (await import('../policy/Whitelist.json', { assert: { type: 'json' } }))
      .default
  );
};

describe('EnforcedGRDToken', function () {
  let token: EnforcedToken;
  let policyHandler: WhitelistPolicyHandler;
  let whitelistArtifact: WhitelistArtifact;

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // note: the 'deploySigner' retains the same no matter what .env mnemonic or private key is
    const deploySigner = await staticSigner();
    // console.log(deploySigner.address)

    // note: Deploy whitelist artifact contract (empty initially - no destinations added)
    const WhitelistArtifactFactory = new WhitelistArtifact__factory(
      deploySigner,
    );
    whitelistArtifact = await WhitelistArtifactFactory.deploy();
    await whitelistArtifact.waitForDeployment();

    // tranfer ownership to owner signer declared in tests
    await whitelistArtifact.transferOwnership(owner);
    whitelistArtifact = whitelistArtifact.connect(owner);

    // note: Deploy token contract
    const EnforcedTokenFactory = new EnforcedToken__factory(owner);
    token = await EnforcedTokenFactory.deploy();
    await token.waitForDeployment();

    // note: Deploy whitelist policy contract
    const WhitelistPolicyFactory = new WhitelistPolicyHandler__factory(owner);

    // note: token contract is policy admin
    policyHandler = await WhitelistPolicyFactory.deploy(
      await token.getAddress(),
    );
    await policyHandler.waitForDeployment();

    console.log('NODE_ID:', await token.NODE_ID());

    // note: Mint some tokens to users for testing
    await token.mintToAddress(user1.address, ethers.parseEther('100'));
    await token.mintToAddress(user2.address, ethers.parseEther('100'));
  });

  describe('Policy enforcement flow', function () {
    it('should fail to transfer when no policy is attached', async () => {
      check(await token.balanceOf(user1.address), parseEther('100'));
      check(await token.balanceOf(user2.address), parseEther('100'));
      check(await token.balanceOf(user3.address), 0n);

      // note: Try to transfer without policy attached - should fail
      await expect(
        token.connect(user1).transfer(user3.address, parseEther('10')),
      ).to.be.revertedWith('Policy not assigned');
    });

    it('should fail to transfer when policy is attached but no addresses are whitelisted', async () => {
      // note: Set up the policy with the whitelist definition
      const initParams = await policyInitParams();
      await token.assignPolicy(initParams, await policyHandler.getAddress());

      // note: Verify whitelist is empty (policy is already attached in before hook)
      check(await whitelistArtifact.whitelistCount(), 0n);
      check(await whitelistArtifact.isWhitelisted(user3.address), false);

      // Try to transfer to non-whitelisted address - should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should allow transfer when destination is whitelisted', async () => {
      // Add user3 to whitelist
      await whitelistArtifact.addToWhitelist([user3.address]);

      // Verify user3 is whitelisted
      check(await whitelistArtifact.isWhitelisted(user3.address), true);
      check(await whitelistArtifact.whitelistCount(), 1n);

      // Transfer should now succeed
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.not.be.reverted;
    });

    it('should fail transfer after removing address from whitelist', async () => {
      // user3 should still be whitelisted from previous test
      check(await whitelistArtifact.isWhitelisted(user3.address), true);

      // First transfer should succeed
      await token
        .connect(user1)
        .transfer(user3.address, ethers.parseEther('10'));

      // Remove user3 from whitelist
      await whitelistArtifact.removeFromWhitelist([user3.address]);

      // Verify user3 is no longer whitelisted
      check(await whitelistArtifact.isWhitelisted(user3.address), false);
      check(await whitelistArtifact.whitelistCount(), 0n);

      // Second transfer should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should fail transfer after nuking whitelist', async () => {
      // note: Add multiple users to whitelist for this test
      await whitelistArtifact.addToWhitelist([user2.address, user3.address]);

      // note: Verify multiple addresses are whitelisted
      check(await whitelistArtifact.isWhitelisted(user2.address), true);
      check(await whitelistArtifact.isWhitelisted(user3.address), true);
      check(await whitelistArtifact.whitelistCount(), 2n);

      // Transfer should succeed before nuking
      await token
        .connect(user1)
        .transfer(user3.address, ethers.parseEther('10'));

      // note: Nuke the whitelist (clear all entries)
      await whitelistArtifact.nukeWhitelist();

      // Verify whitelist is completely cleared
      check(await whitelistArtifact.isWhitelisted(user2.address), false);
      check(await whitelistArtifact.isWhitelisted(user3.address), false);
      check(await whitelistArtifact.whitelistCount(), 0n);

      // Transfers should now fail for all previously whitelisted addresses
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');

      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should work with transferFrom as well as transfer', async () => {
      // Add user3 to whitelist for this test
      await whitelistArtifact.addToWhitelist([user3.address]);

      // User1 approves user2 to spend tokens
      await token
        .connect(user1)
        .approve(user2.address, ethers.parseEther('50'));

      // TransferFrom should succeed to whitelisted address
      await expect(
        token
          .connect(user2)
          .transferFrom(user1.address, user3.address, ethers.parseEther('20')),
      ).to.not.be.reverted;

      // Remove user3 from whitelist
      await whitelistArtifact.removeFromWhitelist([user3.address]);

      // TransferFrom should now fail
      await expect(
        token
          .connect(user2)
          .transferFrom(user1.address, user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });
  });

  describe('Access control', function () {
    it('should only allow token owner to assign policy', async () => {
      const initParams = await policyInitParams();

      const WhitelistPolicyFactory = new WhitelistPolicyHandler__factory(owner);
      const policyAdmin = await token.getAddress(); // tokem contract is policy adming
      policyHandler = await WhitelistPolicyFactory.deploy(policyAdmin);
      await policyHandler.waitForDeployment();

      // note: Non-owner should not be able to assign policy
      await expect(
        token
          .connect(user1)
          .assignPolicy(initParams, await policyHandler.getAddress()),
      ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');

      // note: Owner should be able to assign policy
      await expect(
        token.assignPolicy(initParams, await policyHandler.getAddress()),
      ).to.not.be.reverted;
    });
  });
});
