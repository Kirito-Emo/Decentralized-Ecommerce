// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for ReviewStorage contract.
 * - Uploads two versions of a review to local IPFS Desktop.
 * - Stores, updates, and revokes the review on-chain for a demo DID.
 * - Prints the full review history and latest version details.
 *
 * Requirements:
 * - IPFS Desktop running locally (http://localhost:5001)
 * - review.txt and review_modified.txt created in the scripts/interact/ directory.
 * - DID must be consistent with your demo user logic.
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { ethers } = require("hardhat");

async function uploadToIPFS(filePath) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    const res = await axios.post("http://localhost:5001/api/v0/add", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
    });

    let data = res.data;
    if (typeof data === "string") {
        const lines = data.trim().split("\n");
        data = JSON.parse(lines[lines.length - 1]);
    }

    return data.Hash;
}

async function main() {
    const did = "did:web:localhost8082:ema"; // Mock DID
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const reviewStorage = await ethers.getContractAt("ReviewStorage", addresses.ReviewStorage);

    // Upload first version of the review to IPFS
    const originalFile = path.join(__dirname, "review.txt");
    if (!fs.existsSync(originalFile)) fs.writeFileSync(originalFile, "This is the original review on IPFS.");
    const cid1 = await uploadToIPFS(originalFile);
    console.log("✅ CID: ", cid1);

    // Store review on-chain
    const tx1 = await reviewStorage.storeReview(did, `ipfs://${cid1}`);
    const receipt1 = await tx1.wait();
    const iface = reviewStorage.interface;
    const log = receipt1.logs
        .map(l => {
            try { return iface.parseLog(l); } catch { return null; }
        })
        .find(e => e && e.name === "ReviewStored");
    if (!log) throw new Error("ReviewStored event not found!");
    const reviewId = log.args.reviewId;
    console.log("📝 Review saved with ID: ", reviewId.toString());

    // Upload second (modified) version of the review to IPFS
    const modifiedFile = path.join(__dirname, "review_modified.txt");
    fs.writeFileSync(modifiedFile, "This is the modified review on IPFS.");
    const cid2 = await uploadToIPFS(modifiedFile);
    console.log("✏️ CID modified: ", cid2);

    // Update review on-chain
    const tx2 = await reviewStorage.updateReview(reviewId, `ipfs://${cid2}`, did);
    await tx2.wait();
    console.log("✅ Review modified.");

    // Revoke review on-chain
    const tx3 = await reviewStorage.revokeReview(reviewId, did);
    await tx3.wait();
    console.log("🚫 Review revoked.");

    // Fetch full review history
    const history = await reviewStorage.getHistory(reviewId);
    console.log("\n📚 Review history: ");
    history.forEach((entry, idx) => {
        console.log(` ${idx + 1}. CID: ${entry.ipfsCID} | Data: ${new Date(Number(entry.timestamp) * 1000).toLocaleString()}`);
    });

    // Print current state
    const [lastCID, isRevoked, lastUpdate] = await reviewStorage.getLatestReview(reviewId);
    console.log(`\n📌 Last version:\n CID: ${lastCID}\n Revoked: ${isRevoked}\n Timestamp: ${new Date(Number(lastUpdate) * 1000).toLocaleString()}`);
}

main().catch(console.error);