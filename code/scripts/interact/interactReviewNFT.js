// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * ReviewNFT interaction script
 * - Mints a soulbound NFT for a holder DID, linked to a productId and review (IPFS CID)
 * - Uses the NFT (marks as used)
 * Technologies: Hardhat, ethers v6, Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load holder DID and the latest review CID from previous step
const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "holder-did.json"), "utf8"));
const holderDID = holder.did;

// Load the review CID just used (assume from last run of ReviewStorage script)
const reviewCIDs = [ ];
// For demo, use placeholder:
const ipfsCID = "Qm..."

const productId = 42;

async function main() {
    console.log("\n----- Interact with ReviewNFT -----");

    // Load ReviewNFT contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const ReviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);

    // Mint NFT for holder
    let tx = await ReviewNFT.mintNFT(holderDID, productId, ipfsCID);
    let receipt = await tx.wait();

    // Find NFTMinted event to get tokenId
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === "NFTMinted");
    const tokenId = event ? event.args.tokenId : null;
    console.log(`✅ ReviewNFT minted for DID ${holderDID} (productId ${productId}), tokenId: ${tokenId}`);

    // Use NFT (mark as used)
    if (tokenId !== null) {
        tx = await ReviewNFT.useNFT(tokenId, holderDID);
        await tx.wait();
        console.log(`✅ ReviewNFT with tokenId ${tokenId} has been marked as used.`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});