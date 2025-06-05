// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the BadgeNFT smart contract
 * Requires BanRegistry address as constructor parameter
 * Assigns REPUTATION_UPDATER_ROLE to the deployer
 * Saves contract address in contract-addresses.json for further deployments
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Load BanRegistry address from contract-addresses.json
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

    // Deploy the BadgeNFT contract
    const BadgeNFT = await ethers.getContractFactory("BadgeNFT");
    const badgeNFT = await BadgeNFT.deploy(banRegistryAddr);

    console.log("✅ BadgeNFT deployed to:", badgeNFT.target);

    // Assign REPUTATION_UPDATER_ROLE to the deployer
    const REPUTATION_UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REPUTATION_UPDATER_ROLE"));
    let tx = await badgeNFT.grantRole(REPUTATION_UPDATER_ROLE, deployer.address);
    await tx.wait();

    // Save the contract address to JSON file
    addresses.BadgeNFT = badgeNFT.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});