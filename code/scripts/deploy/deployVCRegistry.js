// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the VCRegistry contract.
 * Passes the issuer DID string as a constructor parameter.
 * Saves the deployed contract address in contract-addresses.json.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Mocking the Issuer DID
    const issuerDID = "did:web:localhost8443";

    // Compile and deploy the VCRegistry contract with issuerDID
    const VCRegistry = await ethers.getContractFactory("VCRegistry");
    const vcRegistry = await VCRegistry.deploy(issuerDID);

    console.log("✅ VCRegistry deployed to:", vcRegistry.target);

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