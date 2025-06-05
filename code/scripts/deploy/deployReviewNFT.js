// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the ReviewNFT contract
 * Requires BanRegistry address as constructor parameter
 * Assigns MINTER_ROLE to the deployer
 * Saves deployed contract address in contract-addresses.json
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    //Load BanRegistry address from contract-addresses.json
    const filePath = path.join(__dirname, "../contract-addresses.json");
    if (!fs.existsSync(filePath)) {
        console.error("contract-addresses.json not found. Please deploy BanRegistry first.");
        process.exit(1);
    }
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const banRegistryAddr = addresses.BanRegistry;
    if (!banRegistryAddr) {
        console.error("BanRegistry address not found in contract-addresses.json.");
        process.exit(1);
    }

    // Deploy ReviewNFT
    const ReviewNFT = await ethers.getContractFactory("ReviewNFT");
    const reviewNFT = await ReviewNFT.deploy(banRegistryAddr);

    console.log("✅ ReviewNFT deployed to:", reviewNFT.target);

    // Assign MINTER_ROLE to the deployer
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    let tx = await reviewNFT.grantRole(MINTER_ROLE, deployer.address);
    await tx.wait();

    // Save the contract address to JSON file
    addresses.ReviewNFT = reviewNFT.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});