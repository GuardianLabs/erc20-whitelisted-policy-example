//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { WhitelistInternal } from "../../policy/artifact/WhitelistInternal.sol";

contract WhitelistStub is WhitelistInternal {
    function evaluate(address _address) external view returns (bool) {
        return isWhitelisted(_address);
    }
}
