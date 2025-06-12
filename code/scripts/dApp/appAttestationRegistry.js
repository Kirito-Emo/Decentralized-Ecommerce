// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Anchors the proof outcome hash on-chain using AttestationRegistry
 * @param {ethers.Signer} signer - Wallet signer
 * @param {number} proofType - 0 = Semaphore, 1 = BBS+, 2 = VP/SD-JWT
 * @param {string} subjectHash - bytes32, hash of subject (DID, badge, etc)
 * @param {string} proofHash - bytes32, hash of proof outcome (nullifier, claim, etc)
 * @returns {Promise<string>} transaction hash
 */

const { ethers } = require("ethers");
const contractAddresses = require("../contract-addresses.json");
const AttestationRegistryAbi = require("../../artifacts/contracts/AttestationRegistry.sol/AttestationRegistry.json");

/**
 * Record a new proof attestation on-chain
 */
async function recordAttestation(signer, proofType, subjectHash, proofHash) {
    if (!signer) throw new Error("Missing signer");
    if (typeof proofType !== "number") throw new Error("proofType must be a number (0, 1, 2)");
    if (!/^0x[a-fA-F0-9]{64}$/.test(subjectHash)) throw new Error("Invalid subjectHash");
    if (!/^0x[a-fA-F0-9]{64}$/.test(proofHash)) throw new Error("Invalid proofHash");

    const registry = new ethers.Contract(
        contractAddresses.AttestationRegistry,
        AttestationRegistryAbi.abi,
        signer
    );
    const tx = await registry.recordAttestation(proofType, subjectHash, proofHash);
    await tx.wait();
    return tx.hash;
}

module.exports = { recordAttestation };