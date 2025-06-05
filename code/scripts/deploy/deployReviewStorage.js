// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the ReviewStorage contract
 * Requires BanRegistry address as constructor parameter
 * Saves deployed address in contract-addresses.json
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Load BanRegistry address from contract-addresses.json
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
        console.error("contract-addresses.json not found. Please deploy BanRegistry first.");
        return;
    }
    const banRegistryAddr = addresses.BanRegistry;
    if (!banRegistryAddr) {
        console.error("BanRegistry address not found in contract-addresses.json.");
        return;
    }

    const ReviewStorage = await ethers.getContractFactory("ReviewStorage");
    const reviewStorage = await ReviewStorage.deploy(banRegistryAddr);

    console.log("✅ ReviewStorage deployed to:", reviewStorage.target);

    // Save the contract address to JSON file
    addresses.ReviewStorage = reviewStorage.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});