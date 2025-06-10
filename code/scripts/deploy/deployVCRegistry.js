// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the VCRegistry contract
 * The deployer is set as first trusted issuer
 * Saves the deployed contract address in contract-addresses.json
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Deploy VCRegistry
    const VCRegistry = await ethers.getContractFactory("VCRegistry");
    const vcRegistry = await VCRegistry.deploy();

    console.log("✅ VCRegistry deployed at:", vcRegistry.target);

    // Sets empty CIDs for emitted, revoked and status lists
    await (await vcRegistry.setEmittedListCID("")).wait();
    await (await vcRegistry.setRevokedListCID("")).wait();
    await (await vcRegistry.setStatusListCID("")).wait();

    console.log("Emitted/Revoked/Status List CIDs initialized to empty string.");

    // Save the contract address to JSON file
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.VCRegistry = vcRegistry.target;

    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});