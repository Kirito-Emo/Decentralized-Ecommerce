// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * @dev Interaction script for the BadgeNFT smart contract
 *      Demonstrates minting and upgrading soulbound badges based on reputation deltas
 *      Also verifies non-transferability of the NFT
 *
 * Requirements:
 *   - BadgeNFT deployed and address stored in contract-addresses.json under key "BadgeNFT"
 *   - issuer-did.json containing { address, privateKey, did } (run fetchDID.js first)
 *
 * Tech: Hardhat, ethers v6, Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load JSON file
function loadJSON(file) {
    const filePath = path.join(__dirname, file);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
    console.log("\n----- Interact with BadgeNFT -----");

    // Load issuer DID credentials
    const issuer = loadJSON("issuer-did.json");

    // Initialize provider and signer wallets
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);
    console.log("Using signer address:", signer.address);

    // Retrieve contract address
    const addresses = loadJSON("../contract-addresses.json");
    const badgeAddr = addresses.BadgeNFT;
    if (!badgeAddr) throw new Error("BadgeNFT address not found in contract-addresses.json");
    console.log("Connected to BadgeNFT at:", badgeAddr);

    // Connect to BadgeNFT contract
    const badge = await ethers.getContractAt("BadgeNFT", badgeAddr, signer);

    // Use the issuer's DID as the identity key for testing
    const did = issuer.did;
    console.log("Testing DID:", did);

    // Check if signer has REPUTATION_UPDATER_ROLE
    const repRole = await badge.REPUTATION_UPDATER_ROLE();
    const hasRole = await badge.hasRole(repRole, signer.address);
    if (!hasRole) {
        console.error("❌ Signer does NOT have REPUTATION_UPDATER_ROLE. Cannot update reputation.");
        process.exit(1);
    }

    // Function to send a tx with current nonce
    let nonce = await provider.getTransactionCount(signer.address, "pending");

    async function sendTx(fn, ...args) {
        const txObj = await fn(...args, { nonce });
        console.log(`\n⏳ Sent tx: ${txObj.hash} [nonce=${nonce}]`);
        await txObj.wait();
        console.log(`✅ Tx mined [nonce=${nonce}]`);
        nonce++;
    }

    // Step 1: Bronze
    await sendTx(badge.updateReputation, did, 1);
    console.log("Bronze badge acquired");

    // Step 2: Silver
    await sendTx(badge.updateReputation, did, 9);
    console.log("Silver badge acquired");

    // Step 3: Gold
    await sendTx(badge.updateReputation, did, 40);
    console.log("Gold badge acquired");

    // Fetch and display updated badge state
    const levels = ["None", "Bronze", "Silver", "Gold"];
    const currentLevel = await badge.getUserBadge(did);
    const repValue = await badge.getReputation(did);
    const tokenId = await badge.getTokenIdForDID(did);
    console.log(`\nBadgeLevel: ${levels[currentLevel]}`);
    console.log(`Reputation: ${repValue}`);
    console.log(`TokenId: ${tokenId}`);

    // Verify soulbound behavior: transfer should revert
    console.log("\nVerifying non-transferability...");
    try {
        // Manually set nonce for the transfer tx as well
        const tx = await badge.transferFrom(signer.address, signer.address, tokenId, { nonce });
        await tx.wait();
        console.error("Error: transfer succeeded unexpectedly!");
        nonce++;
    } catch (error) {
        console.log("Transfer prevented as expected:", error.message.split("\n")[0]);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});