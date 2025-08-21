import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { WhitelistStub, WhitelistStub__factory } from '../src/typechain';
import { check, randomEthAddress } from './test-helpers';

describe('Whitelist stub', () => {
  let whitelist: WhitelistStub;

  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  before(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy whitelist contract (empty initially - no destinations added)
    const WhitelistFactory = new WhitelistStub__factory(owner);
    whitelist = await WhitelistFactory.deploy();
    await whitelist.waitForDeployment();
  });

  describe('Whitelist getters and functionality', function () {
    before(async () => {
      await whitelist.addToWhitelist([
        user1.address,
        user2.address,
        user3.address,
      ]);
    });

    it('should correctly return whitelist status for individual addresses', async () => {
      check(await whitelist.whitelistCount(), 3n);

      check(await whitelist.isWhitelisted(user1.address), true);
      check(await whitelist.isWhitelisted(user2.address), true);
      check(await whitelist.isWhitelisted(user3.address), true);
      check(await whitelist.isWhitelisted(randomEthAddress()), false);
    });

    it('should return correct whitelist count', async () => {
      // Remove one address
      await whitelist.removeFromWhitelist([user1.address]);
      check(await whitelist.whitelistCount(), 2n);

      // Add it back
      await whitelist.addToWhitelist([user1.address]);
      check(await whitelist.whitelistCount(), 3n);
    });

    it('should return complete whitelist array', async () => {
      const whitelistArray = await whitelist.getWhitelist();
      expect(whitelistArray).to.eql([
        user3.address,
        user2.address,
        user1.address,
      ]);
    });

    it('should correctly use evaluate function', async () => {
      check(await whitelist.evaluate(user1.address), true);
      check(await whitelist.evaluate(user2.address), true);
      check(await whitelist.evaluate(user3.address), true);
      check(await whitelist.evaluate(owner.address), false);
    });

    it('should handle duplicate additions gracefully', async () => {
      // note: Try to add user1 again (already in whitelist)
      await whitelist.addToWhitelist([user1.address]);

      // note: Count should remain the same
      check(await whitelist.whitelistCount(), 3n);

      // note: Whitelist should still contain the address
      check(await whitelist.isWhitelisted(user1.address), true);
    });

    it('should handle removal of non-existent addresses gracefully', async () => {
      const initialCount = await whitelist.whitelistCount();

      // Try to remove an address that's not in the whitelist
      await whitelist.removeFromWhitelist([owner.address]);

      // Count should remain the same
      expect(await whitelist.whitelistCount()).to.equal(initialCount);
    });

    it('should maintain proper state after multiple operations', async () => {
      // Remove all current addresses
      await whitelist.removeFromWhitelist([
        user1.address,
        user2.address,
        user3.address,
      ]);
      expect(await whitelist.whitelistCount()).to.equal(0);

      // Add new batch
      await whitelist.addToWhitelist([owner.address, user1.address]);
      check(await whitelist.whitelistCount(), 2n);
      check(await whitelist.isWhitelisted(owner.address), true);
      check(await whitelist.isWhitelisted(user1.address), true);
      check(await whitelist.isWhitelisted(user2.address), false);

      // Verify the getWhitelist function returns correct addresses
      const finalWhitelist = await whitelist.getWhitelist();
      check(finalWhitelist.length, 2);
      expect(finalWhitelist).to.include(owner.address);
      expect(finalWhitelist).to.include(user1.address);
    });
  });

  describe('Access control', function () {
    it('should only allow owner to modify whitelist', async () => {
      // note: Non-owner should not be able to add to whitelist
      await expect(
        whitelist.connect(user1).addToWhitelist([user2.address]),
      ).to.be.revertedWithCustomError(whitelist, 'OwnableUnauthorizedAccount');

      // note: Non-owner should not be able to remove from whitelist
      await expect(
        whitelist.connect(user1).removeFromWhitelist([user2.address]),
      ).to.be.revertedWithCustomError(whitelist, 'OwnableUnauthorizedAccount');

      // note: Non-owner should not be able to nuke whitelist
      await expect(
        whitelist.connect(user1).nukeWhitelist(),
      ).to.be.revertedWithCustomError(whitelist, 'OwnableUnauthorizedAccount');
    });
  });
});
