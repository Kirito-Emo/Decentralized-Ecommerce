// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Derive 4 real Ethereum accounts from Ganache mnemonic, create 2 real issuer DIDs and 2 holder DIDs, save info for later use
 */

const { HDNodeWallet } = require("ethers");
const { EthrDID } = require("ethr-did");
const fs= require("fs");
const path = require("path");
const {ethers} = require("hardhat");

// === Ganache ===
const provider= new ethers.JsonRpcProvider("http://127.0.0.1:8545");  // Ganache address
const MNEMONIC = "YOUR MNEMONIC HERE";  // Replace with your actual mnemonic
const ACCOUNT_PATH = "44'/60'/0'/0";

// Master at depth 0
const master = HDNodeWallet.fromPhrase(MNEMONIC, "", "m");

// === EthrDID ===
async function main() {
    console.log("\n----- Interact with fetchDID -----");

    const network = await provider.getNetwork();
    const chainId = network.chainId;

    // Derive 4 accounts from the master wallet and create DIDs (2 issuers, 2 holders)
    ["issuer", "holder", "issuer2", "holder2"].forEach((role, i) => {
        const wallet = master.derivePath(`${ACCOUNT_PATH}/${i}`);
        console.log(`${role} address: ${wallet.address}`);

        const did = new EthrDID({
            identifier: wallet.address,
            privateKey: wallet.privateKey,
            chainNameOrId: chainId.toString(),
        });

        const out = {
            address:            wallet.address,
            privateKey:         wallet.privateKey,
            did:                did.did,
            chainNameOrId:      chainId.toString(),
            rpcUrl:             "http://127.0.0.1:8545",
        };
        fs.writeFileSync(
            path.join(__dirname, `${role}-did.json`),
            JSON.stringify(out, null, 2)
        );
        console.log(`✅ ${role}-did.json created`);
    });
}

main().catch(console.error);