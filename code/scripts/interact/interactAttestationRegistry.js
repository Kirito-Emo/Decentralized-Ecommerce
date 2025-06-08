// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Developer script: anchors proof outcomes on-chain (VP, BBS+, Semaphore)
 * Reads subjectHash/proofHash from the appropriate JSON file
 *
 * Set PROOF_TYPE and FILENAME for the attestation to anchor:
 *   0 = Semaphore, 1 = BBS+, 2 = VP
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// CHANGE as needed:
const PROOF_TYPE = 2; // 0=Semaphore, 1=BBS+, 2=VP/SD-JWT
const FILENAME = "VP_attestation.json"; // or "sd-vp_attestation.json", "bbs_attestation.json", "semaphore_attestation.json"

function loadJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
}

async function main() {
    // Load attestation
    const attestation = loadJSON(FILENAME);

    // Prepare signer and contract
    const issuer = loadJSON("issuer-did.json");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);
    const addrs = loadJSON("../contract-addresses.json");

    const registry = await ethers.getContractAt("AttestationRegistry", addrs.AttestationRegistry, signer);

    // Write on-chain
    const tx = await registry.recordAttestation(PROOF_TYPE, attestation.subjectHash, attestation.proofHash);
    await tx.wait();

    console.log("✅ Attestation anchored on-chain. ProofType =", PROOF_TYPE);
}

main().catch(console.error);