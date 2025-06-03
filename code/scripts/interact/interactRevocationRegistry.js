// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for RevocationRegistry contract.
 * - Updates the current revocation list CID (must be called by the issuer DID).
 * - Reads and prints the current revocation list CID.
 *
 * Requirements:
 * - RevocationRegistry contract deployed and address saved in contract-addresses.json
 * - The DID string must match the issuerDID used at deploy (e.g. "did:web:localhost8443")
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const issuerDID = "did:web:localhost8443"; // The issuer DID (must match the one used at deploy)
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const revReg = await ethers.getContractAt("RevocationRegistry", addresses.RevocationRegistry);

    // Update the revocation list CID as Issuer
    const fakeCID = "ipfs://QmMockRevocationList";
    const tx = await revReg.updateRevocationList(fakeCID, issuerDID);
    await tx.wait();

    // Read and print the current revocation list CID
    const currentCID = await revReg.getRevocationCID();
    console.log("📡 Revocation List CID: ", currentCID);
}

main().catch(console.error);