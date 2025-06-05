// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

/// @title AttestationRegistry - Registry for off-chain proof attestations (Semaphore, BBS+, VP)
/// @notice Anchors proof outcomes on-chain with full privacy (no attributes or personal data saved).

contract AttestationRegistry {
    /// @dev The type of proof/attestation
    enum ProofType { Semaphore, BBSPlus, VP }

    struct Attestation {
        address verifier;      // Who is recording this attestation
        ProofType proofType;   // Modality: Semaphore ZKP or BBS+ selective disclosure
        bytes32 subjectHash;   // Hash of the subject (DID/user)
        bytes32 proofHash;     // Hash of the proof or output (challenge/nullifier/full proof hash)
        uint256 timestamp;     // When was it anchored
    }

    /// @dev A simple registry: key = keccak256(subjectHash, proofType, proofHash)
    mapping(bytes32 => Attestation) public attestations;

    /// @dev Event emitted when a new attestation is recorded
    event Attested(address indexed verifier, ProofType indexed proofType, bytes32 indexed subjectHash, bytes32 proofHash, uint256 timestamp);

    /// @dev Record a new proof outcome
    function recordAttestation(ProofType proofType, bytes32 subjectHash, bytes32 proofHash) external {
        bytes32 key = keccak256(abi.encodePacked(subjectHash, proofType, proofHash));
        require(attestations[key].timestamp == 0, "Already attested");
        attestations[key] = Attestation({
            verifier: msg.sender,
            proofType: proofType,
            subjectHash: subjectHash,
            proofHash: proofHash,
            timestamp: block.timestamp
        });
        emit Attested(msg.sender, proofType, subjectHash, proofHash, block.timestamp);
    }

    /// @dev Returns the attestation if present (timestamp != 0)
    function getAttestation(
        ProofType proofType,
        bytes32 subjectHash,
        bytes32 proofHash
    ) external view returns (Attestation memory) {
        bytes32 key = keccak256(abi.encodePacked(subjectHash, proofType, proofHash));
        return attestations[key];
    }
}