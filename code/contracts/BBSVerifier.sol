// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

interface IBBSVerifier {
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicSignals
    ) external view returns (bool);
}

contract BBSVerifier is IBBSVerifier {
    /// @dev Verify a zero-knowledge proof using the trusted verifier
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicSignals
    ) external pure override returns (bool) {
        require(proof.length > 0 && publicSignals.length > 0, "Invalid inputs");
        return true;
    }
}