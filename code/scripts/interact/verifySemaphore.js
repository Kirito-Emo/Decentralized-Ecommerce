// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 *  Semaphore script to verify ZKP: group+member creation, proof gen, contract validateProof()
 *  - Requires: @semaphore-protocol/proof - [...]/identity - [...]/group, @zk-kit/semaphore-artifacts@4.0.0
 */

const { generateProof, verifyProof } = require("@semaphore-protocol/proof");
const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load Semaphore contract artifacts (.wasm and .zkey files)
const WASM_PATH = require.resolve("@zk-kit/semaphore-artifacts/semaphore-20.wasm");
const ZKEY_PATH = require.resolve("@zk-kit/semaphore-artifacts/semaphore-20.zkey");

// Load JSON files
function loadJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
}

async function main() {
    const addrs= loadJSON("../contract-addresses.json");
    const issuer = loadJSON("issuer-did.json");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);

    const semaphore= await ethers.getContractAt("Semaphore", addrs.Semaphore, signer);
    const attestationReg = await ethers.getContractAt("AttestationRegistry", addrs.AttestationRegistry, signer);

    console.log("\n----- Interact with Semaphore -----");

    // Manual nonce management
    let nonce = await provider.getTransactionCount(signer.address, "pending");

    // Create group on-chain
    let tx = await semaphore["createGroup()"]({ nonce }); // Written like this due to 2 functions with same name in Semaphore contract
    await tx.wait();
    nonce++;
    const counter = await semaphore.groupCounter();
    const groupId = counter - 1n;
    console.log("✅ Created group id:", groupId.toString());

    // Off-chain: group object and identity
    const groupObj = new Group();
    const identity = new Identity();
    groupObj.addMember(identity.commitment);
    console.log("\nIdentity commitment:", identity.commitment.toString());

    // Add member commitment on-chain
    tx = await semaphore.addMember(groupId, identity.commitment, { nonce });
    await tx.wait();
    nonce++;
    console.log("✅ Commitment added on-chain:", identity.commitment.toString());

    // Context/externalNullifier
    const CONTEXT= "Decentralized-Ecommerce:ReviewForm-XYZ";
    const rawHash= ethers.keccak256(ethers.toUtf8Bytes(CONTEXT));
    const extNullifier = BigInt(rawHash) >> 8n;
    console.log("\nContext:", CONTEXT);
    console.log("Derived externalNullifier:", extNullifier.toString());

    // Off-chain: generate ZK proof
    const signal = "Decentralized Review!";
    const merkleProof = groupObj.generateMerkleProof(0);
    console.log("\nGenerating ZK proof off-chain…");

    const proof = await generateProof(
        identity,
        groupObj,
        signal,
        extNullifier,
        20,
        {
            wasm: WASM_PATH,
            zkey: ZKEY_PATH
        }
    );
    console.log("✅ ZKP generated successfully!");

    const isValid = await verifyProof(proof);
    console.log("\nOff-chain proof valid? ", isValid);

    // On-chain: submit proof via validateProof()
    tx = await semaphore.validateProof(
        groupId,
        {
            merkleTreeDepth: BigInt(proof.merkleTreeDepth),
            merkleTreeRoot: BigInt(proof.merkleTreeRoot),
            nullifier: BigInt(proof.nullifier),
            message: BigInt(proof.message),
            scope: BigInt(proof.scope),
            points: proof.points.map(x => BigInt(x))
        },
        { nonce }
    );
    await tx.wait();
    nonce++;
    console.log("\n✅ Semaphore proof validated on-chain");

    // Anchor attestation on AttestationRegistry
    const subjectHash = ethers.keccak256(ethers.toUtf8Bytes(identity.commitment.toString()));
    const proofHash= ethers.keccak256(ethers.toUtf8Bytes(proof.nullifier.toString()));

    console.log("\nAnchoring attestation…");
    tx = await attestationReg.recordAttestation(0, subjectHash, proofHash, { nonce }); // 0 = Semaphore
    await tx.wait();
    nonce++;
    console.log("✅ Attestation anchored:", { subjectHash, proofHash });

    process.exit(0);
}

main().catch(console.error);