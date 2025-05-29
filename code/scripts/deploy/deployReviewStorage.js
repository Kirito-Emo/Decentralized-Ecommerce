// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const ReviewStorage = await ethers.getContractFactory("ReviewStorage");
    const reviewStorage = await ReviewStorage.deploy();

    console.log("✅ ReviewStorage deployed to:", reviewStorage.target);

    // Save the contract address to JSON file
    const filePath = path.join(__dirname, "../contract-addresses.json");
    let addresses = {};

    if (fs.existsSync(filePath)) {
        addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    addresses.ReviewStorage = reviewStorage.target;

    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});