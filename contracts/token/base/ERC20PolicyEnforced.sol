//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.29;

import { ERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IPolicyHandler } from "@guardian-network/policy-contracts/contracts/IPolicyHandler.sol";
import { ExecVariables, InitParams } from "@guardian-network/policy-contracts/contracts/Types.sol";

contract ERC20PolicyEnforced is ERC20, ERC165, Ownable {
    IPolicyHandler private policyHandler;
    bytes32 public constant NODE_ID = keccak256("WHITELIST_ARTIFACT_NODE_ID");

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

    function assignPolicy(InitParams memory definition, address policyAddress) public onlyOwner {
        policyHandler = IPolicyHandler(policyAddress);
        policyHandler.set(definition);
    }

    function mintToAddress(address to, uint256 amount /* Anyone can mint */) public {
        _mint(to, amount);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC20).interfaceId || super.supportsInterface(interfaceId);
    }

    function _beforeTransfer(address to) private {
        bytes[] memory policyInputEncoded = new bytes[](1);
        policyInputEncoded[0] = abi.encode(to);

        ExecVariables[] memory variables = new ExecVariables[](1);
        variables[0] = ExecVariables({ nodeId: NODE_ID, values: policyInputEncoded });

        // console.logBytes32(NODE_ID);
        // console.log(address(policyHandler), "value1");

        bool isAllowed = policyHandler.evaluate(variables);
        if (!isAllowed) {
            revert("Not whitelisted");
        }
    }
}
