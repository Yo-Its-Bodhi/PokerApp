// SPDX-License-Identifier: MIT
pragma solidity ^08.20;

/**
 * @title IOwnable
 * @author transientlabs.xyz
 * @notice Minimal interface for contracts that are ownable.
 */
interface IOwnable {
    /**
     * @notice Returns the address of the owner.
     */
    function owner() external view returns (address);

    /**
     * @notice Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) external;
}
