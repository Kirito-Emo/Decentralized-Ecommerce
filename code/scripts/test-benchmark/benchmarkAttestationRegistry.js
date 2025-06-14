// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for AttestationRegistry:
 * - Measures gas and execution time for anchoring attestation on-chain (VP, SD-JWT, BBS+)
 * Requirements:
 * - Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

// Load AttestationRegistry contract address
const CONTRACTS_PATH = "../contract-addresses.json";
const HOLDER_PATH = "../interact/issuer-did.json";

// Load JSON files
function loadJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
}

async function main() {
    console.log("\n===== Benchmark: AttestationRegistry anchoring attestation =====");

    // Array to store gas and time statistics
    const gasAttestation = [], timeAttestation = [];

    // Prepare signer and contract
    const issuer = loadJSON(HOLDER_PATH, "utf8");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);
    const addrs = loadJSON(CONTRACTS_PATH, "utf8");

    const registry = await ethers.getContractAt("AttestationRegistry", addrs.AttestationRegistry, signer);

    // Function to send transaction and measure gas/time
    async function sendTx(fn, ...args) {
        const t1 = process.hrtime();
        const txObj = await fn(...args);
        const rc = await txObj.wait();
        const dt = process.hrtime(t1);
        const ms = dt[0] * 1000 + dt[1] / 1e6;

        return { gasUsed: Number(rc.gasUsed), time: ms };
    }

    // Benchmark for each attestation file type
    let attestation = loadJSON("../interact/bbs_attestation.json");   // Example BBS+ attestation object
    let proofType = 1; // Mapping to proofType                   // 1: BBS+ proof, 2: SD-JWT/VP

    // Record Attestation on-chain
    try {
        const txResult = await sendTx(registry.recordAttestation, proofType, attestation.subjectHash, attestation.proofHash);
        gasAttestation.push(txResult.gasUsed);
        timeAttestation.push(txResult.time);
    } catch (err) {
        console.error(`Error anchoring attestation: ${err.message}`);
    }

    attestation = loadJSON("../interact/SD-VP_attestation.json"); // Example SD-JWT attestation
    proofType = 2; // SD-JWT/VP

    // Record Attestation on-chain
    try {
        const txResult = await sendTx(registry.recordAttestation, proofType, attestation.subjectHash, attestation.proofHash);
        gasAttestation.push(txResult.gasUsed);
        timeAttestation.push(txResult.time);
    } catch (err) {
        console.error(`Error anchoring attestation: ${err.message}`);
    }

    attestation = loadJSON("../interact/VP_attestation.json"); // Example SD-JWT attestation

    // Record Attestation on-chain
    try {
        const txResult = await sendTx(registry.recordAttestation, proofType, attestation.subjectHash, attestation.proofHash);
        gasAttestation.push(txResult.gasUsed);
        timeAttestation.push(txResult.time);
    } catch (err) {
        console.error(`Error anchoring attestation: ${err.message}`);
    }

    // Print benchmark statistics for this type
    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("Attestation gas: ", gasAttestation);
    printStats("Attestation time (ms): ", timeAttestation);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});