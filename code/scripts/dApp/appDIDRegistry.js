// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * DIDRegistry only maps: DID → userHash
 * All mapping DID ↔ VC is kept off-chain in localDb.json (simulating the wallet)
 */

const { addDidToUser, loadDb } = require("./localDb");
const { isDIDBanned } = require("./appBanRegistry");

/**
 * Registers a DID on-chain and off-chain for a given user
 * - Checks if the DID is banned or already mapped to another user (Sybil check)
 * - Associates it with the user's VC in localDb.json (off-chain)
 */
async function registerDID(did, userHash) {
    // Check if DID is banned
    if (await isDIDBanned(did)) throw new Error("DID is banned.");

    // Check if DID is already associated with a user (Sybil-resistance check)
    const db = loadDb();
    for (const otherUserHash of Object.keys(db)) {
        if (otherUserHash !== userHash) {
            if (db[otherUserHash].dids && db[otherUserHash].dids.includes(did))
                throw new Error("DID already associated to another user (Sybil-resistance check)");
        }
    }

    // Register off-chain (localDb)
    addDidToUser(userHash, did);

    return { status: "ok", did };
}

module.exports = { registerDID };