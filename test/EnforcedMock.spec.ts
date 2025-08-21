import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { parseEther } from 'ethers';
import { ethers } from 'hardhat';
import {
  EnforcedGRDToken,
  EnforcedGRDToken__factory,
  WhitelistStub,
  WhitelistStub__factory,
} from '../src/typechain';
import { check } from './test-helpers';

describe('EnforcedGRDToken Mock', () => {
  let whitelist: WhitelistStub;
  let token: EnforcedGRDToken;

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // note: Deploy whitelist contract (empty initially - no destinations added)
    const WhitelistFactory = new WhitelistStub__factory(owner);
    whitelist = await WhitelistFactory.deploy();
    await whitelist.waitForDeployment();

    // note: Deploy token contract
    const TokenFactory = new EnforcedGRDToken__factory(owner);
    token = await TokenFactory.deploy();
    await token.waitForDeployment();

    // note: Mint some tokens to users for testing
    await token.mintToAddress(user1.address, parseEther('100'));
    await token.mintToAddress(user2.address, parseEther('100'));
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
      // note: Attach whitelist contract as policy (but whitelist is empty)
      await token.assignPolicyAddress(await whitelist.getAddress());

      // note: Verify whitelist is empty
      expect(await whitelist.whitelistCount()).to.equal(0);
      expect(await whitelist.isWhitelisted(user3.address)).to.be.false;

      // note: Try to transfer to non-whitelisted address - should fail
      await expect(
        token.connect(user1).transfer(user3.address, parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should allow transfer when destination is whitelisted', async () => {
      // note: adding user3 to whitelist (policy already attached from previous test)
      await whitelist.addToWhitelist([user3.address]);

      const sender = user1.address;
      const receiver = user3.address;

      // note: Verify user3 is whitelisted
      check(await whitelist.isWhitelisted(receiver), true);
      check(await whitelist.whitelistCount(), 1n);

      // Transfer should now succeed
      await expect(token.connect(user1).transfer(receiver, parseEther('10')))
        .to.emit(token, 'Transfer')
        .withArgs(sender, receiver, parseEther('10'));

      // Verify balances updated correctly
      check(await token.balanceOf(sender), parseEther('90'));
      check(await token.balanceOf(receiver), parseEther('10'));
    });

    it('should fail transfer after removing address from whitelist', async () => {
      // user3 should still be whitelisted and have 10 tokens from previous test
      check(await whitelist.isWhitelisted(user3.address), true);
      const senderBalancePre = await token.balanceOf(user3.address);
      check(senderBalancePre, parseEther('10'));

      // Remove user3 from whitelist
      await whitelist.removeFromWhitelist([user3.address]);

      // Verify user3 is no longer whitelisted
      check(await whitelist.isWhitelisted(user3.address), false);
      check(await whitelist.whitelistCount(), 0n);

      // Second transfer should fail
      await expect(
        token.connect(user1).transfer(user3.address, parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');

      // Balance should remain unchanged after failed transfer
      const senderBalancePost = await token.balanceOf(user3.address);
      check(senderBalancePost, senderBalancePre);
    });

    it('should fail transfer after nuking whitelist', async () => {
      // Add multiple users to whitelist for this test
      await whitelist.addToWhitelist([user2.address, user3.address]);

      // Verify multiple addresses are whitelisted
      check(await whitelist.isWhitelisted(user2.address), true);
      check(await whitelist.isWhitelisted(user3.address), true);
      check(await whitelist.whitelistCount(), 2n);

      // Transfer should succeed before nuking
      await token.connect(user1).transfer(user3.address, parseEther('10'));
      check(await token.balanceOf(user3.address), parseEther('20'));

      // Nuke the whitelist (clear all entries)
      await whitelist.nukeWhitelist();

      // Verify whitelist is completely cleared
      check(await whitelist.isWhitelisted(user2.address), false);
      check(await whitelist.isWhitelisted(user3.address), false);
      check(await whitelist.whitelistCount(), 0n);

      // Transfers should now fail for all previously whitelisted addresses
      await expect(
        token.connect(user1).transfer(user2.address, parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');

      await expect(
        token.connect(user1).transfer(user3.address, parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });

    it('should work with transferFrom as well as transfer', async () => {
      // note: Add user3 to whitelist for this test
      await whitelist.addToWhitelist([user3.address]);

      const sender = user1.address;
      const receiver = user3.address;

      // User1 approves user2 to spend tokens
      await token.connect(user1).approve(user2.address, parseEther('50'));

      // TransferFrom should succeed to whitelisted address
      await expect(
        token.connect(user2).transferFrom(sender, receiver, parseEther('20')),
      )
        .to.emit(token, 'Transfer')
        .withArgs(sender, receiver, parseEther('20'));

      // Verify balances (user1 had 60 tokens after previous tests)
      check(await token.balanceOf(sender), parseEther('60'));
      check(await token.balanceOf(receiver), parseEther('40'));

      // Remove user3 from whitelist
      await whitelist.removeFromWhitelist([receiver]);

      // TransferFrom should now fail
      await expect(
        token
          .connect(user2)
          .transferFrom(user1.address, user3.address, parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });
  });

  describe('Access control', function () {
    it('should only allow token owner to assign policy', async () => {
      // note: Non-owner should not be able to assign policy
      await expect(
        token.connect(user1).assignPolicyAddress(await whitelist.getAddress()),
      ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');

      // note: Owner should be able to assign policy (policy is already assigned, but this tests the permission)
      await expect(token.assignPolicyAddress(await whitelist.getAddress())).to
        .not.be.reverted;
    });
  });
});
