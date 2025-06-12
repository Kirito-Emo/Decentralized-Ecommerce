// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * SD-JWT Verifiable Presentation generator/verifier (off-chain)
 * Always uses selective disclosure (SD-JWT) for maximum privacy
 */

const { createVerifiablePresentationJwt, verifyPresentation } = require("did-jwt-vc");
const { ethers } = require("ethers");
const crypto = require("crypto");
const { Resolver } = require("did-resolver");
const ethrDidResolver = require("ethr-did-resolver");
const fs = require("fs");
const path = require("path");

// Load issuer and addresses
const issuer = JSON.parse(fs.readFileSync(path.join(__dirname, "../interact/issuer-did.json"), "utf8"));
const addrs = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));

// Retrieve chain ID, RPC URL, and DID registry address
const chainId = issuer.chainNameOrId;
const rpcUrl = issuer.rpcUrl;
const registry = addrs.DIDRegistry;

// Directory to save generated proofs
const PROOFS_DIR = path.join(__dirname, "./proofs");
if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR);

/**
 * Generate SD-JWT VP, verify off-chain, compute subject/proof hashes, save proof as JSON file
 */
async function generateAndSaveSDVP(vc, holderDidInstance, fieldsToDisclose) {
    // Generate salts and hashes for all fields in VC
    const claims = vc.credentialSubject;
    const salts = {};
    const hashes = {};
    for (const field in claims) {
        if (field === "id") continue;
        const salt = crypto.randomBytes(16).toString("hex");
        salts[field] = salt;
        hashes[field] = crypto.createHash("sha256").update(salt + claims[field]).digest("hex");
    }

    // Compose SD-style VC (with only hashes)
    const sdVcPayload = {
        ...vc,
        vc: {
            ...vc.vc,
            credentialSubject: { hashes: Object.values(hashes) }
        }
    };

    // Select the field to disclose
    const field = fieldsToDisclose[0]; // Disclosing only the first field for simplicity
    const disclosedClaim = {
        field,
        value: claims[field],
        salt: salts[field]
    };

    // VP JWT generation
    const vpPayload = {
        vp: {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiablePresentation"],
            verifiableCredential: [sdVcPayload]
        },
        disclosedClaim
    };
    const vpJwt = await createVerifiablePresentationJwt(vpPayload, holderDidInstance);

    // Resolver setup
    const resolver = new Resolver(
        ethrDidResolver.getResolver({
            networks: [
                {
                    name: chainId.toString(),
                    chainId: parseInt(chainId),
                    rpcUrl,
                    registry
                }
            ]
        })
    );

    // Off-chain verification
    let proofValid = false;
    let storedHashes = [];
    try {
        const result = await verifyPresentation(vpJwt, resolver);
        storedHashes = result.verifiablePresentation.verifiableCredential[0].credentialSubject.hashes;
        // Check disclosed claim matches any stored hash
        const recomputed = crypto.createHash('sha256').update(disclosedClaim.salt + disclosedClaim.value).digest("hex");
        proofValid = storedHashes.includes(recomputed);
    } catch (e) {
        proofValid = false;
    }

    // Compute hashes for on-chain anchoring
    const subjectHash = ethers.keccak256(ethers.toUtf8Bytes(vc.credentialSubject.id));      // Hash of the DID
    const proofHash = ethers.keccak256(ethers.toUtf8Bytes(disclosedClaim.salt + disclosedClaim.value));     // Hash only of disclosed part

    // --- Save as a file for frontend consumption ---
    const fileName = `VP_${Date.now()}.json`;
    const filePath = path.join(PROOFS_DIR, fileName);

    const proofData = {
        proofType: "VP",
        proofValid,
        disclosedClaim,
        subjectHash,
        proofHash,
        vpJwt,
        vcId: vc.credentialSubject.id,
        storedHashes,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(proofData, null, 2));

    // Return proof for UI (omitting filePath for security)
    return { ...proofData };
}

module.exports = { generateAndSaveSDVP };