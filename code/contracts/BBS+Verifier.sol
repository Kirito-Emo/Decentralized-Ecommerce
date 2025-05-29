// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.19;

interface ISemaphoreVerifier {
    function verifyProof(
        uint256 merkleTreeRoot,
        uint256 nullifierHash,
        uint256 signalHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external view;
}

contract BBSPlusVerifier {
    ISemaphoreVerifier public semaphore;

    constructor(address semaphoreVerifier) {
        semaphore = ISemaphoreVerifier(semaphoreVerifier);
    }

    function verifyZKP(
        uint256 root,
        uint256 nullifierHash,
        uint256 signalHash,
        uint256 externalNullifier,
        uint256[8] calldata proof
    ) external view returns (bool) {
        semaphore.verifyProof(root, nullifierHash, signalHash, externalNullifier, proof);
        return true;
    }
}