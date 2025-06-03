// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the RevocationRegistry contract.
 * Deploys the contract passing the issuerDID as a string.
 * Saves deployed address in contract-addresses.json.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Mocking the Issuer DID
    const issuerDID = "did:web:localhost8443";

    // Compile and deploy the contract with the issuerDID
    const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
    const registry = await RevocationRegistry.deploy(issuerDID);

    console.log("✅ RevocationRegistry deployed to:", registry.target);

    // Save the contract address to JSON file
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.RevocationRegistry = registry.target;

    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});