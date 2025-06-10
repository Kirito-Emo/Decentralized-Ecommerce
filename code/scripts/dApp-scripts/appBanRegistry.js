// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * BanRegistry interaction utility
 * Handles on-chain ban/unban, updates IPFS with banned DID list and anchors the new CID on-chain for auditability
 */

const { ethers } = require("ethers");
const { create } = require("ipfs-http-client");
const addresses = require("../contract-addresses.json");
const BanRegistryAbi = require("../../artifacts/contracts/BanRegistry.sol/BanRegistry.json").abi;
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const banRegistry = new ethers.Contract(addresses.BanRegistry, BanRegistryAbi, provider);
const { loadDb } = require("./localDb");

/**
 * Updates the DID ban-list on IPFS and writes the new CID on-chain
 */
async function updateBanListOnIPFSAndChain(signer) {
    // Collect all known DIDs from local DB
    const db = loadDb();
    const allDIDs = Object.values(db).flatMap(u => u.dids || []);
    const bannedDIDs = [];
    for (const did of allDIDs) {
        if (await banRegistry.isDIDBanned(did)) bannedDIDs.push(did);
    }

    // Publish the list to IPFS
    const ipfs = create({ url: "http://127.0.0.1:5001" });
    const { cid } = await ipfs.add(JSON.stringify(bannedDIDs));

    // Anchor the new CID on-chain for auditability
    const banRegistrySigner = banRegistry.connect(signer);
    await banRegistrySigner.setBanListCID(cid.toString());
    return cid.toString();
}

/**
 * Bans a DID on-chain and updates the ban-list CID/IPFS
 */
async function banDID(did, signer) {
    const banRegistrySigner = banRegistry.connect(signer);
    await banRegistrySigner.banUser(did);
    return await updateBanListOnIPFSAndChain(signer);
}

/**
 * Unbans a DID on-chain and updates the ban-list CID/IPFS
 */
async function unbanDID(did, signer) {
    const banRegistrySigner = banRegistry.connect(signer);
    await banRegistrySigner.unbanUser(did);
    return await updateBanListOnIPFSAndChain(signer);
}

/**
 * Returns true if the DID is currently banned on-chain
 */
async function isDIDBanned(did) {
    try {
        return await banRegistry.isDIDBanned(did);
    } catch (e) {
        // Defensive fallback: if contract call fails, consider not banned
        return false;
    }
}

/**
 * Fetches the latest ban-list CID from on-chain BanRegistry
 */
async function getBanListCID() {
    return await banRegistry.getBanListCID();
}

/**
 * Retrieves the ban-list from IPFS given a CID
 */
async function getBanListFromIPFS(cid) {
    const ipfs = create({ url: "http://127.0.0.1:5001" });
    let data = "";
    for await (const chunk of ipfs.cat(cid)) {
        data += chunk.toString();
    }
    return JSON.parse(data);
}

module.exports = { banDID, unbanDID, updateBanListOnIPFSAndChain, isDIDBanned, getBanListCID, getBanListFromIPFS };