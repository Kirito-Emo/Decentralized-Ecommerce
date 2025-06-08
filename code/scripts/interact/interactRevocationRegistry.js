// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 *  Developer script to deploy and interact with RevocationRegistry:
 *      - Updates and fetches the revocation list (IPFS CID)
 *      - Changes owner
 *      - Verifies events and state changes
 *
 * Tech: Hardhat, ethers v6, Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function loadJSON(file) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
}

async function main() {
    // Load issuer DID and address
    const issuer = loadJSON("issuer-did.json");
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = new ethers.Wallet(issuer.privateKey, provider);

    //Load RevocationRegistry contract address
    const addrs = loadJSON("../contract-addresses.json");
    const registryAddr = addrs.RevocationRegistry;
    if (!registryAddr) throw new Error("RevocationRegistry address not found in contract-addresses.json");
    console.log("Connected to RevocationRegistry at:", registryAddr);

    // Attach to deployed contract as owner
    const registry = await ethers.getContractAt("RevocationRegistry", registryAddr, signer);

    // Read issuer DID (metadata)
    const issuerDID = await registry.getIssuerDID();
    console.log("Issuer DID (metadata):", issuerDID);

    // Update the revocation list CID (simulate a new IPFS CID)
    const newCID = "QmRevocationListCID_" + Math.floor(Date.now() / 1000);
    console.log("\n[tx] Updating revocation list CID to:", newCID);
    const currentNonce = await signer.getNonce();
    const tx = await registry.updateRevocationList(newCID, { nonce: currentNonce });
    await tx.wait();
    console.log("✅ Revocation list updated.");

    // Read back the latest CID
    const currentCID = await registry.getRevocationCID();
    console.log("Current revocation list CID:", currentCID);

    // Change owner to another address
    let newOwner;
    try {
        const issuer2 = loadJSON("issuer2-did.json");
        newOwner = issuer2.address;
    } catch {
        const accounts = await provider.listAccounts();
        newOwner = accounts[1] || signer.address; // Fallback to second account if available
    }
    console.log("\n[tx] Changing owner to:", newOwner);
    const nextNonce = await signer.getNonce() + 1; // Increment nonce for owner change
    const tx2 = await registry.changeOwner(newOwner, { nonce: nextNonce });
    await tx2.wait();
    console.log("✅ Owner changed.");

    // Verify new owner
    const actualOwner = await registry.getOwner();
    console.log("Current contract owner:", actualOwner);

    console.log("\nAll RevocationRegistry interactions complete.");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});