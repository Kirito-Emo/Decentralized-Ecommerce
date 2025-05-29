// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

contract VCRegistry {
    mapping(bytes32 => bool) public commitmentUsed;

    event CommitmentRegistered(bytes32 indexed commitment);

    /// @notice Registra hash VC per BBS+ o Semaphore
    /// @param commitment hash della VC o nullifier
    function registerCommitment(bytes32 commitment) external {
        require(!commitmentUsed[commitment], "Already used");
        commitmentUsed[commitment] = true;
        emit CommitmentRegistered(commitment);
    }

    function isRegistered(bytes32 commitment) external view returns (bool) {
        return commitmentUsed[commitment];
    }
}