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
    const [user, other] = await ethers.getSigners();
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));

    const reviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);
    const manager = await ethers.getContractAt("ReviewManager", addresses.ReviewManager);

    console.log("👤 User:", user.address);

    // Mint NFT
    const mintTx = await reviewNFT.mintNFT(user.address, 42, "ipfs://fake-meta");
    await mintTx.wait();
    console.log("✅ NFT minted");

    // Upload prima review
    const originalPath = path.join(__dirname, "review.txt");
    if (!fs.existsSync(originalPath)) {
        fs.writeFileSync(originalPath, "Original review on IPFS.");
    }
    const cid1 = await uploadToIPFS(originalPath);

    // Submit review
    const txSubmit = await manager.submitReview(1, `ipfs://${cid1}`);
    const receipt = await txSubmit.wait();
    if (!receipt.events) {
        console.error("No events found in transaction receipt:", receipt);
        process.exit(1);
    }
    const reviewEvent = receipt.events.find(e => e.event === "ReviewSubmitted");
    if (!reviewEvent) {
        console.error("ReviewSubmitted event not found. Events:", receipt.events);
        process.exit(1);
    }
    const reviewId = reviewEvent.args.reviewId;
    console.log("📝 Review sent with ID: ", reviewId.toString());

    // Upload 2nd review
    const modPath = path.join(__dirname, "review_modificata.txt");
    fs.writeFileSync(modPath, "Modified review on IPFS.");
    const cid2 = await uploadToIPFS(modPath);

    // Review modified
    const txEdit = await manager.editReview(reviewId, `ipfs://${cid2}`);
    await txEdit.wait();
    console.log("✏️ Review modified.");

    // Review revoked
    const txRevoke = await manager.revokeReview(reviewId);
    await txRevoke.wait();
    console.log("❌ Review revoked.");

    // Reputation
    const rep = await manager.getReputation(user.address);
    console.log("🏅 Reputation: ", rep.toString());

    // ZKP VP
    const proof = "0x1234";
    const signals = ["0xaaaa", "0xbbbb"];
    const vpCheck = await manager.verifyZKP(proof, signals, "vp");
    console.log("🔐 VP Proof valid?", vpCheck);

    // ZKP BBS
    const bbsCheck = await manager.verifyZKP(proof, signals, "bbs");
    console.log("🔐 BBS+ Proof valid?", bbsCheck);

    // ZKP Semaphore
    const pA = [1, 2];
    const pB = [[3, 4], [5, 6]];
    const pC = [7, 8];
    const pubSignals = [9, 10, 11, 12];
    const depth = 20;
    const semaCheck = await manager.verifySemaphoreProof(pA, pB, pC, pubSignals, depth);
    console.log("🔐 Semaphore Proof valid?", semaCheck);

    // Ban user test
    await manager.banUser(other.address);
    const isBanned = await manager.isBanned(other.address);
    console.log("🚫 User banned!", isBanned);
}

main().catch(console.error);