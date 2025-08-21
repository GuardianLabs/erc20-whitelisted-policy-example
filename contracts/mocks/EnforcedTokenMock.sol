//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { EnforcedTokenMockBase } from "./basis/EnforcedTokenMockBase.sol";

contract EnforcedGRDToken is EnforcedTokenMockBase {
    constructor() EnforcedTokenMockBase("ERC20EnforcedMock", "GRDERC20Mock") {}
}
