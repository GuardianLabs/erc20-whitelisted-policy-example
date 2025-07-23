//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { PolicyHandler } from "@guardian-network/policy-contracts/contracts/PolicyHandler.sol";

contract WhitelistPolicyHandler is PolicyHandler {
    constructor(address _admin) PolicyHandler(_admin) {}
}
