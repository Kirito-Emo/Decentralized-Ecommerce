// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * BanRegistry interaction script
 * - Ban and unban a real DID derived from Ganache mnemonic
 * - Reads BanRegistry address from contract-addresses.json
 * - Prints ban status before and after
 * Technologies: Hardhat, ethers v6, Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load holder DID
const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "holder-did.json"), "utf8"));
const holderDID = holder.did;

async function main() {
    // Load BanRegistry contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!addresses.BanRegistry) {
        console.error("BanRegistry address not found in contract-addresses.json");
        return;
    }
    const BanRegistry = await ethers.getContractAt("BanRegistry", addresses.BanRegistry);

    // Ban the holder DID
    let tx = await BanRegistry.banUser(holderDID);
    await tx.wait();
    console.log(`✅ Holder DID ${holderDID} has been banned.`);

    // Check ban status (expected to be true)
    const isBanned = await BanRegistry.isDIDBanned(holderDID);
    console.log(`Ban status for ${holderDID}:`, isBanned);

    // Unban the holder DID
    tx = await BanRegistry.unbanUser(holderDID);
    await tx.wait();
    console.log(`✅ Holder DID ${holderDID} has been unbanned.`);

    // Check again (expected to be false)
    const isBanned2 = await BanRegistry.isDIDBanned(holderDID);
    console.log(`Ban status after unban for ${holderDID}:`, isBanned2);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});