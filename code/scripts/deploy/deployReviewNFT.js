// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the ReviewNFT contract.
 * Saves deployed contract address in contract-addresses.json.
 * Assigns MINTER_ROLE to the deployer.
 * Ethers.js v6, Hardhat, Ganache localhost:8545.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const ReviewNFT = await ethers.getContractFactory("ReviewNFT");
    const reviewNFT = await ReviewNFT.deploy();

    console.log("✅ ReviewNFT deployed to:", reviewNFT.target);

    // Assign MINTER_ROLE to the deployer
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    let tx = await reviewNFT.grantRole(MINTER_ROLE, deployer.address);
    await tx.wait();

    // Save the contract address to JSON file
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};
    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    addresses.ReviewNFT = reviewNFT.target;

    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});