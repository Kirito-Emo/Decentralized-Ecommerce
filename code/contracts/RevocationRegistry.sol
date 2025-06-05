// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

/// @title RevocationRegistry - Anchors W3C Revocation List CIDs on-chain for off-chain privacy-friendly credential revocation
/// @notice Allows a trusted issuer to update the current revocation list (as IPFS CID), with optional issuerDID as metadata.

contract RevocationRegistry {
    /// @dev Address authorized to update the revocation list (trusted issuer)
    address public owner;

    /// @dev Issuer DID (W3C style) as public metadata
    string public issuerDID;

    /// @dev Latest IPFS CID of the published revocation list (W3C RevocationList2020)
    string public revocationListCID;

    /// @dev Emitted when the revocation list is updated
    event RevocationListUpdated(string newCID, uint256 timestamp);

    /// @dev Emitted when the owner is changed
    event OwnerChanged(address oldOwner, address newOwner);

    /// @dev Restricts access to the contract owner (trusted issuer)
    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /// @notice Constructor sets the trusted issuer (owner) and their DID
    constructor(address _owner, string memory _issuerDID) {
        owner = _owner;
        issuerDID = _issuerDID;
    }

    /// @notice Update the current revocation list CID (IPFS)
    function updateRevocationList(string calldata newCID) external onlyOwner {
        revocationListCID = newCID;
        emit RevocationListUpdated(newCID, block.timestamp);
    }

    /// @notice Change the contract owner (trusted issuer)
    function changeOwner(address newOwner) external onlyOwner {
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Returns the current IPFS CID of the revocation list
    function getRevocationCID() external view returns (string memory) {
        return revocationListCID;
    }

    /// @notice Returns the current owner address (trusted issuer)
    function getOwner() external view returns (address) {
        return owner;
    }

    /// @notice Returns the issuer DID
    function getIssuerDID() external view returns (string memory) {
        return issuerDID;
    }
}