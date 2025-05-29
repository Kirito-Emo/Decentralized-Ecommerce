// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();   // Mocking the deployer address
    const VPVerifier = await ethers.getContractFactory("VPVerifier");
    const vpVerifier = await VPVerifier.deploy(deployer.address);

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