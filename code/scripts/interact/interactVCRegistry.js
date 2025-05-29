// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));
    const vcRegistry = await ethers.getContractAt("VCRegistry", addresses.VCRegistry);

    const fakeVC = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("mockVC"));
    await vcRegistry.registerCommitment(fakeVC);

    const isRegistered = await vcRegistry.isRegistered(fakeVC);
    console.log("✅ VC registered: ", isRegistered);
}

main().catch(console.error);