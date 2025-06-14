// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for BadgeNFT:
 * - Measures gas and execution time for minting and updating reputation-based badges.
 * Requirements:
 * - Ganache (localhost:8545), IPFS Desktop (localhost:5001)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

const CONTRACTS_PATH = path.join(__dirname, "../contract-addresses.json");
const HOLDER_PATH = path.join(__dirname, "../interact/issuer-did.json");

async function main() {
    console.log("\n===== Benchmark: BadgeNFT updateReputation =====");

    // Load issuer DID credentials
    const issuer = JSON.parse(fs.readFileSync(HOLDER_PATH, "utf8"));

    // Initialize provider and signer wallets
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);

    // Retrieve contract address
    const addresses = JSON.parse(fs.readFileSync(CONTRACTS_PATH, "utf8"));
    const badgeAddr = addresses.BadgeNFT;
    if (!badgeAddr) throw new Error("BadgeNFT address not found in contract-addresses.json");

    // Connect to BadgeNFT contract
    const badge = await ethers.getContractAt("BadgeNFT", badgeAddr, signer);

    // Use the issuer's DID as the identity key for testing
    const did = issuer.did;

    // Check if signer has REPUTATION_UPDATER_ROLE
    const repRole = await badge.REPUTATION_UPDATER_ROLE();
    const hasRole = await badge.hasRole(repRole, signer.address);
    if (!hasRole) {
        console.error("❌ Signer does NOT have REPUTATION_UPDATER_ROLE. Cannot update reputation.");
        process.exit(1);
    }

    // Nonce management to ensure no conflicts in transactions
    let nonce = await provider.getTransactionCount(signer.address, "pending");

    // Arrays to store gas and time statistics
    const gasReputation = [], timeReputation = [];

    // Function to send transactions and measure time/gas
    async function sendTx(fn, ...args) {
        const t1 = process.hrtime();
        const txObj = await fn(...args, { nonce });
        const rc = await txObj.wait();
        const dt = process.hrtime(t1);
        const ms = dt[0] * 1000 + dt[1] / 1e6;

        gasReputation.push(Number(rc.gasUsed));
        timeReputation.push(ms);
        nonce++;  // Increment nonce for the next tx
        return ms;
    }
    for(let i=0; i<10; i++) {
        // Bronze badge (Reputation 1)
        await sendTx(badge.updateReputation, did, 1);

        // Silver badge (Reputation 9)
        await sendTx(badge.updateReputation, did, 9);

        // Gold badge (Reputation 40)
        await sendTx(badge.updateReputation, did, 40);

        // Fetch and display updated badge state
        const tokenId = await badge.getTokenIdForDID(did);

        // Verifying soulbound behavior: transfer should revert
        try {
            const tx = await badge.transferFrom(signer.address, signer.address, tokenId, {nonce});
            await tx.wait();
            console.error("Error: transfer succeeded unexpectedly!");
        } catch (error) {
        }
    }

    // Print benchmark statistics
    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("updateReputation gas", gasReputation);
    printStats("updateReputation time (ms)", timeReputation);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});