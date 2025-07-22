import { InitParamsStruct } from '@guardian-network/policy-contracts/src/typechain/contracts/PolicyHandler';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  EnforcedToken,
  WhitelistArtifact,
  WhitelistPolicy,
} from '../src/typechain';

describe('EnforcedToken', function () {
  let token: EnforcedToken;
  let whitelistArtifact: WhitelistArtifact;
  let policy: WhitelistPolicy;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;

  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy whitelist artifact contract (empty initially - no destinations added)
    const WhitelistArtifactFactory =
      await ethers.getContractFactory('WhitelistArtifact');
    whitelistArtifact = await WhitelistArtifactFactory.deploy();
    await whitelistArtifact.waitForDeployment();

    // Deploy token contract
    const EnforcedTokenFactory =
      await ethers.getContractFactory('EnforcedToken');
    token = await EnforcedTokenFactory.deploy();
    await token.waitForDeployment();

    // Deploy whitelist policy contract
    const WhitelistPolicyFactory =
      await ethers.getContractFactory('WhitelistPolicy');
    policy = await WhitelistPolicyFactory.deploy(await token.getAddress());
    await policy.waitForDeployment();

    console.log(
      'WhitelistArtifact deployed to:',
      await whitelistArtifact.getAddress(),
    );
    console.log('NODE_ID:', await token.NODE_ID());

    // Mint some tokens to users for testing
    await token.mintToAddress(user1.address, ethers.parseEther('100'));
    await token.mintToAddress(user2.address, ethers.parseEther('100'));

    // Set up the policy with the whitelist definition
    const definition = <InitParamsStruct>(
      (await import('../policy/Whitelist.json', { assert: { type: 'json' } }))
        .default
    );
    await token.assignPolicyAddress(await policy.getAddress());
    await token.setPolicyDefinition(definition);
  });

  describe('Policy enforcement flow', function () {
    it('should fail to transfer when policy is attached but no addresses are whitelisted', async function () {
      // Verify whitelist is empty (policy is already attached in before hook)
      expect(await whitelistArtifact.whitelistCount()).to.equal(0);
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.false;

      // Try to transfer to non-whitelisted address - should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should allow transfer when destination is whitelisted', async function () {
      // Add user3 to whitelist
      await whitelistArtifact.addToWhitelist([user3.address]);

      // Verify user3 is whitelisted
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.true;
      expect(await whitelistArtifact.whitelistCount()).to.equal(1);

      // Transfer should now succeed
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.not.be.reverted;
    });

    it('should fail transfer after removing address from whitelist', async function () {
      // user3 should still be whitelisted from previous test
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.true;

      // First transfer should succeed
      await token
        .connect(user1)
        .transfer(user3.address, ethers.parseEther('10'));

      // Remove user3 from whitelist
      await whitelistArtifact.removeFromWhitelist([user3.address]);

      // Verify user3 is no longer whitelisted
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.false;
      expect(await whitelistArtifact.whitelistCount()).to.equal(0);

      // Second transfer should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should fail transfer after nuking whitelist', async function () {
      // Add multiple users to whitelist for this test
      await whitelistArtifact.addToWhitelist([user2.address, user3.address]);

      // Verify multiple addresses are whitelisted
      expect(await whitelistArtifact.isWhitelisted(user2.address)).to.be.true;
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.true;
      expect(await whitelistArtifact.whitelistCount()).to.equal(2);

      // Transfer should succeed before nuking
      await token
        .connect(user1)
        .transfer(user3.address, ethers.parseEther('10'));

      // Nuke the whitelist (clear all entries)
      await whitelistArtifact.nukeWhitelist();

      // Verify whitelist is completely cleared
      expect(await whitelistArtifact.isWhitelisted(user2.address)).to.be.false;
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.false;
      expect(await whitelistArtifact.whitelistCount()).to.equal(0);

      // Transfers should now fail for all previously whitelisted addresses
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');

      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should work with transferFrom as well as transfer', async function () {
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

  describe('Whitelist getters and functionality', function () {
    beforeEach(async function () {
      // Add some addresses to whitelist for testing getters
      await whitelistArtifact.addToWhitelist([
        user1.address,
        user2.address,
        user3.address,
      ]);
    });

    it('should correctly return whitelist status for individual addresses', async function () {
      expect(await whitelistArtifact.isWhitelisted(user1.address)).to.be.true;
      expect(await whitelistArtifact.isWhitelisted(user2.address)).to.be.true;
      expect(await whitelistArtifact.isWhitelisted(user3.address)).to.be.true;
      expect(await whitelistArtifact.isWhitelisted(owner.address)).to.be.false;
    });

    it('should return correct whitelist count', async function () {
      expect(await whitelistArtifact.whitelistCount()).to.equal(3);

      // Remove one address
      await whitelistArtifact.removeFromWhitelist([user1.address]);
      expect(await whitelistArtifact.whitelistCount()).to.equal(2);

      // Add it back
      await whitelistArtifact.addToWhitelist([user1.address]);
      expect(await whitelistArtifact.whitelistCount()).to.equal(3);
    });

    it('should return complete whitelist array', async function () {
      const whitelistArray = await whitelistArtifact.getWhitelist();
      expect(whitelistArray.length).to.equal(3);
      expect(whitelistArray).to.include(user1.address);
      expect(whitelistArray).to.include(user2.address);
      expect(whitelistArray).to.include(user3.address);
    });

    it('should handle duplicate additions gracefully', async function () {
      // Try to add user1 again (already in whitelist)
      await whitelistArtifact.addToWhitelist([user1.address]);

      // Count should remain the same
      expect(await whitelistArtifact.whitelistCount()).to.equal(3);

      // Whitelist should still contain the address
      expect(await whitelistArtifact.isWhitelisted(user1.address)).to.be.true;
    });

    it('should handle removal of non-existent addresses gracefully', async function () {
      const initialCount = await whitelistArtifact.whitelistCount();

      // Try to remove an address that's not in the whitelist
      await whitelistArtifact.removeFromWhitelist([owner.address]);

      // Count should remain the same
      expect(await whitelistArtifact.whitelistCount()).to.equal(initialCount);
    });

    it('should maintain proper state after multiple operations', async function () {
      // Remove all current addresses
      await whitelistArtifact.removeFromWhitelist([
        user1.address,
        user2.address,
        user3.address,
      ]);
      expect(await whitelistArtifact.whitelistCount()).to.equal(0);

      // Add new batch
      await whitelistArtifact.addToWhitelist([owner.address, user1.address]);
      expect(await whitelistArtifact.whitelistCount()).to.equal(2);
      expect(await whitelistArtifact.isWhitelisted(owner.address)).to.be.true;
      expect(await whitelistArtifact.isWhitelisted(user1.address)).to.be.true;
      expect(await whitelistArtifact.isWhitelisted(user2.address)).to.be.false;

      // Verify the getWhitelist function returns correct addresses
      const finalWhitelist = await whitelistArtifact.getWhitelist();
      expect(finalWhitelist.length).to.equal(2);
      expect(finalWhitelist).to.include(owner.address);
      expect(finalWhitelist).to.include(user1.address);
    });
  });

  describe('Access control', function () {
    it('should only allow owner to modify whitelist', async function () {
      // Non-owner should not be able to add to whitelist
      await expect(
        whitelistArtifact.connect(user1).addToWhitelist([user2.address]),
      ).to.be.revertedWithCustomError(
        whitelistArtifact,
        'OwnableUnauthorizedAccount',
      );

      // Non-owner should not be able to remove from whitelist
      await expect(
        whitelistArtifact.connect(user1).removeFromWhitelist([user2.address]),
      ).to.be.revertedWithCustomError(
        whitelistArtifact,
        'OwnableUnauthorizedAccount',
      );

      // Non-owner should not be able to nuke whitelist
      await expect(
        whitelistArtifact.connect(user1).nukeWhitelist(),
      ).to.be.revertedWithCustomError(
        whitelistArtifact,
        'OwnableUnauthorizedAccount',
      );
    });

    it('should only allow token owner to assign policy', async function () {
      // Non-owner should not be able to assign policy
      await expect(
        token
          .connect(user1)
          .assignPolicyAddress(await whitelistArtifact.getAddress()),
      ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');

      // Owner should be able to assign policy
      await expect(
        token.assignPolicyAddress(await whitelistArtifact.getAddress()),
      ).to.not.be.reverted;
    });
  });
});
