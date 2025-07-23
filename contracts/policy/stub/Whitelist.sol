//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { WhitelistInternal } from "../artifact/WhitelistInternal.sol";

contract Whitelist is WhitelistInternal {
    function evaluate(address _address) external view returns (bool) {
        return isWhitelisted(_address);
    }
}
