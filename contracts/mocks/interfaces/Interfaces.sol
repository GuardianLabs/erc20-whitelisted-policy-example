//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

interface IWhitelistStub {
    function evaluate(address _address) external view returns (bool);
}

interface IBlacklistStub {
    function evaluate(address _address) external view returns (bool);
}
