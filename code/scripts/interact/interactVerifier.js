// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json")));

    const dummyProof = "0x1234";
    const dummySignals = ["0xabc", "0xdef"];

    const vpVerifier = await ethers.getContractAt("VPVerifier", addresses.VPVerifier);
    const bbsVerifier = await ethers.getContractAt("BBSVerifier", addresses.BBSVerifier);
    const semaVerifier = await ethers.getContractAt("SemaphoreVerifier", addresses.SemaphoreVerifier);

    const vp = await vpVerifier.verifyProof(dummyProof, dummySignals);
    const bbs = await bbsVerifier.verifyProof(dummyProof, dummySignals);
    const sema = await semaVerifier.verifyProof(dummyProof, dummySignals);

    console.log("🔐 VPVerifier result: ", vp);
    console.log("🔐 BBSPlusVerifier result: ", bbs);
    console.log("🔐 SemaphoreVerifier result: ", sema);
}

main().catch(console.error);