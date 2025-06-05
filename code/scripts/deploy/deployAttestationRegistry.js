// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the AttestationRegistry contract
 * Saves contract address in contract-addresses.json for further deployments
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Deploy AttestationRegistry
    const AttestationRegistry = await ethers.getContractFactory("AttestationRegistry");
    const attestationRegistry = await AttestationRegistry.deploy();

    console.log("✅ AttestationRegistry deployed to:", attestationRegistry.target);

    // Save contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.AttestationRegistry = attestationRegistry.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});