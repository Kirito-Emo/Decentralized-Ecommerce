// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the VPVerifier contract.
 * Passes the trusted verifier DID as constructor parameter.
 * Saves deployed contract address in contract-addresses.json.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Compile and deploy the VPVerifier contract with DID
    const VPVerifier = await ethers.getContractFactory("VPVerifier");
    const vpVerifier = await VPVerifier.deploy();

    console.log("✅ VPVerifier deployed to:", vpVerifier.target);

    // Save the contract address to JSON file
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.VPVerifier = vpVerifier.target;

    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});