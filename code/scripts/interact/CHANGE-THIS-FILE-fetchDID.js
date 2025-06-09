// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Derive 4 real Ethereum accounts from Ganache mnemonic, create 2 real issuer DIDs and 2 holder DIDs, save info for later use
 */

const { HDNodeWallet } = require("ethers");
const { EthrDID } = require("ethr-did");
const fs= require("fs");
const path = require("path");

// === Ganache ===
const MNEMONIC = "YOUR_GANACHE_MNEMONIC_HERE"; // Replace with your Ganache mnemonic
const ACCOUNT_PATH = "44'/60'/0'/0";

// Master at depth 0
const master = HDNodeWallet.fromPhrase(MNEMONIC, "", "m");

// === EthrDID ===
async function main() {
    console.log("\n----- Interact with fetchDID -----");

    // Derive 4 accounts from the master wallet and create DIDs (2 issuers, 2 holders)
    ["issuer", "holder", "issuer2", "holder2"].forEach((role, i) => {
        const wallet = master.derivePath(`${ACCOUNT_PATH}/${i}`);
        console.log(`${role} address: ${wallet.address}`);

        const did = new EthrDID({
            identifier: wallet.address,
            privateKey: wallet.privateKey,
        });

        const out = {
            address:    wallet.address,
            privateKey: wallet.privateKey,
            did:        did.did,
        };
        fs.writeFileSync(
            path.join(__dirname, `${role}-did.json`),
            JSON.stringify(out, null, 2)
        );
        console.log(`✅ ${role}-did.json created`);
    });
}

main().catch(console.error);