//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IWhitelistStub } from "../interfaces/Interfaces.sol";

contract EnforcedTokenMockBase is ERC20, ERC165, Ownable {
    IWhitelistStub internal policy;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, 100 ether);
    }

    function transfer(address to, uint256 value) public override returns (bool result) {
        _beforeTransfer(to);
        result = super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool result) {
        _beforeTransfer(to);
        result = super.transferFrom(from, to, value);
    }

    function assignPolicyAddress(address policyAddress) public onlyOwner {
        _assignPolicyAddress(policyAddress);
    }

    function mintToAddress(address to, uint256 amount /* Anyone can mint */) public {
        _mint(to, amount);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC20).interfaceId || super.supportsInterface(interfaceId);
    }

    function _assignPolicyAddress(address policyAddress) internal {
        policy = IWhitelistStub(policyAddress);
    }

    function _beforeTransfer(address to) private view {
        require(address(policy) != address(0), "Policy not assigned");
        require(policy.evaluate(to), "Not whitelisted");
    }
}
