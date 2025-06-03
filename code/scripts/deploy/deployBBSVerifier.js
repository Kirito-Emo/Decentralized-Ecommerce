// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the BBSVerifier contract.
 * Passes the trusted verifier DID as constructor parameter.
 * Saves deployed contract address in contract-addresses.json.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Compile and deploy the BBSVerifier contract with DID
    const BBSVerifier = await ethers.getContractFactory("BBSVerifier");
    const bBSVerifier = await BBSVerifier.deploy();

    console.log("✅ BBSVerifier deployed to:", bBSVerifier.target);

    // Save the contract address to JSON file
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.BBSVerifier = bBSVerifier.target;

    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});