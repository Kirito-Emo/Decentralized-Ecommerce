// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'local-db.json');

// Load local DB from file
function loadDb() {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

// Save local DB to file
function saveDb(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(userHash) {
    const db = loadDb();
    return db[userHash] || null;
}

function setUser(userHash, data) {
    const db = loadDb();
    db[userHash] = data;
    saveDb(db);
}

function addDidToUser(userHash, did) {
    const db = loadDb();
    db[userHash] = db[userHash] || { dids: [], vc: null };
    if (!db[userHash].dids.includes(did)) db[userHash].dids.push(did);
    saveDb(db);
}

module.exports = { loadDb, saveDb, getUser, setUser, addDidToUser };