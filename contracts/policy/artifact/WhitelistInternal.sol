//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IterableMapping } from "../../libs/IterableMapping.sol";

contract WhitelistInternal is Ownable {
    using IterableMapping for IterableMapping.AddressSet;

    IterableMapping.AddressSet private whitelist;

    constructor() Ownable(msg.sender) {}

    function addToWhitelist(address[] calldata addresses) external onlyOwner {
        whitelist.add(addresses);
    }

    function removeFromWhitelist(address[] calldata addresses) external onlyOwner {
        whitelist.remove(addresses);
    }

    function nukeWhitelist() external onlyOwner {
        whitelist.clear();
    }

    function getWhitelist() external view returns (address[] memory) {
        return whitelist.getValues();
    }

    function whitelistCount() external view returns (uint256) {
        return whitelist.length();
    }

    function isWhitelisted(address _address) public view returns (bool) {
        return whitelist.contains(_address);
    }
}
