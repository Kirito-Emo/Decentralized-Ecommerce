// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * BanRegistry interaction script
 * - Ban and unban a real DID derived from Ganache mnemonic
 * - Reads BanRegistry address from contract-addresses.json
 * - Prints ban status before and after
 * Technologies: Hardhat, ethers v6, Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { create } = require("ipfs-http-client");

// Load holder DID
const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "holder-did.json"), "utf8"));
const holderDID = holder.did;

// Function to update the ban list on IPFS and write the CID on-chain
async function updateBanListCID(BanRegistry, signer, bannedList) {
    const ipfs = create({ url: "http://127.0.0.1:5001" });
    const { cid } = await ipfs.add(JSON.stringify(bannedList));
    await (await BanRegistry.setBanListCID(cid.toString())).wait();
    console.log("Ban list CID set on-chain:", cid.toString());
    return cid.toString();
}

async function main() {
    console.log("\n----- Interact with Ban Registry -----");

    // Load BanRegistry contract address
    const filePath = path.join(__dirname, "../contract-addresses.json");
    const addresses = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!addresses.BanRegistry) {
        console.error("BanRegistry address not found in contract-addresses.json");
        return;
    }
    const BanRegistry = await ethers.getContractAt("BanRegistry", addresses.BanRegistry);

    // Grant permission to the BanRegistry contract
    const [deployer] = await ethers.getSigners();
    let tx = await BanRegistry.changeOwner(deployer.address);
    await tx.wait();

    // Check initial ban status (expected to be false)
    const initialBanStatus = await BanRegistry.isDIDBanned(holderDID);
    console.log(`Initial ban status for ${holderDID}:`, initialBanStatus);
    if (initialBanStatus) {
        console.warn(`Warning: Holder DID ${holderDID} is already banned.`);
    } else {
        console.log(`Holder DID ${holderDID} is not banned, proceeding with ban/unban operations.`);
    }

    // Ban the holder DID
    tx = await BanRegistry.banUser(holderDID);
    await tx.wait();
    console.log(`\n✅ Holder DID ${holderDID} has been banned.`);

    // Check ban status (expected to be true)
    const isBanned = await BanRegistry.isDIDBanned(holderDID);
    console.log(`Ban status for ${holderDID}:`, isBanned);

    // Update the ban list on IPFS and write the CID on-chain
    let bannedList = [holderDID];
    await updateBanListCID(BanRegistry, deployer, bannedList);
    console.log("\n✅ Ban list updated on IPFS and CID set on-chain.");

    // Unban the holder DID
    tx = await BanRegistry.unbanUser(holderDID);
    await tx.wait();
    console.log(`\n✅ Holder DID ${holderDID} has been unbanned.`);

    // Check again (expected to be false)
    const isBanned2 = await BanRegistry.isDIDBanned(holderDID);
    console.log(`Ban status after unban for ${holderDID}:`, isBanned2);

    bannedList = [];
    await updateBanListCID(BanRegistry, deployer, bannedList);
    console.log("\n✅ Ban list updated on IPFS and CID set on-chain after unban.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});