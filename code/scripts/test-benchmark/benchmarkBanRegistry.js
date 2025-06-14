// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for BanRegistry:
 * - Ban and unban a real DID derived from Ganache mnemonic
 * - Measures gas and execution time
 * Requirements:
 * - Ganache (localhost:8545), IPFS Desktop (localhost:5001)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

// Load holder DID
const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "holder-did.json"), "utf8"));
const holderDID = holder.did;

async function main() {
    console.log("\n===== Benchmark: BanRegistry ban + unban (10 iterations) =====");

    // Load BanRegistry contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!addresses.BanRegistry) {
        console.error("BanRegistry address not found in contract-addresses.json");
        return;
    }
    const BanRegistry = await ethers.getContractAt("BanRegistry", addresses.BanRegistry);

    // Grant permission to the BanRegistry contract
    const [deployer] = await ethers.getSigners();
    let tx = await BanRegistry.changeOwner(deployer.address);
    await tx.wait();

    // Arrays to store gas and time statistics
    const gasBan = [], gasUnban = [], timeBan = [], timeUnban = [];

    // Function to send a transaction and measure time/gas
    async function sendTx(fn, ...args) {
        const t1 = process.hrtime();
        const txObj = await fn(...args);
        const rc = await txObj.wait();
        const dt = process.hrtime(t1);
        const ms = dt[0] * 1000 + dt[1] / 1e6;

        return { gasUsed: Number(rc.gasUsed), time: ms };
    }

    for(let i = 0; i < 10; i++) {
        // Ban the holder DID
        const banResult = await sendTx(BanRegistry.banUser, holderDID);
        gasBan.push(banResult.gasUsed);
        timeBan.push(banResult.time);
        console.log(`✅ Holder DID ${holderDID} has been banned. Gas: ${banResult.gasUsed}, Time: ${banResult.time.toFixed(2)} ms`);

        // Unban the holder DID
        const unbanResult = await sendTx(BanRegistry.unbanUser, holderDID);
        gasUnban.push(unbanResult.gasUsed);
        timeUnban.push(unbanResult.time);
        console.log(`✅ Holder DID ${holderDID} has been unbanned. Gas: ${unbanResult.gasUsed}, Time: ${unbanResult.time.toFixed(2)} ms`);
    }

    // Print benchmark statistics
    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("banUser gas", gasBan);
    printStats("unbanUser gas", gasUnban);
    printStats("banUser time (ms)", timeBan);
    printStats("unbanUser time (ms)", timeUnban);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});