// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TableEscrow.sol";

contract TableFactory {
    address[] public tables;
    address public owner;

    event TableCreated(address indexed tableAddress, address indexed owner);

    constructor() {
        owner = msg.sender;
    }

    function createTable(
        uint256 minBuyIn,
        uint256 maxBuyIn,
        uint16 rakeBps,
        uint256 rakeCap,
        address feeRecipient,
        address serverSigner,
        address auditorSigner
    ) external {
        require(msg.sender == owner, "Only owner can create tables");
        TableEscrow newTable = new TableEscrow(
            minBuyIn,
            maxBuyIn,
            rakeBps,
            rakeCap,
            feeRecipient,
            serverSigner,
            auditorSigner,
            owner
        );
        tables.push(address(newTable));
        emit TableCreated(address(newTable), owner);
    }
}
