// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for Semaphore:
 * - Measures gas and execution time for group creation, member addition, proof validation, and attestation.
 * Requirements:
 * - Ganache (localhost:8545)
 */

const { generateProof } = require("@semaphore-protocol/proof");
const { Identity } = require("@semaphore-protocol/identity");
const { Group } = require("@semaphore-protocol/group");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");

// Load Semaphore contract artifacts (.wasm and .zkey files)
const WASM_PATH = require.resolve("@zk-kit/semaphore-artifacts/semaphore-20.wasm");
const ZKEY_PATH = require.resolve("@zk-kit/semaphore-artifacts/semaphore-20.zkey");

// Load JSON files
function loadJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
}

async function main() {
    console.log("\n===== Benchmark: Semaphore group creation, proof validation =====");

    // Load contract addresses
    const addrs = loadJSON("../contract-addresses.json");
    const issuer = loadJSON("../interact/issuer-did.json");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);

    // Prepare Semaphore and AttestationRegistry contracts
    const semaphore = await ethers.getContractAt("Semaphore", addrs.Semaphore, signer);
    const attestationReg = await ethers.getContractAt("AttestationRegistry", addrs.AttestationRegistry, signer);

    // Arrays to store gas and time statistics
    const gasGroupCreate = [], gasMemberAdd = [], gasProofValidation = [], gasAttestation = [];
    const timeGroupCreate = [], timeMemberAdd = [], timeProofValidation = [], timeAttestation = [];

    // Function to send transaction and measure gas/time
    async function sendTx(fn, ...args) {
        const t1 = process.hrtime();
        const txObj = await fn(...args);
        const rc = await txObj.wait();
        const dt = process.hrtime(t1);
        const ms = dt[0] * 1000 + dt[1] / 1e6;

        return { gasUsed: Number(rc.gasUsed), time: ms };
    }

    // Benchmark for 10 iterations
    for (let i = 0; i < 10; i++) {
        // Create Group
        try {
            const groupCreateResult = await sendTx(semaphore.createGroup);
            gasGroupCreate.push(groupCreateResult.gasUsed);
            timeGroupCreate.push(groupCreateResult.time);
        } catch (err) {
            console.error(`Error creating group: ${err.message}`);
            continue;  // Skip this iteration if group creation fails
        }

        let groupId = await semaphore.groupCounter();
        groupId -= 1n;
        const groupObj = new Group();
        const identity = new Identity();
        groupObj.addMember(identity.commitment);

        // Add Member to Group
        try {
            const memberAddResult = await sendTx(semaphore.addMember, groupId, identity.commitment);
            gasMemberAdd.push(memberAddResult.gasUsed);
            timeMemberAdd.push(memberAddResult.time);
        } catch (err) {
            console.error(`Error adding member: ${err.message}`);
            continue;  // Skip if adding member fails
        }

        // Generate ZKP off-chain
        const CONTEXT = "Decentralized-Ecommerce:ReviewForm-XYZ";
        const rawHash = ethers.keccak256(ethers.toUtf8Bytes(CONTEXT));
        const extNullifier = BigInt(rawHash) >> 8n;

        const signal = "Decentralized Review!";

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

        // Validate Proof on-chain
        try {
            const proofValidationResult = await sendTx(semaphore.validateProof, groupId, {
                merkleTreeDepth: BigInt(proof.merkleTreeDepth),
                merkleTreeRoot: BigInt(proof.merkleTreeRoot),
                nullifier: BigInt(proof.nullifier),
                message: BigInt(proof.message),
                scope: BigInt(proof.scope),
                points: proof.points.map(x => BigInt(x))
            });
            gasProofValidation.push(proofValidationResult.gasUsed);
            timeProofValidation.push(proofValidationResult.time);
        } catch (err) {
            console.error(`Error validating proof: ${err.message}`);
            continue;
        }

        // Anchor attestation on AttestationRegistry
        const subjectHash = ethers.keccak256(ethers.toUtf8Bytes(identity.commitment.toString()));
        const proofHash = ethers.keccak256(ethers.toUtf8Bytes(proof.nullifier.toString()));
        try {
            const attestationResult = await sendTx(attestationReg.recordAttestation, 0, subjectHash, proofHash);
            gasAttestation.push(attestationResult.gasUsed);
            timeAttestation.push(attestationResult.time);
        } catch (err) {
            console.error(`Error anchoring attestation: ${err.message}`);
            continue;
        }
    }

    // Print benchmark statistics
    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("groupCreate gas", gasGroupCreate);
    printStats("memberAdd gas", gasMemberAdd);
    printStats("proofValidation gas", gasProofValidation);
    printStats("attestation gas", gasAttestation);

    printStats("groupCreate time (ms)", timeGroupCreate);
    printStats("memberAdd time (ms)", timeMemberAdd);
    printStats("proofValidation time (ms)", timeProofValidation);
    printStats("attestation time (ms)", timeAttestation);

    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});