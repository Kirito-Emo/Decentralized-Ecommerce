// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 *  Developer script: creates and verifies a classic VP and an SD-JWT-style VP
 *  - Outputs: subject/proof hashes for AttestationRegistry
 */

const { createVerifiableCredentialJwt, createVerifiablePresentationJwt, verifyPresentation } = require("did-jwt-vc");
const { Resolver } = require("did-resolver");
const ethrDidResolver = require("ethr-did-resolver");
const { ethers } = require("ethers");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function loadJSON(f) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8"));
}

function save(file, data) {
    fs.writeFileSync(path.join(__dirname, file), JSON.stringify(data, null, 2));
}

async function main() {
    console.log("\n----- Interact with VP -----");

    // Load DIDs and config
    const issuer = loadJSON("issuer-did.json");
    const holder = loadJSON("holder-did.json");
    const addrs = loadJSON("../contract-addresses.json");
    const chainId = issuer.chainNameOrId;
    const resolver = new Resolver(ethrDidResolver.getResolver({
        networks: [{
            name: chainId,
            chainId: parseInt(chainId),
            rpcUrl: issuer.rpcUrl,
            registry: addrs.DIDRegistry
        }]
    }));

    // Classic VC/VP Creation
    const classicVcPayload = {
        sub: holder.did,
        nbf: Math.floor(Date.now() / 1000),
        vc: {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential", "MockCredential"],
            credentialSubject: {
                id: holder.did,
                role: "user"
            }
        }
    };
    // Create issuer and holder DIDs
    const { EthrDID } = require("ethr-did");
    const issuerDid = new EthrDID({ identifier: issuer.address, privateKey: issuer.privateKey, chainNameOrId: chainId });
    const holderDid = new EthrDID({ identifier: holder.address, privateKey: holder.privateKey, chainNameOrId: chainId });

    // Create classic VC JWT
    const classicVcJwt = await createVerifiableCredentialJwt(classicVcPayload, issuerDid);

    // VP creation (holder signs)
    const classicVpPayload = {
        vp: {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiablePresentation"],
            verifiableCredential: [classicVcJwt]
        }
    };

    // Holder signs the VP
    const classicVpJwt = await createVerifiablePresentationJwt(classicVpPayload, holderDid);
    fs.writeFileSync(path.join(__dirname, "vp.jwt"), classicVpJwt);

    // VP verification
    const classicResult = await verifyPresentation(classicVpJwt, resolver);
    console.log("✅ Classic VP verified.");

    // SD-JWT style (hashed claims)
    const claims = { name: "Emanuele Boh", nationality: "IT" };
    const salts = {
        name: crypto.randomBytes(16).toString('hex'),
        nationality: crypto.randomBytes(16).toString('hex')
    };
    const hashedClaimsArray = [
        crypto.createHash('sha256').update(salts.name + claims.name).digest('hex'),
        crypto.createHash('sha256').update(salts.nationality + claims.nationality).digest('hex')
    ];
    const sdVcPayload = {
        sub: holder.did,
        nbf: Math.floor(Date.now() / 1000),
        vc: {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential", "HashedClaimsCredential"],
            credentialSubject: { hashes: hashedClaimsArray }
        }
    };
    const sdVcJwt = await createVerifiableCredentialJwt(sdVcPayload, issuerDid);

    // Simulate selective disclosure (holder reveals nationality)
    const disclosedClaim = { field: "nationality", value: claims.nationality, salt: salts.nationality };
    const sdVpPayload = {
        vp: {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiablePresentation"],
            verifiableCredential: [sdVcJwt]
        },
        disclosedClaim
    };
    const sdVpJwt = await createVerifiablePresentationJwt(sdVpPayload, holderDid);
    fs.writeFileSync(path.join(__dirname, "sd-vp.jwt"), sdVpJwt);

    // VP SD-JWT verification
    const sdResult = await verifyPresentation(sdVpJwt, resolver);
    console.log("\n✅ SD-JWT VP verified.");

    // SD-JWT: verify disclosed claim
    const storedHashes = sdResult.verifiablePresentation.verifiableCredential[0].credentialSubject.hashes;
    const disclosed = sdResult.verifiablePresentation.disclosedClaim;
    let matchFound = false;
    for (const storedHash of storedHashes) {
        const recomputed = crypto.createHash('sha256').update(disclosed.salt + disclosed.value).digest('hex');
        if (storedHash === recomputed) {
            matchFound = true;
            console.log(`\n✅ Match found for the disclosed claim: '${disclosed.value}'`);
            break;
        }
    }
    if (!matchFound) console.log("\n⚠️ No match found for the disclosed claim.");

    // Output hashes for anchoring
    const subjectHash = ethers.keccak256(ethers.toUtf8Bytes(holder.did));
    const proofHashClassic = ethers.keccak256(ethers.toUtf8Bytes(classicVpJwt));
    const proofHashSD = ethers.keccak256(ethers.toUtf8Bytes(sdVpJwt));

    save("VP_attestation.json", { subjectHash, proofHash: proofHashClassic });
    save("SD-VP_attestation.json", { subjectHash, proofHash: proofHashSD });

    console.log("\n[VP] subjectHash:", subjectHash);
    console.log("[VP] proofHash:", proofHashClassic);
    console.log("[SD-JWT VP] proofHash:", proofHashSD);
}

main().catch(console.error);