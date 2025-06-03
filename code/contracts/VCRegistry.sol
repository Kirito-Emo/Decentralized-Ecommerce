// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

contract VCRegistry {
    string public issuerDID;

    mapping(bytes32 => bool) public commitmentUsed;
    mapping(bytes32 => bool) public revoked;
    mapping(bytes32 => string) public vcHolder;

    event CommitmentRegistered(bytes32 indexed commitment, string indexed holderDID);
    event VCRevoked(bytes32 indexed vcHash);

    /// @dev Constructor to set the issuer DID
    constructor(string memory _issuerDID) {
        issuerDID = _issuerDID;
    }

    /// @dev Modifier to restrict access to the issuer
    modifier onlyIssuer(string memory did) {
        require(_compareDID(did, issuerDID), "Not issuer");
        _;
    }

    /// @dev Register hash VC or nullifier and its holder DID
    function registerCommitment(bytes32 commitment, string calldata holderDID) external {
        require(!commitmentUsed[commitment], "Already used");
        commitmentUsed[commitment] = true;
        vcHolder[commitment] = holderDID;
        emit CommitmentRegistered(commitment, holderDID);
    }

    /// @dev Check if a commitment is already registered
    function isRegistered(bytes32 commitment) external view returns (bool) {
        return commitmentUsed[commitment];
    }

    /// @dev Check if a VC has been revoked
    function isRevoked(bytes32 vcHash) external view returns (bool) {
        return revoked[vcHash];
    }

    /// @dev Check if a VC has been revoked
    function revokeVC(bytes32 vcHash, string calldata did) external onlyIssuer(did) {
        revoked[vcHash] = true;
        emit VCRevoked(vcHash);
    }

    /// @dev Get the holder DID of a VC (hash)
    function getHolderDID(bytes32 commitment) external view returns (string memory) {
        return vcHolder[commitment];
    }

    /// @dev Safe string compare for DID
    function _compareDID(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(bytes(a)) == keccak256(bytes(b)));
    }
}