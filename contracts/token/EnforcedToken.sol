//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { EnforcedTokenBase } from "./base/EnforcedTokenBase.sol";

contract EnforcedToken is EnforcedTokenBase {
    constructor() EnforcedTokenBase("ERC20Enforced", "GRDERC20") {}
}
