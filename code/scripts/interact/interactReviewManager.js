// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for DID-centric ReviewManager, ReviewNFT, and ReviewStorage contracts.
 * - Mints a PoP NFT for a DID.
 * - Uploads review content to IPFS and submits the review via ReviewManager.
 * - Edits and revokes the review, printing all states and reputation.
 * - Checks ZKP (VP, BBS+) and Semaphore proofs (dummy/demo).
 * - Bans another DID and fetches reviews for a given DID.
 *
 * Requirements:
 * - All contracts deployed and addresses in contract-addresses.json.
 * - IPFS Desktop running locally.
 * - Files review.txt and review_modified.txt are used for review content.
 * - DID strings must be consistent throughout the script.
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
    const did = "did:web:localhost8443:ema"; // Mock DID for the user
    const otherDID = "did:web:localhost8443:fra"; // Mock DID for another user
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const storage = await ethers.getContractAt("ReviewStorage", addresses.ReviewStorage);

    // ReviewNFT: grant MINTER_ROLE to signer and ReviewManager
    const ReviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    let tx = await ReviewNFT.grantRole(MINTER_ROLE, addresses.ReviewManager); // Grant MINTER_ROLE to ReviewManager
    await tx.wait();

    // BadgeNFT: grant REPUTATION_UPDATER_ROLE to signer and ReviewManager
    const BadgeNFT = await ethers.getContractAt("BadgeNFT", addresses.BadgeNFT);
    const REPUTATION_UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REPUTATION_UPDATER_ROLE"));
    tx = await BadgeNFT.grantRole(REPUTATION_UPDATER_ROLE, addresses.ReviewManager); // Grant REPUTATION_UPDATER_ROLE to ReviewManager
    await tx.wait();

    console.log("👤 DID:", did);

    // Mint NFT (returns NFTMinted event with tokenId)
    const reviewNFT = await ethers.getContractAt("ReviewNFT", addresses.ReviewNFT);
    const mintTx = await reviewNFT.mintNFT(did, 42, "ipfs://fake-meta");
    const mintReceipt = await mintTx.wait();
    const mintEvent = mintReceipt.logs
        .map(log => { try { return reviewNFT.interface.parseLog(log); } catch { return null; } })
        .find(e => e && e.name === "NFTMinted");
    if (!mintEvent) {
        console.error("NFTMinted event not found. Aborting.");
        process.exit(1);
    }
    const tokenId = mintEvent.args.tokenId;
    console.log("✅ NFT minted with tokenId:", tokenId.toString());

    // Upload first review to IPFS
    const originalPath = path.join(__dirname, "review.txt");
    if (!fs.existsSync(originalPath)) {
        fs.writeFileSync(originalPath, "Original review on IPFS.");
    }
    const cid1 = await uploadToIPFS(originalPath);

    // Submit review (returns ReviewSubmitted event with reviewId)
    const manager = await ethers.getContractAt("ReviewManager", addresses.ReviewManager);
    const txSubmit = await manager.submitReview(did, tokenId, `ipfs://${cid1}`);
    const receipt = await txSubmit.wait();
    const reviewEvent = receipt.logs
        .map(log => { try { return manager.interface.parseLog(log); } catch { return null; } })
        .find(e => e && e.name === "ReviewSubmitted");
    if (!reviewEvent) {
        console.error("ReviewSubmitted event not found. Aborting.");
        process.exit(1);
    }
    const reviewId = reviewEvent.args.reviewId;
    console.log("📝 Review sent with ID:", reviewId.toString());

    // Upload second review (modified) to IPFS
    const modPath = path.join(__dirname, "review_modified.txt");
    fs.writeFileSync(modPath, "Modified review on IPFS.");
    const cid2 = await uploadToIPFS(modPath);

    // Edit review
    const txEdit = await manager.editReview(did, reviewId, `ipfs://${cid2}`);
    await txEdit.wait();
    console.log("✏️ Review modified.");

    // Revoke review
    const txRevoke = await manager.revokeReview(did, reviewId);
    await txRevoke.wait();
    console.log("❌ Review revoked.");

    // Check reputation
    const rep = await manager.getReputation(did);
    console.log("🏅 Reputation for", did + ":", rep.toString());

    // Test ZKP VP
    const proof = "0x1234";
    const signals = [
        "0x" + "a".repeat(64),
        "0x" + "b".repeat(64)
    ];
    const vpCheck = await manager.verifyZKP(proof, signals, "vp");
    console.log("🔐 VP Proof valid?", vpCheck);

    // Test ZKP BBS+
    const bbsCheck = await manager.verifyZKP(proof, signals, "bbs");
    console.log("🔐 BBS+ Proof valid?", bbsCheck);

    // Test ZKP Semaphore
    const pA = [1, 2];
    const pB = [[3, 4], [5, 6]];
    const pC = [7, 8];
    const pubSignals = [9, 10, 11, 12];
    const depth = 20;
    const semaCheck = await manager.verifySemaphoreProof(pA, pB, pC, pubSignals, depth);
    console.log("🔐 Semaphore Proof valid?", semaCheck);

    // Retrieve all review IDs by user (DID)
    const userReviews = await storage.getReviewsByAuthor(did);
    console.log("📚 Review IDs by", did + ":", userReviews.map(id => id.toString()));

    // Ban another DID (moderator only)
    await manager.banUser(otherDID);
    const isBanned = await manager.isBanned(otherDID);
    console.log("🚫 User banned!", isBanned);
}

main().catch(console.error);