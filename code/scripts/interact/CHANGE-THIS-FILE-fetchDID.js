// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Derive two real Ethereum accounts from Ganache mnemonic, create a real issuer DID and holder DID, save info for later use
 */

const { ethers } = require("ethers");
const { EthrDID } = require("ethr-did");
const fs = require("fs");
const path = require("path");

// !!! Never commit this to git !!! (add to .gitignore)
const GANACHE_MNEMONIC = "YOUR GANACHE MNEMONIC HERE"; // Replace with your mnemonic!

async function main() {
    // Derive issuer (index 0) and holder (index 1)
    for (let accountIndex of [0, 1]) {
        const wallet = ethers.Wallet.fromPhrase(
            GANACHE_MNEMONIC,
            `m/44'/60'/0'/0/${accountIndex}`
        );

        const did = new EthrDID({
            identifier: wallet.address,
            privateKey: wallet.privateKey,
        });

        const role = accountIndex === 0 ? "issuer" : "holder";
        console.log(`Derived ${role} address:`, wallet.address);
        console.log(`${role} DID:`, did.did);

        // Save info for later scripts
        const out = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            did: did.did,
        };
        fs.writeFileSync(
            path.join(__dirname, `${role}-did.json`),
            JSON.stringify(out, null, 2)
        );
        console.log(`✅ ${role}-did.json created`);
    }
}

main().catch(console.error);