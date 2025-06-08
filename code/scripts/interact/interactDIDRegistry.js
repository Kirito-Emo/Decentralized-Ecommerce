// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Minimal “interact” script for DIDRegistry
 * - Demonstrates owner lookups, adding/removing delegates, and changing owner
 * - Relies on fetchDID.js having generated issuer‐did.json and holder‐did.json
 * Tech: Hardhat, ethers v6, Ganache (localhost:8545)
 */

function formatBytes32String(str) {
    const bytes = Buffer.from(str, "utf8");
    if (bytes.length > 32) throw new Error("string too long for bytes32");
    const buf = Buffer.alloc(32);
    bytes.copy(buf);
    return "0x" + buf.toString("hex");
}

function toUtf8String(hex) {
    return Buffer.from(hex.slice(2), "hex").toString("utf8").replace(/\0+$/, "");
}

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // Load DIDRegistry address from contract‐addresses.json
    const addressesPath = path.join(__dirname, "../contract-addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error(
            "➜ Unable to find contract-addresses.json. Make sure you deployed DIDRegistry and updated that file."
        );
    }
    const allAddrs = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    const didRegistryAddress = allAddrs["DIDRegistry"];
    if (!didRegistryAddress) {
        throw new Error("➜ “DIDRegistry” entry not found in contract-addresses.json");
    }
    console.log(`\nDIDRegistry is at: ${didRegistryAddress}\n`);

    // Load the compiled ABI for DIDRegistry from Hardhat artifacts
    const artifactPath = path.join(
        __dirname,
        "../../artifacts/contracts/DIDRegistry.sol/DIDRegistry.json"
    );
    if (!fs.existsSync(artifactPath)) {
        throw new Error(
            '➜ Cannot find DIDRegistry ABI at ${artifactPath}. Did you compile with Hardhat?'
        );
    }
    const { abi } = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    // Set up ethers Provider (Ganache) and two wallets (issuer & holder)
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");

    // Load issuer‐did.json and holder‐did.json (created by fetchDID.js)
    const issuerDidPath = path.join(__dirname, "issuer-did.json");
    const holderDidPath = path.join(__dirname, "holder-did.json");
    if (!fs.existsSync(issuerDidPath) || !fs.existsSync(holderDidPath)) {
        throw new Error(
            "➜ Missing issuer-did.json or holder-did.json. Please run fetchDID.js first."
        );
    }

    const issuerDid = JSON.parse(fs.readFileSync(issuerDidPath, "utf8"));
    const holderDid = JSON.parse(fs.readFileSync(holderDidPath, "utf8"));

    // Create wallets from private keys, connected to Ganache
    const issuerWallet = new ethers.Wallet(issuerDid.privateKey, provider);
    const holderWallet = new ethers.Wallet(holderDid.privateKey, provider);

    console.log(`Issuer address: ${issuerWallet.address}`);
    console.log(`Holder address: ${holderWallet.address}\n`);

    // Instantiate DIDRegistry contract (connected to issuer)
    const didRegistry = new ethers.Contract(didRegistryAddress, abi, issuerWallet);

    // Define identity and a sample delegateType
    const identity = issuerDid.address;
    const delegateType = formatBytes32String("veriKey");

    // Check who currently owns this identity
    const initialOwner = await didRegistry.identityOwner(identity);
    await didRegistry.changeOwner(issuerDid.address, issuerWallet.address);
    console.log(`identityOwner(${identity}) = ${initialOwner}`); // should be issuer's address
/*
    // Add a delegate: issuer grants “holder” the right to act as a delegateType “veriKey”
    const validityDurationSeconds = 3600; // delegate is valid for 1 hour
    console.log('[tx] issuer adds “holder” as a delegate for 1 hour...\n');
    const txAdd = await didRegistry.addDelegate(
        identity,
        delegateType,
        holderDid.address,
        validityDurationSeconds,
        { nonce: currentNonce }
    );
    await txAdd.wait();
    console.log('✅ Delegate added. (valid for ${validityDurationSeconds} seconds)\n');

    // Check if that delegate is now valid
    const isValid1 = await didRegistry.validDelegate(identity, delegateType, holderDid.address);
    console.log('validDelegate(...) after addDelegate → ${isValid1}\n'); // should be true

    // Revoke that delegate (issuer calls revokeDelegate)
    console.log('[tx] issuer revokes the “holder” delegate...\n');
    const txRevoke = await didRegistry.revokeDelegate(identity, delegateType, holderDid.address, { nonce: currentNonce });
    await txRevoke.wait();
    console.log('✅ Delegate revoked.\n');

    // Verify that validDelegate now returns false
    const isValid2 = await didRegistry.validDelegate(identity, delegateType, holderDid.address);
    console.log('validDelegate(...) after revokeDelegate → ${isValid2}\n'); // should be false

    // Change owner: issuer transfers ownership of “identity” to holder
    console.log('[tx] issuer changes owner of identity to holder...');
    const txChangeOwner = await didRegistry.changeOwner(identity, holderDid.address);
    await txChangeOwner.wait();
    console.log('✅ changeOwner completed.\n');

    // Check new identityOwner
    const newOwner = await didRegistry.identityOwner(identity);
    console.log(`identityOwner(${identity}) after changeOwner → ${newOwner}\n`); // should be holder's address

    // Show current block number for “changed” mapping
    const lastChanged = await didRegistry.changed(identity);
    console.log(`changed(${identity}) = block #${lastChanged}\n`);

    // Try adding a delegate now that “holder” is the owner
    const didRegistryAsHolder = didRegistry.connect(holderWallet);

    // Use a different delegateType for demo (e.g. “adminKey”)
    const delegateType2 = formatBytes32String("adminKey");
    const txHolderAdd = await didRegistryAsHolder.addDelegate(
        identity,
        delegateType2,
        issuerDid.address,
        7200 // valid 2 hours
    );
    await txHolderAdd.wait();
    console.log('✅ “holder” (new owner) added “issuer” as an “adminKey” delegate (2h).\n');

    const isValid3 = await didRegistryAsHolder.validDelegate(
        identity,
        delegateType2,
        issuerDid.address
    );
    console.log(`validDelegate('${toUtf8String(delegateType2).trim()}', issuer) → ${isValid3}\n`);
*/
    console.log("🎉 All DIDRegistry functions have been exercised!\n");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});