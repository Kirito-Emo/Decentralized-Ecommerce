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
    console.log("\n----- Interact with Revocation Registry -----");

    // Load issuer DID and address
    const issuer = loadJSON("issuer-did.json");     // original owner
    const issuer2 = loadJSON("issuer2-did.json");   // new owner
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    let signer = new ethers.Wallet(issuer.privateKey, provider);

    // Load RevocationRegistry contract address
    const addrs = loadJSON("../contract-addresses.json");
    const registryAddr = addrs.RevocationRegistry;
    if (!registryAddr) throw new Error("RevocationRegistry address not found in contract-addresses.json");
    console.log("Connected to RevocationRegistry at:", registryAddr);

    // Attach to deployed contract as original owner
    let registry = await ethers.getContractAt("RevocationRegistry", registryAddr, signer);

    // Read issuer DID (metadata)
    const issuerDID = await registry.getIssuerDID();
    console.log("Issuer DID (metadata):", issuerDID);

    // Manual nonce management
    let nonce = await provider.getTransactionCount(signer.address, "pending");

    // Update the revocation list CID (simulate a new IPFS CID)
    const newCID = "QmRevocationListCID_" + Math.floor(Date.now() / 1000);
    console.log("\nUpdating revocation list CID to:", newCID);
    let tx = await registry.updateRevocationList(newCID, { nonce });
    await tx.wait();
    console.log("✅ Revocation list updated.");
    nonce++;

    // Read back the latest CID
    const currentCID = await registry.getRevocationCID();
    console.log("\nCurrent revocation list CID:", currentCID);

    // Change owner to issuer2 or fallback to second account
    let newOwner;
    try {
        newOwner = issuer2.address;
    } catch {
        const accounts = await provider.listAccounts();
        newOwner = accounts[1] || signer.address;
    }
    console.log("\nChanging owner to:", newOwner);
    tx = await registry.changeOwner(newOwner, { nonce });
    await tx.wait();
    console.log("✅ Owner changed.");
    nonce++;

    // Verify new owner
    let actualOwner = await registry.getOwner();
    console.log("Current contract owner:", actualOwner);

    // Attach to deployed contract as new owner
    signer = new ethers.Wallet(issuer2.privateKey, provider);
    registry = await ethers.getContractAt("RevocationRegistry", registryAddr, signer);
    nonce = await provider.getTransactionCount(signer.address, "pending");

    // Restore original owner
    newOwner = issuer.address;
    console.log("\nRestoring owner to:", newOwner);
    tx = await registry.changeOwner(newOwner, { nonce });
    await tx.wait();
    console.log("✅ Owner restored.");
    nonce++;

    // Verify new owner
    actualOwner = await registry.getOwner();
    console.log("Current contract owner:", actualOwner);
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});