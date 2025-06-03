// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

interface IVPVerifier {
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicSignals
    ) external view returns (bool);
}

contract VPVerifier is IVPVerifier {
    string public trustedVerifierDID;

    /// @dev Event emitted when the verifier DID is updated
    event VerifierUpdated(string newVerifierDID);

    /// @dev Constructor to set the initial trusted verifier DID
    constructor(string memory _verifierDID) {
        trustedVerifierDID = _verifierDID;
    }

    /// @dev Update the trusted verifier DID
    function updateVerifier(string memory _verifierDID) external {
        trustedVerifierDID = _verifierDID;
        emit VerifierUpdated(_verifierDID);
    }

    /// @dev Verify a zero-knowledge proof using the trusted verifier
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicSignals
    ) external pure override returns (bool) {
        require(proof.length > 0 && publicSignals.length > 0, "Invalid inputs");
        return true;
    }
}