// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
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
    const [user] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));
    const reviewStorage = await ethers.getContractAt("ReviewStorage", addresses.ReviewStorage);

    // Upload prima versione
    const originalFile = path.join(__dirname, "review.txt");
    if (!fs.existsSync(originalFile)) fs.writeFileSync(originalFile, "This is the original review on IPFS.");
    const cid1 = await uploadToIPFS(originalFile);
    console.log("✅ CID: ", cid1);

    // Salva review on-chain
    const tx1 = await reviewStorage.storeReview(user.address, `ipfs://${cid1}`);
    const receipt1 = await tx1.wait();
    const reviewId = receipt1.events.find(e => e.event === "ReviewStored").args.reviewId;
    console.log("📝 Review saved with ID: ", reviewId.toString());

    // Upload seconda versione
    const modifiedFile = path.join(__dirname, "review_modificata.txt");
    fs.writeFileSync(modifiedFile, "This is the modified review on IPFS.");
    const cid2 = await uploadToIPFS(modifiedFile);
    console.log("✏️ CID modified: ", cid2);

    // Modifica review
    const tx2 = await reviewStorage.updateReview(reviewId, `ipfs://${cid2}`);
    await tx2.wait();
    console.log("✅ Review modified.");

    // Revoca review
    const tx3 = await reviewStorage.revokeReview(reviewId);
    await tx3.wait();
    console.log("🚫 Review revoked.");

    // Recupera storico completo
    const history = await reviewStorage.getHistory(reviewId);
    console.log("\n📚 Review history: ");
    history.forEach((entry, idx) => {
        console.log(` ${idx + 1}. CID: ${entry.ipfsCID} | Data: ${new Date(entry.timestamp * 1000).toLocaleString()}`);
    });

    // Stato attuale
    const [lastCID, isRevoked, lastUpdate] = await reviewStorage.getLatestReview(reviewId);
    console.log(`\n📌 Last version:\n CID: ${lastCID}\n Revoked: ${isRevoked}\n Timestamp: ${new Date(lastUpdate * 1000).toLocaleString()}`);
}

main().catch(console.error);