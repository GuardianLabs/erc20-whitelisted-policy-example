import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { EnforcedTokenMock, Whitelist } from '../src/typechain';

describe('EnforcedTokenMock', function () {
  let token: EnforcedTokenMock;
  let whitelist: Whitelist;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;

  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy whitelist contract (empty initially - no destinations added)
    const WhitelistFactory = await ethers.getContractFactory('Whitelist');
    whitelist = await WhitelistFactory.deploy();
    await whitelist.waitForDeployment();

    // Deploy token contract
    const TokenFactory = await ethers.getContractFactory('EnforcedTokenMock');
    token = await TokenFactory.deploy();
    await token.waitForDeployment();

    // Mint some tokens to users for testing
    await token.mintToAddress(user1.address, ethers.parseEther('100'));
    await token.mintToAddress(user2.address, ethers.parseEther('100'));
  });

  describe('Policy enforcement flow', function () {
    it('should fail to transfer when no policy is attached', async function () {
      // Verify initial balances
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther('100'),
      );
      expect(await token.balanceOf(user2.address)).to.equal(
        ethers.parseEther('100'),
      );
      expect(await token.balanceOf(user3.address)).to.equal(0);

      // Try to transfer without policy attached - should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.reverted;
    });

    it('should fail to transfer when policy is attached but no addresses are whitelisted', async function () {
      // Attach whitelist contract as policy (but whitelist is empty)
      await token.assignPolicyAddress(await whitelist.getAddress());

      // Verify whitelist is empty
      expect(await whitelist.whitelistCount()).to.equal(0);
      expect(await whitelist.isWhitelisted(user3.address)).to.be.false;

      // Try to transfer to non-whitelisted address - should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');

      // Verify balances unchanged
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther('100'),
      );
      expect(await token.balanceOf(user3.address)).to.equal(0);
    });

    it('should allow transfer when destination is whitelisted', async function () {
      // Add user3 to whitelist (policy already attached from previous test)
      await whitelist.addToWhitelist([user3.address]);

      // Verify user3 is whitelisted
      expect(await whitelist.isWhitelisted(user3.address)).to.be.true;
      expect(await whitelist.whitelistCount()).to.equal(1);

      // Transfer should now succeed
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.not.be.reverted;

      // Verify balances updated correctly
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther('90'),
      );
      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther('10'),
      );
    });

    it('should fail transfer after removing address from whitelist', async function () {
      // user3 should still be whitelisted and have 10 tokens from previous test
      expect(await whitelist.isWhitelisted(user3.address)).to.be.true;
      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther('10'),
      );

      // First transfer should succeed
      await token
        .connect(user1)
        .transfer(user3.address, ethers.parseEther('10'));
      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther('20'),
      );

      // Remove user3 from whitelist
      await whitelist.removeFromWhitelist([user3.address]);

      // Verify user3 is no longer whitelisted
      expect(await whitelist.isWhitelisted(user3.address)).to.be.false;
      expect(await whitelist.whitelistCount()).to.equal(0);

      // Second transfer should fail
      await expect(
        token.connect(user1).transfer(user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');

      // Balance should remain unchanged after failed transfer
      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther('20'),
      );
    });

    it('should fail transfer after nuking whitelist', async function () {
      // Add multiple users to whitelist for this test
      await whitelist.addToWhitelist([user2.address, user3.address]);

      // Verify multiple addresses are whitelisted
      expect(await whitelist.isWhitelisted(user2.address)).to.be.true;
      expect(await whitelist.isWhitelisted(user3.address)).to.be.true;
      expect(await whitelist.whitelistCount()).to.equal(2);

      // Transfer should succeed before nuking
      await token
        .connect(user1)
        .transfer(user3.address, ethers.parseEther('10'));
      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther('30'),
      );

      // Nuke the whitelist (clear all entries)
      await whitelist.nukeWhitelist();

      // Verify whitelist is completely cleared
      expect(await whitelist.isWhitelisted(user2.address)).to.be.false;
      expect(await whitelist.isWhitelisted(user3.address)).to.be.false;
      expect(await whitelist.whitelistCount()).to.equal(0);

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
      await whitelist.addToWhitelist([user3.address]);

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

      // Verify balances (user1 had 70 tokens after previous tests)
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther('50'),
      );
      expect(await token.balanceOf(user3.address)).to.equal(
        ethers.parseEther('50'),
      );

      // Remove user3 from whitelist
      await whitelist.removeFromWhitelist([user3.address]);

      // TransferFrom should now fail
      await expect(
        token
          .connect(user2)
          .transferFrom(user1.address, user3.address, ethers.parseEther('10')),
      ).to.be.revertedWith('Not whitelisted');
    });
  });

  describe('Whitelist getters and functionality', function () {
    before(async function () {
      // Clear any existing whitelist state and add test addresses
      await whitelist.nukeWhitelist();
      await whitelist.addToWhitelist([
        user1.address,
        user2.address,
        user3.address,
      ]);
    });

    it('should correctly return whitelist status for individual addresses', async function () {
      expect(await whitelist.isWhitelisted(user1.address)).to.be.true;
      expect(await whitelist.isWhitelisted(user2.address)).to.be.true;
      expect(await whitelist.isWhitelisted(user3.address)).to.be.true;
      expect(await whitelist.isWhitelisted(owner.address)).to.be.false;
    });

    it('should return correct whitelist count', async function () {
      expect(await whitelist.whitelistCount()).to.equal(3);

      // Remove one address
      await whitelist.removeFromWhitelist([user1.address]);
      expect(await whitelist.whitelistCount()).to.equal(2);

      // Add it back
      await whitelist.addToWhitelist([user1.address]);
      expect(await whitelist.whitelistCount()).to.equal(3);
    });

    it('should return complete whitelist array', async function () {
      const whitelistArray = await whitelist.getWhitelist();
      expect(whitelistArray.length).to.equal(3);
      expect(whitelistArray).to.include(user1.address);
      expect(whitelistArray).to.include(user2.address);
      expect(whitelistArray).to.include(user3.address);
    });

    it('should correctly use evaluate function', async function () {
      expect(await whitelist.evaluate(user1.address)).to.be.true;
      expect(await whitelist.evaluate(user2.address)).to.be.true;
      expect(await whitelist.evaluate(user3.address)).to.be.true;
      expect(await whitelist.evaluate(owner.address)).to.be.false;
    });

    it('should handle duplicate additions gracefully', async function () {
      // Try to add user1 again (already in whitelist)
      await whitelist.addToWhitelist([user1.address]);

      // Count should remain the same
      expect(await whitelist.whitelistCount()).to.equal(3);

      // Whitelist should still contain the address
      expect(await whitelist.isWhitelisted(user1.address)).to.be.true;
    });

    it('should handle removal of non-existent addresses gracefully', async function () {
      const initialCount = await whitelist.whitelistCount();

      // Try to remove an address that's not in the whitelist
      await whitelist.removeFromWhitelist([owner.address]);

      // Count should remain the same
      expect(await whitelist.whitelistCount()).to.equal(initialCount);
    });

    it('should maintain proper state after multiple operations', async function () {
      // Remove all current addresses
      await whitelist.removeFromWhitelist([
        user1.address,
        user2.address,
        user3.address,
      ]);
      expect(await whitelist.whitelistCount()).to.equal(0);

      // Add new batch
      await whitelist.addToWhitelist([owner.address, user1.address]);
      expect(await whitelist.whitelistCount()).to.equal(2);
      expect(await whitelist.isWhitelisted(owner.address)).to.be.true;
      expect(await whitelist.isWhitelisted(user1.address)).to.be.true;
      expect(await whitelist.isWhitelisted(user2.address)).to.be.false;

      // Verify the getWhitelist function returns correct addresses
      const finalWhitelist = await whitelist.getWhitelist();
      expect(finalWhitelist.length).to.equal(2);
      expect(finalWhitelist).to.include(owner.address);
      expect(finalWhitelist).to.include(user1.address);
    });
  });

  describe('Access control', function () {
    it('should only allow owner to modify whitelist', async function () {
      // Non-owner should not be able to add to whitelist
      await expect(
        whitelist.connect(user1).addToWhitelist([user2.address]),
      ).to.be.revertedWithCustomError(whitelist, 'OwnableUnauthorizedAccount');

      // Non-owner should not be able to remove from whitelist
      await expect(
        whitelist.connect(user1).removeFromWhitelist([user2.address]),
      ).to.be.revertedWithCustomError(whitelist, 'OwnableUnauthorizedAccount');

      // Non-owner should not be able to nuke whitelist
      await expect(
        whitelist.connect(user1).nukeWhitelist(),
      ).to.be.revertedWithCustomError(whitelist, 'OwnableUnauthorizedAccount');
    });

    it('should only allow token owner to assign policy', async function () {
      // Non-owner should not be able to assign policy
      await expect(
        token.connect(user1).assignPolicyAddress(await whitelist.getAddress()),
      ).to.be.revertedWithCustomError(token, 'OwnableUnauthorizedAccount');

      // Owner should be able to assign policy (policy is already assigned, but this tests the permission)
      await expect(token.assignPolicyAddress(await whitelist.getAddress())).to
        .not.be.reverted;
    });
  });
});
