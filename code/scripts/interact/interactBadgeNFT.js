// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [user] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));

    const badgeNFT = await ethers.getContractAt("BadgeNFT", addresses.BadgeNFT);

    await badgeNFT.updateReputation(user.address, 10);
    const badgeLevel = await badgeNFT.getUserBadge(user.address);

    console.log("🏅 Badge level: ", badgeLevel);
}

main().catch(console.error);