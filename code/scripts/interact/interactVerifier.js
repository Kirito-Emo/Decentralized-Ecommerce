// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for ZK Verifiers: VPVerifier, BBSVerifier and SemaphoreVerifier.
 * - Verifies a dummy zero-knowledge proof with all three contracts.
 * - Prints the verification result for each verifier.
 *
 * Requirements:
 * - All verifier contracts deployed and addresses saved in contract-addresses.json
 * - Inputs are dummy for demo/development only.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));

    // Dummy proof and public signals for testing
    const dummyProof = "0x1234";
    const dummySignals = [
        "0x" + "a".repeat(64),
        "0x" + "b".repeat(64),
    ];

    const vpVerifier = await ethers.getContractAt("VPVerifier", addresses.VPVerifier);
    const bbsVerifier = await ethers.getContractAt("BBSVerifier", addresses.BBSVerifier);
    const semaVerifier = await ethers.getContractAt("SemaphoreVerifier", addresses.SemaphoreVerifier);

    // Call verifyProof on each contract
    const vp = await vpVerifier.verifyProof(dummyProof, dummySignals);
    const bbs = await bbsVerifier.verifyProof(dummyProof, dummySignals);

    // SemaphoreVerifier requires a different structure for signals
    const _pA = [1, 2];
    const _pB = [[1, 2], [3, 4]];
    const _pC = [5, 6];
    const _publicSignals = [7, 8, 9, 10];
    const merkleTreeDepth = 20;
    const sema = await semaVerifier.verifyProof(_pA, _pB, _pC, _publicSignals, merkleTreeDepth);

    console.log("🔐 VPVerifier result: ", vp);
    console.log("🔐 BBSPlusVerifier result: ", bbs);
    console.log("🔐 SemaphoreVerifier result: ", sema);
}

main().catch(console.error);