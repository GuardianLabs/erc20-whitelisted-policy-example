//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import {
    StatelessArtifactBase
} from "@guardian-network/policy-contracts/contracts/pre-defined/common/basis/StatelessArtifactBase.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IterableMapping } from "../../libs/IterableMapping.sol";
import {
    ADDRESS,
    BOOL
} from "@guardian-network/policy-contracts/contracts/pre-defined/constants/Export.sol";

contract WhitelistArtifact is StatelessArtifactBase, Ownable {
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

    function isWhitelisted(address _address) public view returns (bool) {
        return whitelist.contains(_address);
    }

    function getWhitelist() external view returns (address[] memory) {
        return whitelist.getValues();
    }

    function whitelistCount() external view returns (uint256) {
        return whitelist.length();
    }

    function getExecDescriptor()
        external
        pure
        override
        returns (string[] memory argsNames, string[] memory argsTypes, string memory returnType)
    {
        uint256 argsLength = 1;

        argsNames = new string[](argsLength);

        argsNames[0] = "_address";

        argsTypes = new string[](argsLength);
        argsTypes[0] = ADDRESS;

        returnType = BOOL;
    }

    function description() external pure override returns (string memory desc) {
        desc = _makeDescription(
            "Checks if the address is whitelisted. If checked address is present in the whitelist, returns true, otherwise returns false."
        );
    }

    function _exec(bytes[] memory data) internal override returns (bytes memory encodedResult) {
        super._exec(data);

        address _address = abi.decode(data[0], (address));

        encodedResult = abi.encode(isWhitelisted(_address));
    }
}
