// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for DIDRegistry:
 * - Measures gas and execution time for changeOwner
 * Requirements:
 * - Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

const CONTRACTS_PATH = path.join(__dirname, "../contract-addresses.json");
const ISSUER_PATH = path.join(__dirname, "../interact/issuer-did.json");

async function main() {
    console.log("\n===== Benchmark: DIDRegistry changeOwner =====");

    // Load DIDRegistry address and issuer DID
    const addresses = JSON.parse(fs.readFileSync(CONTRACTS_PATH, "utf8"));
    const issuer = JSON.parse(fs.readFileSync(ISSUER_PATH, "utf8"));

    const DIDRegistry = await ethers.getContractAt("DIDRegistry", addresses.DIDRegistry);
    const signer = (await ethers.getSigners())[0];

    const iterations = 10;
    const gasChangeOwner = [], timeChangeOwner = [];

    for (let i = 0; i < iterations; i++) {
        // Measure changeOwner
        const t1 = process.hrtime();
        const tx1 = await DIDRegistry.connect(signer).changeOwner(issuer.address, issuer.address);
        const rc1 = await tx1.wait();
        const dt1 = process.hrtime(t1);
        const ms1 = dt1[0] * 1000 + dt1[1] / 1e6;

        gasChangeOwner.push(Number(rc1.gasUsed));
        timeChangeOwner.push(ms1);
    }

    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("changeOwner gas", gasChangeOwner);
    printStats("changeOwner time (ms)", timeChangeOwner);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});