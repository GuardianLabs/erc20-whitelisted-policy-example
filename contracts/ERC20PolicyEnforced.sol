//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20PolicyEnforced is ERC20, ERC165, Ownable /* , PolicyHandlerSTUB */ {
    constructor() ERC20("ERC20Enforced", "GRDERC20") Ownable(msg.sender) {
        _mint(msg.sender, 100 ether);
    }

    function transfer(address to, uint256 value) public override returns (bool result) {
        // bool isEnforced = PolicyHandlerSTUB(address(this)).evaluate
        result = super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool result) {
        // bool isEnforced = PolicyHandlerSTUB(address(this)).evaluate
        result = super.transferFrom(from, to, value);
    }

    function assignOrReasignPolicy(address policy) public onlyOwner {
        // PolicyHandlerSTUB(address(this)).set or reset;
    }

    function mintToAddress(address to, uint256 amount) /* Anyone can mint */ public {
        _mint(to, amount);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC20).interfaceId || super.supportsInterface(interfaceId);
    }
}
