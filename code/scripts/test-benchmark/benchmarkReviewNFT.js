// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for ReviewNFT:
 * - Mint + use NFT for N iterations
 * - Measures gas, execution time, and statistics
 * Requirements:
 * - Ganache running on localhost:8545
 * - contract-addresses.json with deployed ReviewNFT and BanRegistry
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

async function main() {
    console.log("\n===== Benchmark: ReviewNFT mint + use =====");

    // Load contract addresses and DID
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "../interact/holder-did.json"), "utf8"));
    const holderDID = holder.did;

    const ReviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);
    const BanRegistry = await ethers.getContractAt("BanRegistry", addresses.BanRegistry);

    const signer = (await ethers.getSigners())[0];
    const productId = 42;
    const ipfsCID = "QmTestCID";

    const iterations = 10;
    const gasMint = [], gasUse = [], timesMint = [], timesUse = [];

    for (let i = 0; i < iterations; i++) {
        // Check if user is banned
        const banned = await BanRegistry.isBanned(holderDID);
        if (banned) {
            console.warn(`⚠️ DID ${holderDID} is banned. Skipping.`);
            continue;
        }

        // MINT NFT
        const t1 = process.hrtime();
        const txMint = await ReviewNFT.connect(signer).mintNFT(holderDID, productId, ipfsCID);
        const rcMint = await txMint.wait();
        const dt1 = process.hrtime(t1);
        const msMint = dt1[0] * 1000 + dt1[1] / 1e6;

        const event = rcMint.logs.find(log => log.fragment?.name === "NFTMinted");
        const tokenId = event?.args?.tokenId;

        gasMint.push(Number(rcMint.gasUsed));
        timesMint.push(msMint);

        // USE NFT
        const t2 = process.hrtime();
        const txUse = await ReviewNFT.connect(signer).useNFT(tokenId, holderDID);
        const rcUse = await txUse.wait();
        const dt2 = process.hrtime(t2);
        const msUse = dt2[0] * 1000 + dt2[1] / 1e6;

        gasUse.push(Number(rcUse.gasUsed));
        timesUse.push(msUse);
    }

    // Summary
    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("Mint gas", gasMint);
    printStats("Use gas", gasUse);
    printStats("Mint time (ms)", timesMint);
    printStats("Use time (ms)", timesUse);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});