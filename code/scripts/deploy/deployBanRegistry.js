// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the BanRegistry smart contract
 * The deployer is set as initial owner (moderator)
 * Saves contract address in contract-addresses.json
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Deploy BanRegistry
    const BanRegistry = await ethers.getContractFactory("BanRegistry");
    const banRegistry = await BanRegistry.deploy();

    console.log("✅ BanRegistry deployed to:", banRegistry.target);

    // Save contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.BanRegistry = banRegistry.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});