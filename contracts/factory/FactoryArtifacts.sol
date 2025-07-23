//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { WhitelistArtifact } from "../policy/artifact/WhitelistArtifact.sol";

contract FactoryArtifacts {
    function deployWhitelistArtifact() public returns (address instance) {
        instance = address(new WhitelistArtifact());
    }
}
