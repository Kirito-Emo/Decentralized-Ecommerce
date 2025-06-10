// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

/// @title BanRegistry - On-chain registry to manage DID bans for user actions
/// @notice Allows authorized moderators to ban/unban DIDs. Other contracts can check ban status.

contract BanRegistry {
    address public owner;
    mapping(string => bool) public isBanned;

    string public banListCID; // IPFS CID of banned DIDs list

    /// @dev Events to log ban/unban actions and owner changes
    event UserBanned(string indexed did, uint256 timestamp);
    event UserUnbanned(string indexed did, uint256 timestamp);
    event OwnerChanged(address oldOwner, address newOwner);
    event BanListCIDUpdated(string newCID, uint256 timestamp);

    /// @dev Modifier to restrict access to owner (moderator)
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @dev Ban a DID
    function banUser(string calldata did) external onlyOwner {
        isBanned[did] = true;
        emit UserBanned(did, block.timestamp);
    }

    /// @dev Unban a DID
    function unbanUser(string calldata did) external onlyOwner {
        isBanned[did] = false;
        emit UserUnbanned(did, block.timestamp);
    }

    /// @dev Change contract owner (moderator)
    function changeOwner(address newOwner) external onlyOwner {
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    /// @dev Check if a DID is banned
    function isDIDBanned(string calldata did) external view returns (bool) {
        return isBanned[did];
    }

    /// @dev Set the IPFS CID for the ban list
    function setBanListCID(string calldata newCID) external onlyOwner {
        banListCID = newCID;
        emit BanListCIDUpdated(newCID, block.timestamp);
    }

    /// @dev Get the current IPFS CID for the ban list
    function getBanListCID() external view returns (string memory) {
        return banListCID;
    }
}