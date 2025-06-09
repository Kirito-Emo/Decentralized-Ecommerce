// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 *  Developer script: creates, signs and verifies a BBS+ proof.
 *  - Outputs hashes for AttestationRegistry
 *
 *  Required: @mattrglobal/bbs-signatures
 */

const { generateBls12381G2KeyPair, blsSign, blsVerify, blsCreateProof, blsVerifyProof } = require("@mattrglobal/bbs-signatures");
const { ethers } = require("ethers");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function save(file, data) {
    fs.writeFileSync(path.join(__dirname, file), JSON.stringify(data, null, 2));
}

async function main() {
    console.log("\n----- Interact with BBS+ -----");

    // Key generation
    const keyPair = await generateBls12381G2KeyPair();
    console.log("BBS+ Key Pair generated");

    // BBS+ messages to sign
    const msgs = [ "My name is Emanuele", "My reputation is: 20", "My country is IT" ].map(s =>
        Uint8Array.from(Buffer.from(s, "utf8")));

    // Sign messages (BBS+ signature)
    const signature = await blsSign({
        keyPair,
        messages: msgs
    });

    // Verify signature
    const verified = await blsVerify({
        publicKey: keyPair.publicKey,
        messages: msgs,
        signature
    });
    console.log("\n✅ BBS+ signature verified:", verified.verified);

    const nonce = crypto.randomBytes(16); // Random nonce for proof generation (to avoid replay attacks)

    // Create selective disclosure proof (reveal only the last message)
    const proof = await blsCreateProof({
        signature,
        publicKey: keyPair.publicKey,
        messages: msgs,
        revealed: [0],
        nonce
    });
    console.log("\n✅ Proof generated successfully:", proof);

    // Verify the selective disclosure proof
    const proofResult = await blsVerifyProof({
        proof,
        publicKey: keyPair.publicKey,
        messages: [ msgs[0] ],     // Only the revealed message
        nonce                      // Must match the nonce used in proof creation
    });
    console.log("\n✅ BBS+ selective disclosure proof verified:", proofResult.verified);

    // Hash for anchoring
    const subjectHash = ethers.keccak256(msgs[0]); // can be replaced with subject DID
    const proofHash = ethers.keccak256(Buffer.from(proof));
    save("bbs_attestation.json", { subjectHash, proofHash });

    console.log("\nBBS+ subjectHash:", subjectHash);
    console.log("BBS+ proofHash:", proofHash);
}

main().catch(console.error);