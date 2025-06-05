// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Deploy script for the Semaphore smart contract
 * Saves contract address in contract-addresses.json
 * Ethers.js v6, Hardhat, Ganache localhost:8545
 */

const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    // Read SemaphoreVerifier address from contract-addresses.json
    const filePath = path.join(__dirname, "../contract-addresses.json");
    if (!fs.existsSync(filePath)) {
        throw new Error("contract-addresses.json not found. Deploy SemaphoreVerifier first!");
    }
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const semaphoreVerifierAddress = addresses.SemaphoreVerifier;
    if (!semaphoreVerifierAddress) {
        throw new Error("SemaphoreVerifier address not found in contract-addresses.json");
    }

    // Deploy PoseidonT3 library (from poseidon-solidity)
    const PoseidonT3 = await ethers.deployContract("PoseidonT3");
    await PoseidonT3.waitForDeployment();
    console.log("✅ PoseidonT3 deployed to: ", PoseidonT3.target);

    // Deploy Semaphore with the address of the verifier and link PoseidonT3
    const Semaphore = await ethers.getContractFactory("Semaphore", {
        libraries: {
            PoseidonT3: PoseidonT3.target
        },
    });
    const semaphore = await Semaphore.deploy(semaphoreVerifierAddress);
    await semaphore.waitForDeployment();
    console.log("✅ Semaphore deployed to: ", semaphore.target);

    // Save contract address to JSON file
    addresses.PoseidonT3 = PoseidonT3.target;
    addresses.Semaphore = semaphore.target;
    fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});