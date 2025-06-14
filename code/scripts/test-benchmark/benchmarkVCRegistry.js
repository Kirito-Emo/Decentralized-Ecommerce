// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for VCRegistry:
 * - Register and revoke a Verifiable Credential on-chain
 * - Measures gas and execution time
 * Requirements:
 * - Ganache (localhost:8545), IPFS Desktop (localhost:5001)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

const CONTRACTS_PATH = path.join(__dirname, "../contract-addresses.json");
const HOLDER_PATH = path.join(__dirname, "../interact/holder-did.json");

async function main() {
    console.log("\n===== Benchmark: VCRegistry register + revoke =====");

    // Load DID and contract address
    const addresses = JSON.parse(fs.readFileSync(CONTRACTS_PATH, "utf8"));
    const holder = JSON.parse(fs.readFileSync(HOLDER_PATH, "utf8"));
    const holderDID = holder.did;

    const VCRegistry = await ethers.getContractAt("VCRegistry", addresses.VCRegistry);
    const signer = (await ethers.getSigners())[0];

    const iterations = 10;
    const gasRegister = [], gasRevoke = [], timeRegister = [], timeRevoke = [];

    // Pre-generate the VC hash off-chain (this is the key input for register/revoke)
    const vcHashPrefix = "unique-vc-benchmark";

    for (let i = 0; i < iterations; i++) {
        const vcHash = ethers.keccak256(ethers.toUtf8Bytes(`${vcHashPrefix}-${i}`));
        console.log(`Generated VC hash: ${vcHash}`);

        // Check if the VC is already registered on-chain
        const isRegistered = await VCRegistry.isValid(vcHash);
        if (isRegistered) {
            console.log(`⚠️ VC already registered: Skipping register.`);
        } else {
            // Register VC on-chain
            const t1 = process.hrtime();
            const tx1 = await VCRegistry.connect(signer).registerVC(vcHash, signer.address, holderDID);
            const rc1 = await tx1.wait();
            const dt1 = process.hrtime(t1);
            const ms1 = dt1[0] * 1000 + dt1[1] / 1e6;

            gasRegister.push(Number(rc1.gasUsed));
            timeRegister.push(ms1);
        }

        // Revoke VC on-chain
        const t2 = process.hrtime();
        const tx2 = await VCRegistry.connect(signer).revokeVC(vcHash);
        const rc2 = await tx2.wait();
        const dt2 = process.hrtime(t2);
        const ms2 = dt2[0] * 1000 + dt2[1] / 1e6;

        gasRevoke.push(Number(rc2.gasUsed));
        timeRevoke.push(ms2);
    }

    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("registerVC gas", gasRegister);
    printStats("revokeVC gas", gasRevoke);
    printStats("registerVC time (ms)", timeRegister);
    printStats("revokeVC time (ms)", timeRevoke);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});