// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const [user] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));

    const reviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);

    const tx = await reviewNFT.mintNFT(user.address, 101, "ipfs://mock-review-token");
    await tx.wait();

    const status = await reviewNFT.getNFTStatus(1);
    console.log("📦 NFT status: ", status); // 0 = Valid
}

main().catch(console.error);