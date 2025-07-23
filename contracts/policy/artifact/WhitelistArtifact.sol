//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import {
    StatelessArtifactBase
} from "@guardian-network/policy-contracts/contracts/pre-defined/common/basis/StatelessArtifactBase.sol";
import {
    ADDRESS,
    BOOL
} from "@guardian-network/policy-contracts/contracts/pre-defined/constants/Export.sol";
import { WhitelistInternal } from "./WhitelistInternal.sol";

contract WhitelistArtifact is StatelessArtifactBase, WhitelistInternal {
    constructor() {}

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
