// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * VCRegistry interaction utility
 * Handles on-chain VC issuance/revocation, updates IPFS with emitted/revoked VC lists and anchors the CIDs on-chain for verifiability
 */

const { ethers } = require("ethers");
const { create } = require("ipfs-http-client");
const addresses = require("../contract-addresses.json");
const VCRegistryAbi = require("../../artifacts/contracts/VCRegistry.sol/VCRegistry.json").abi;
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const vcRegistry = new ethers.Contract(addresses.VCRegistry, VCRegistryAbi, provider);
const { loadDb, setUser } = require("./localDb");

// Helper function to send a transaction with the correct nonce (automatically incremented)
async function sendTxWithNonce(contractFn, signer, ...args) {
    const nonce = await signer.provider.getTransactionCount(signer.address, "pending");
    return contractFn(...args, { nonce });
}

/**
 * Publishes the list of all emitted VC hashes to IPFS and updates the on-chain CID
 */
async function updateEmittedVCList(signer) {
    const db = loadDb();
    const allVCs = Object.values(db).map(u => u.vc).filter(Boolean);
    const emittedList = allVCs.map(vc => vc.hash);
    const ipfs = create({ url: "http://127.0.0.1:5001" });
    const { cid } = await ipfs.add(JSON.stringify(emittedList));
    const vcRegistrySigner = vcRegistry.connect(signer);
    await sendTxWithNonce(vcRegistrySigner.setEmittedListCID, signer, cid.toString());
    return cid.toString();
}

/**
 * Publishes the list of all revoked VC hashes to IPFS and updates the on-chain CID
 */
async function updateRevokedVCList(signer) {
    const db = loadDb();
    const allVCs = Object.values(db).map(u => u.vc).filter(Boolean);
    const revokedList = [];

    for (const vc of allVCs) {
        const rec = await vcRegistry.getVC(vc.hash);
        if (rec.revoked) revokedList.push(vc.hash);
    }

    const ipfs = create({ url: "http://127.0.0.1:5001" });
    const { cid } = await ipfs.add(JSON.stringify(revokedList));
    const vcRegistrySigner = vcRegistry.connect(signer);
    await sendTxWithNonce(vcRegistrySigner.setRevokedListCID, signer, cid.toString());
    return cid.toString();
}

/**
 * Issues a new VC for a user and updates the emitted VC list on IPFS and chain
 */
async function issueNewVC(userHash, name, surname, birthDate, nationality, signer, issuerDID) {
    // Prepare VC and compute its hash (you might want to standardize VC creation elsewhere)
    const issuanceDate = new Date().toISOString();
    const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const credentialSubject = { id: userHash, name, surname, birthDate, nationality };

    const vc = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential"],
        issuer: issuerDID,
        issuanceDate,
        expirationDate,
        credentialSubject,
    };
    const hash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(vc)));

    // Register on-chain (ensure signer is trusted issuer)
    const vcRegistrySigner = vcRegistry.connect(signer);
    await sendTxWithNonce(vcRegistrySigner.registerVC, signer, hash, issuerDID, userHash);

    // Save VC in local DB
    setUser(userHash, { dids: [], vc: { ...vc, hash } });

    // After VC is successfully issued, update emitted list
    return await updateEmittedVCList(signer);
}

/**
 * Revokes a VC by hash and updates the revoked VC list on IPFS and chain
 */
async function revokeVC(vcHash, signer) {
    const vcRegistrySigner = vcRegistry.connect(signer);
    await sendTxWithNonce(vcRegistrySigner.revokeVC, signer, vcHash);
    return await updateRevokedVCList(signer);
}

/**
 * Returns the current emitted-list CID from chain
 */
async function getEmittedListCID() {
    return await vcRegistry.getEmittedListCID();
}

/**
 * Returns the current revoked-list CID from chain
 */
async function getRevokedListCID() {
    return await vcRegistry.getRevokedListCID();
}

/**
 * Reads a list of VC hashes from IPFS given a CID
 */
async function getVCListFromIPFS(cid) {
    const ipfs = create({ url: "http://127.0.0.1:5001" });
    let data = "";
    for await (const chunk of ipfs.cat(cid)) {
        data += chunk.toString();
    }
    return JSON.parse(data);
}

module.exports = {
    issueNewVC, revokeVC,
    updateEmittedVCList, updateRevokedVCList,
    getEmittedListCID, getRevokedListCID, getVCListFromIPFS
};