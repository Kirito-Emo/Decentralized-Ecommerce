// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));
    const revReg = await ethers.getContractAt("RevocationRegistry", addresses.RevocationRegistry);

    const fakeCID = "ipfs://QmMockRevocationList";
    await revReg.updateRevocationList(fakeCID);

    const currentCID = await revReg.getRevocationCID();
    console.log("📡 Revocation List CID: ", currentCID);
}

main().catch(console.error);