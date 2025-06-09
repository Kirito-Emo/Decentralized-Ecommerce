// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * ReviewStorage interaction script
 * - Uploads review text to IPFS (IPFS Desktop API on localhost:5001)
 * - Stores review for a real holder DID
 * - Updates the review with a second version (new content, new IPFS CID)
 * Technologies: Hardhat, ethers v6, Ganache (localhost:8545), ipfs-http-client
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { create } = require("ipfs-http-client");

// Load holder DID
const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "holder-did.json"), "utf8"));
const holderDID = holder.did;

async function main() {
    console.log("\n----- Interact with Review Storage -----");

    // Set up IPFS client (IPFS Desktop, default API port 5001)
    const ipfs = create({ url: "http://localhost:5001" });

    // Review text v1
    const reviewText1 = "This is my first honest review, uploaded to IPFS!";
    const { cid: cid1 } = await ipfs.add({ content: reviewText1 });
    const ipfsCID1 = cid1.toString();
    console.log("✅ Review v1 uploaded to IPFS:", ipfsCID1);

    // Load ReviewStorage contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const ReviewStorage = await ethers.getContractAt("ReviewStorage", addresses.ReviewStorage);

    // Store the review on-chain
    let tx = await ReviewStorage.storeReview(holderDID, ipfsCID1);
    let receipt = await tx.wait();

    // Find ReviewStored event for reviewId
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === "ReviewStored");
    const reviewId = event ? event.args.reviewId : null;
    console.log(`✅ Review stored for DID ${holderDID} with reviewId ${reviewId}`);

    // Review text v2
    const reviewText2 = "This is my UPDATED review, with better insights. Still on IPFS!";
    const { cid: cid2 } = await ipfs.add({ content: reviewText2 });
    const ipfsCID2 = cid2.toString();
    console.log("\n✅ Review v2 uploaded to IPFS:", ipfsCID2);

    // Update the review on-chain
    if (reviewId !== null) {
        tx = await ReviewStorage.updateReview(reviewId, ipfsCID2, holderDID);
        await tx.wait();
        console.log(`✅ Review updated for reviewId ${reviewId}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});