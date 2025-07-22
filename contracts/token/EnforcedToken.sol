//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { ERC20PolicyEnforced } from "./standard/ERC20PolicyEnforced.sol";

contract EnforcedToken is ERC20PolicyEnforced {
    constructor() ERC20PolicyEnforced("ERC20Enforced", "GRDERC20") {}
}
