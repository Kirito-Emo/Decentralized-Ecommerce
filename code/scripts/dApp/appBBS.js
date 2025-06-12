// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * BBS+ selective disclosure proof generator/verifier (off-chain)
 * Anchors only proof outcome (hashes) for maximum privacy
 */

const { generateBls12381G2KeyPair, blsSign, blsVerify, blsCreateProof, blsVerifyProof } = require("@mattrglobal/bbs-signatures");
const { ethers } = require("ethers");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Directory to save generated proofs
const PROOFS_DIR = path.join(__dirname, "./proofs");
if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR);

/**
 * Generates BBS+ selective disclosure proof and verifies it off-chain
 * Saves the resulting proof as a JSON file in the proofs folder
 */
async function generateAndSaveBBSProof(badgeNFTAddress, reputation, badgeLevel) {
    // Generate BBS+ key pair for the user
    const keyPair = await generateBls12381G2KeyPair();

    // Compose BBS+ messages (private reputation, private badgeNFT address, public badge level)
    const msgs = [
        Uint8Array.from(Buffer.from(badgeNFTAddress, "utf8")),          // 0: Subject (private)
        Uint8Array.from(Buffer.from(reputation.toString(), "utf8")),    // 1: Reputation (private)
        Uint8Array.from(Buffer.from(badgeLevel.toString(), "utf8")),    // 2: Badge Level (to be disclosed)
    ];

    // Sign all messages
    const signature = await blsSign({ keyPair, messages: msgs });

    // Verify signature for sanity (should always be true)
    const verified = await blsVerify({ publicKey: keyPair.publicKey, messages: msgs, signature });

    // Generate selective disclosure proof
    const nonce = crypto.randomBytes(16); // To avoid replay
    const proof = await blsCreateProof({
        signature,
        publicKey: keyPair.publicKey,
        messages: msgs,
        revealed: [2], // Disclose only badgeLevel (index 2)
        nonce
    });

    // Verify the proof (off-chain)
    const proofResult = await blsVerifyProof({
        proof,
        publicKey: keyPair.publicKey,
        messages: [msgs[2]], // Only badgeLevel revealed
        nonce
    });

    // Compute subjectHash (badgeNFT address) and proofHash (proof bytes)
    const subjectHash = ethers.keccak256(Uint8Array.from(Buffer.from(badgeNFTAddress, "utf8")));
    const proofHash = ethers.keccak256(Buffer.from(proof));

    // Save the proof and metadata as a JSON file
    const fileName = `BBS_${Date.now()}.json`;
    const filePath = path.join(PROOFS_DIR, fileName);

    const proofData = {
        proofType: "BBS",
        proofValid: proofResult.verified,
        subjectHash,
        proofHash,
        badgeNFTAddress,
        badgeLevel,
        proof: Buffer.from(proof).toString("base64"),
        publicKey: Buffer.from(keyPair.publicKey).toString("base64"),
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(proofData, null, 2));

    // Return proof for UI (omitting filePath for security)
    return { ...proofData };
}

module.exports = { generateAndSaveBBSProof };