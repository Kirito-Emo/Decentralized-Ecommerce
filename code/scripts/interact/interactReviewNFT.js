// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for ReviewNFT contract.
 * Mints a new NFT and prints its status as a string (Valid/Used/Expired).
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const did = "did:web:localhost8443:ema"; // Mock DID to use
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const reviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);

    // Mint NFT for productId 101 with mock URI
    const tx = await reviewNFT.mintNFT(did, 101, "ipfs://mock-review-token");
    const receipt = await tx.wait();

    // Get tokenId from event
    const event = receipt.logs.map(log => {
        try {
            return reviewNFT.interface.parseLog(log);
        } catch { return null; }
    }).find(e => e && e.name === "NFTMinted");

    const tokenId = event ? event.args.tokenId : 1; // Fallback to 1 if not found

    // Fetch status
    const status = await reviewNFT.getNFTStatus(tokenId);
    const STATUS_ENUM = ["Valid", "Used", "Expired"];
    console.log(`📦 NFT status for tokenId ${tokenId}:`, STATUS_ENUM[Number(status)]);

    // Check if the NFT is used
    await reviewNFT.useNFT(tokenId, did);
    const statusUsed = await reviewNFT.getNFTStatus(tokenId);
    console.log(`📦 NFT status after use:`, STATUS_ENUM[Number(statusUsed)]);

    // Check if the NFT is expired
    await reviewNFT.expireNFTs([tokenId]);
    const statusExpired = await reviewNFT.getNFTStatus(tokenId);
    console.log(`📦 NFT status after expire:`, STATUS_ENUM[Number(statusExpired)]);
}

main().catch(console.error);