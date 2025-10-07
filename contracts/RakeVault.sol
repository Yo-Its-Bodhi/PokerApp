// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "solmate/src/utils/SafeTransferLib.sol";
import "solmate/src/auth/Owned.sol";

contract RakeVault is Owned {
    using SafeTransferLib for address payable;

    event RakeWithdrawn(address indexed to, uint256 amount);

    constructor(address _owner) Owned(_owner) {}

    function withdraw(address payable to, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.safeTransfer(amount);
        emit RakeWithdrawn(to, amount);
    }

    receive() external payable {}
}
