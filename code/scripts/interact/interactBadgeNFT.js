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
    // Load issuer DID credentials
    const issuer = loadJSON("issuer-did.json");

    // Initialize provider and signer wallets
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);
    console.log("Using signer address:", signer.address);

    // Retrieve deployed BadgeNFT address
    const addresses = loadJSON("../contract-addresses.json");
    const badgeAddr = addresses.BadgeNFT;
    if (!badgeAddr) {
        throw new Error("BadgeNFT address not found in contract-addresses.json");
    }
    console.log("Connected to BadgeNFT at:", badgeAddr);

    // Create contract instance connected to signer
    const badge = await ethers.getContractAt("BadgeNFT", badgeAddr, signer);

    // Use the issuer's DID as the identity key for testing
    const did = issuer.did;
    console.log("Testing DID:", did);

    // Reputation deltas to trigger badge levels
    const deltas = [1, 9, 40];
    const levels = ["Bronze", "Silver", "Gold"];

    // Iterate through deltas to mint and upgrade badges
    for (let i = 0; i < deltas.length; i++) {
        const delta = deltas[i];
        const expectedLevel = levels[i];
        console.log(`\nStep ${i + 1}: updateReputation(${delta}) -> expect ${expectedLevel} badge`);

        const txCount = await signer.getNonce(); // Get current nonce for the signer
        const tx = await badge.updateReputation(did, delta, { nonce: txCount });
        await tx.wait();

        // Fetch and display updated badge state
        const currentLevel = await badge.getUserBadge(did);
        const repValue = await badge.getReputation(did);
        const tokenId = await badge.getTokenIdForDID(did);

        const LEVEL_NAMES = ["None", "Bronze", "Silver", "Gold"];
        console.log(`BadgeLevel: ${LEVEL_NAMES[currentLevel]}`);
        console.log(`Reputation: ${repValue}`);
        if (i === 0) {
            // Token ID assigned only on mint
            console.log(`TokenId: ${tokenId}`);
        }
    }

    // Verify soulbound behavior: transfers should revert
    console.log("\nVerifying non-transferability...");
    const ownedTokenId = await badge.getTokenIdForDID(did);
    try {
        await badge.transferFrom(signer.address, signer.address, ownedTokenId);
        console.error("Error: transfer succeeded unexpectedly");
    } catch (error) {
        console.log("Transfer prevented as expected:", error.message.split("\n")[0]);
    }

    console.log("\nAll interactions complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});