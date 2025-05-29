// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const filePath = path.join(__dirname, "../contract-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const reviewNFT = addresses.ReviewNFT;
    const badgeNFT = addresses.BadgeNFT;
    const reviewStorage = addresses.ReviewStorage;
    const vcRegistry = addresses.VCRegistry;
    const vpVerifier = addresses.VPVerifier;
    const bbsVerifier = addresses.BBSVerifier;
    const semaphoreVerifier = addresses.SemaphoreVerifier;

    const ReviewManager = await ethers.getContractFactory("ReviewManager");
    const manager = await ReviewManager.deploy(
        reviewNFT,
        badgeNFT,
        reviewStorage,
        vcRegistry,
        vpVerifier,
        bbsVerifier,
        semaphoreVerifier
    );

    console.log("✅ ReviewManager deployed to:", manager.target);

    // Save the contract address to JSON file
    addresses.ReviewManager = manager.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});