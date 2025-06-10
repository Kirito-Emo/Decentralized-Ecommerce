// scripts/interact/createAndRegisterVC.js
// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Interaction script for VCRegistry contract. The script performs the following steps:
 *   1) Off-chain: build & sign a Verifiable Credential (JWT)
 *   2) Verify that JWT client-side
 *   3) On-chain: hash the JWT, register it in VCRegistry, check validity, revoke it, re-check
 *
 * Requirements:
 *   - VCRegistry deployed; address in contract-addresses.json under "VCRegistry"
 *   - DIDRegistry deployed; address in contract-addresses.json under "DIDRegistry" (for resolver)
 *   - issuer-did.json + holder-did.json from fetchDID.js (if not available, run fetchDID.js first)
 *   - Hardhat network “localhost” (Ganache) running with same mnemonic as fetchDID.js on port 8545
 *   Tech: Hardhat, ethers v6, Ganache (localhost:8545)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { EthrDID } = require("ethr-did");
const { createVerifiableCredentialJwt, verifyCredential } = require("did-jwt-vc");
const { Resolver } = require("did-resolver");
const ethrDidResolver = require("ethr-did-resolver");
const { create } = require("ipfs-http-client");

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
}

// Function to update IPFS and on-chain CIDs for emitted VCs list
async function updateEmittedListCID(vcRegistry, signer, allVCs, options) {
  // allVCs = array of VC hashes
  const ipfs = create({ url: "http://127.0.0.1:5001" });
  const { cid } = await ipfs.add(JSON.stringify(allVCs));
  await (await vcRegistry.setEmittedListCID(cid.toString(), options)).wait();
  console.log("\nEmitted VC list CID set on-chain:", cid.toString());
  return cid.toString();
}

// Function to update IPFS and on-chain CIDs for revoked VCs list
async function updateRevokedListCID(vcRegistry, signer, revokedVCs, options) {
  // revokedVCs = array of revoked VC hashes
  const ipfs = create({ url: "http://127.0.0.1:5001" });
  const { cid } = await ipfs.add(JSON.stringify(revokedVCs));
  await (await vcRegistry.setRevokedListCID(cid.toString(), options)).wait();
  console.log("\nRevoked VC list CID set on-chain:", cid.toString());
  return cid.toString();
}

// Function to update IPFS and on-chain CIDs for status list (bitstring)
async function updateStatusListCID(vcRegistry, signer, bitstringObj, options) {
  // bitstringObj = { bitstring: "...", indexMap: { ... } }
  const ipfs = create({ url: "http://127.0.0.1:5001" });
  const { cid } = await ipfs.add(JSON.stringify(bitstringObj));
  await (await vcRegistry.setStatusListCID(cid.toString(), options)).wait();
  console.log("\nStatus List (bitstring) CID set on-chain:", cid.toString());
  return cid.toString();
}

async function main() {
  console.log("\n----- Interact with VC Registry -----");

  // Setup on-chain provider & wallets
  const provider= new ethers.JsonRpcProvider("http://127.0.0.1:8545");  // Ganache address
  const issuerData = loadJSON("issuer-did.json");  // trusted issuer
  const subjectData = loadJSON("holder-did.json");  // credential subject

  const issuerWallet = new ethers.Wallet(issuerData.privateKey, provider);
  console.log("Issuer address:", issuerData.address);

  // Build DID for off-chain VC signing
  const network = await provider.getNetwork();
  const chainId = network.chainId;
  const ethrDid = new EthrDID({
    identifier: issuerData.address,
    privateKey: issuerData.privateKey,
    chainNameOrId: chainId.toString()
  });
  console.log("Issuer DID:", ethrDid.did);

  // Create VC payload & sign it to produce a JWT
  const vcPayload = {
    sub: subjectData.did,
    nbf: Math.floor(Date.now()/1000),
    vc: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential","ExampleCredential"],
      issuer: ethrDid.did,
      credentialSubject: {
        id: subjectData.did,
        claim: { example: "Hello, VCRegistry!" }
      }
    }
  };

  const vcJwt = await createVerifiableCredentialJwt(vcPayload, ethrDid);
  console.log("\n✅ Created VC JWT:\n", vcJwt);

  // Verify the VC locally via DID Resolver
  const addrs = loadJSON("../contract-addresses.json");
  const resolverConfig = {
    networks: [{
      name:   chainId,
      chainId: chainId,
      rpcUrl:  issuerData.rpcUrl,
      registry: addrs.DIDRegistry
    }]
  };
  const didResolver = new Resolver(ethrDidResolver.getResolver(resolverConfig));
  console.log("\n🔎 VC Verified");

  // Anchor on-chain in VCRegistry
  const vcRegistry = await ethers.getContractAt("VCRegistry", addrs.VCRegistry, issuerWallet);
  // Compute the on-chain anchor hash
  const vcHash = ethers.keccak256(ethers.toUtf8Bytes(vcJwt));
  console.log("\nRegistering VC hash on-chain:", vcHash);

  // Explicit nonce management
  let nonce = await provider.getTransactionCount(issuerWallet.address, "pending");

  // Register VC
  let tx = await vcRegistry.registerVC(vcHash, ethrDid.did, subjectData.did, { nonce });
  await tx.wait();
  console.log("✅ VC registered");
  nonce++;

  // Check validity
  console.log("\nisValid after register:", await vcRegistry.isValid(vcHash)); // expected: true

  // Update emitted VC list on IPFS and chain
  const allVCs = [vcHash];
  await updateEmittedListCID(vcRegistry, issuerWallet, allVCs, { nonce });
  console.log("✅ Updated emitted VC list CID on-chain");
  nonce++;

  // Fetch record
  const rec = await vcRegistry.getVC(vcHash);
  console.log("\nVCRecord:", {
    issuer:    rec.issuer,
    issuerDID: rec.issuerDID,
    subjectDID: rec.subjectDID,
    timestamp: rec.timestamp.toString(),
    revoked:   rec.revoked
  });

  // Revoke the VC
  tx = await vcRegistry.revokeVC(vcHash, { nonce });
  await tx.wait();
  console.log("\n✅ VC revoked");
  nonce++;

  // Final validity check
  console.log("\nisValid after revoke:", await vcRegistry.isValid(vcHash)); // expected: false

  // Update revoked VC list on IPFS and chain
  const revokedVCs = [vcHash];
  await updateRevokedListCID(vcRegistry, issuerWallet, revokedVCs, { nonce });
  console.log("✅ Updated revoked VC list CID on-chain");
  nonce++;

  // Updating status list (bitstring)
  const bitstringObj = { bitstring: "1", indexMap: { [vcHash]: 0 } };
  await updateStatusListCID(vcRegistry, issuerWallet, bitstringObj, { nonce });
  nonce++;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});