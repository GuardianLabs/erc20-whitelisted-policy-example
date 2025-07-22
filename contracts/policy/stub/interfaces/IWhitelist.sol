//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

interface IWhitelist {
    function evaluate(address _address) external view returns (bool);
}
