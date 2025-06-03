// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for BadgeNFT contract.
 * Updates the reputation of a DID and fetches the badge level.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Mock DID to use for the interaction
    const did = "did:web:localhost8443:ema";

    // Load deployed contract address from JSON
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const badgeNFT = await ethers.getContractAt("BadgeNFT", addresses.BadgeNFT);

    // Update reputation for the DID (+10)
    const tx = await badgeNFT.updateReputation(did, 10);
    await tx.wait();
    const rep = await badgeNFT.getReputation(did);
    console.log(`Reputation for ${did}:`, rep.toString());

    // Fetch badge level for the DID
    const badgeLevel = await badgeNFT.getUserBadge(did);
    const BADGE_ENUM = ["None", "Bronze", "Silver", "Gold"];
    console.log("🏅 Badge level for", did, ":", BADGE_ENUM[Number(badgeLevel)]);
}

main().catch(console.error);