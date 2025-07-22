//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { ERC20PolicyEnforcedMock } from "./standard/mock/ERC20PolicyEnforcedMock.sol";

contract EnforcedTokenMock is ERC20PolicyEnforcedMock {
    constructor() ERC20PolicyEnforcedMock("ERC20EnforcedMock", "GRDERC20Mock") {}
}
