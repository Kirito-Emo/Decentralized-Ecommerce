// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interact script for VCRegistry contract.
 * - Registers a commitment/hash of a Verifiable Credential (VC) for a holder DID.
 * - Checks and prints if the commitment is registered.
 *
 * Requirements:
 * - VCRegistry contract deployed and address saved in contract-addresses.json
 * - The holder DID string must be consistent with your demo logic.
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const holderDID = "did:web:localhost8443:ema"; // Mock holder DID for the VC registration
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const vcRegistry = await ethers.getContractAt("VCRegistry", addresses.VCRegistry);

    // Create a fake VC commitment for demo (hash of string "mockVC")
    const fakeVC = ethers.keccak256(ethers.toUtf8Bytes("mockVC"));
    await vcRegistry.registerCommitment(fakeVC, holderDID);

    // Check registration status
    const isRegistered = await vcRegistry.isRegistered(fakeVC);
    console.log("✅ VC registered: ", isRegistered);
}

main().catch(console.error);