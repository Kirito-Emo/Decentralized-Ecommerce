// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Express backend for decentralized reviews: handles only authentication, admin actions and NFT mint/expire
 */

import express from "express";
import bodyParser from "body-parser";
import { XMLParser } from "fast-xml-parser";
import cors from "cors";
import crypto from "crypto";
import validator from "validator";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { EthrDID } from "ethr-did";

// Contract helpers for admin actions
const appBanRegistry = require("../scripts/dApp/appBanRegistry.js");
const appVCRegistry = require("../scripts/dApp/appVCRegistry.js");

// Scripts for user management and ZKP generation
const {setUser} = require("../scripts/dApp/localDb.js");
const { expireNFTs } = require("../scripts/dApp/appReviewNFT.js");
const { recordAttestation } = require("../scripts/dApp/appAttestationRegistry.js");
const { generateAndSaveSDVP } = require("../scripts/dApp/appVP.js");
const { generateAndSaveBBSProof } = require("../scripts/dApp/appBBS.js");

// Load
JSON.parse(fs.readFileSync(path.join(__dirname, "../scripts/contract-addresses.json"), "utf8"));
// Load ZK proofs directory
const PROOFS_DIR = path.join(__dirname, "../scripts/dApp/proofs");

// Load issuer from JSON file
const issuer = JSON.parse(fs.readFileSync(path.join(__dirname, "../scripts/interact/issuer-did.json"), "utf8"));
const PRIVATE_KEY = issuer.privateKey;
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const PORT = 8082;

// Hash generation for user identity
function getUserHash({ name, surname, birthDate, nationality }: any) {
	const str = `${name}|${surname}|${birthDate}|${nationality}`;
	return crypto.createHash("sha256").update(str).digest("hex");
}

// Sanitization and validation for all user input
function validateUserData({ name, surname, wallet, birthDate, nationality }: any) {
	if (!name || !surname || !wallet || !birthDate || !nationality)
		throw new Error("Missing required fields");
	if (!validator.isAlpha(name, "en-US", { ignore: " " }))
		throw new Error("Invalid name: letters only");
	if (!validator.isAlpha(surname, "en-US", { ignore: " " }))
		throw new Error("Invalid surname: letters only");
	if (!wallet || typeof wallet !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
		throw new Error("Missing or invalid wallet address");
	}
	if (!validator.isISO8601(birthDate))
		throw new Error("Invalid birth date (expected YYYY-MM-DD)");
	if (!validator.isAlpha(nationality, "en-US", { ignore: " " }))
		throw new Error("Invalid nationality: letters only");
	if (!validator.isLength(name, { min: 1, max: 32 }) ||
		!validator.isLength(surname, { min: 1, max: 32 }) ||
		!validator.isLength(nationality, { min: 2, max: 32 }))
		throw new Error("Input fields out of range");
}

// ---------------- VC/Authentication ----------------

// --- HTML login page with dual SPID + VC buttons ---
app.get("/login", (_req, res) => {
	res.send(`
		<!DOCTYPE html>
		<html lang="it">
			<body>
				<form method="POST" action="http://localhost:8443/sso">
					<input type="submit" value="Login with SPID" />
				</form>
			</body>
		</html>
	`);
});

// --- SAML Assertion POST endpoint (SPID) ---
app.post("/assert", (req, res) => {
	try {
		const samlResponseB64 = req.body.SAMLResponse;
		if (!samlResponseB64) throw new Error("Missing SAMLResponse");
		const samlResponseXml = Buffer.from(samlResponseB64, "base64").toString("utf-8");
		const parser = new XMLParser({ ignoreAttributes: false });
		const obj = parser.parse(samlResponseXml);
		const assertionObj = obj["samlp:Response"]["saml:Assertion"];
		const nameID = assertionObj["saml:Subject"]["saml:NameID"];
		const vc = {
			"@context": ["https://www.w3.org/2018/credentials/v1"],
			type: ["VerifiableCredential"],
			issuer: `${issuer.did}`,
			issuanceDate: new Date().toISOString(),
			credentialSubject: {
				id: nameID,
				name: "SPID User"
			}
		};
		const vcBase64 = Buffer.from(JSON.stringify(vc)).toString("base64");
		res.redirect(`http://localhost:5173/?vc=${vcBase64}`);
	} catch (err) {
		res.status(400).json({ error: (err as Error).message });
	}
});

// --- SSI/VC: login-vc form ---
app.get("/login-vc", (_req, res) => {
	res.send(`
		<!DOCTYPE html>
		<html lang="it">
			<body>
				<form method="POST" action="/login-vc" id="vc-form">
					<input name="name" placeholder="Name" required /><br/>
					<input name="surname" placeholder="Surname" required /><br/>
					<input type="date" name="birthDate" placeholder="Birthdate (YYYY-MM-DD)" required /><br/>
					<input name="nationality" placeholder="Nationality" required /><br/>
					<input name="wallet" type="hidden" id="wallet-input" />
					<button type="submit">Get VC</button>
				</form>
				<script>
				  // Check if MetaMask is installed and if user is logged in and set the wallet address
				  window.addEventListener('DOMContentLoaded', async () => {
				    if (window.ethereum) {
				      try {
				        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
				        document.getElementById('wallet-input').value = accounts[0];
				      } catch {}
				    }
				  });
				</script>
			</body>
		</html>
	`);
});

// --- Issue VC via SSI ---
app.post("/login-vc", async (req, res) => {
	try {
		const { name, wallet, surname, birthDate, nationality } = req.body;
		validateUserData({ name, surname, wallet, birthDate, nationality });
		const userHash = getUserHash({ name, surname, birthDate, nationality });
		const issuerDID = `${issuer.did}`;
		const cid = await appVCRegistry.issueNewVC(userHash, name, surname, birthDate, nationality, signer, issuerDID);

		// Build VC
		const vc = {
			"@context": ["https://www.w3.org/2018/credentials/v1"],
			type: ["VerifiableCredential"],
			issuer: issuerDID,
			issuanceDate: new Date().toISOString(),
			credentialSubject: { id: userHash, wallet: wallet.toLowerCase(), name, surname, birthDate, nationality, ipfsCid: cid }
		};

		setUser(userHash, { dids: [], vc });

		const vcBase64 = Buffer.from(JSON.stringify(vc)).toString("base64");
		res.send(`
			<!DOCTYPE html>
			<html lang="it">
				<head>
					<meta charset="utf-8" />
					<title>VC Issued</title>
				</head>
				<body style="font-family:Orbitron,sans-serif;background:#eef5fa;text-align:center;padding:50px;">
					<h2>Verifiable Credential Issued</h2>
					<pre style="display:inline-block;text-align:left;padding:12px 18px;background:#f5f5fa;border-radius:8px;">${JSON.stringify(vc, null, 2)}</pre>
					<p style="margin-top:30px;color:#555;">This window will close automatically.</p>
					<script>
						if (window.opener) {
							window.opener.postMessage({ type: "VC_LOGIN", vc: "${vcBase64}" }, "http://localhost:5173");
							setTimeout(() => window.close(), 1000);
						}
					</script>
				</body>
			</html>
		`);
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// ----------- ADMIN & SYSTEM CONTRACT ROUTES -----------

// Ban a DID (admin)
app.post("/ban-did", async (req, res) => {
	try {
		const { did } = req.body;
		if (!did || !/^did:ethr:0x[a-fA-F0-9]{40}$/.test(did)) {
			res.status(400).json({ error: "Invalid DID format" });
			return;
		}
		const cid = await appBanRegistry.banDID(did, signer);
		res.json({ status: "banned", did, ipfsCid: cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Unban a DID (admin)
app.post("/unban-did", async (req, res) => {
	try {
		const { did } = req.body;
		if (!did || !/^did:ethr:0x[a-fA-F0-9]{40}$/.test(did)) {
			res.status(400).json({ error: "Invalid DID format" });
			return;
		}
		const cid = await appBanRegistry.unbanDID(did, signer);
		res.json({ status: "unbanned", did, ipfsCid: cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// VC revoke (admin)
app.post("/revoke-vc", async (req, res) => {
	try {
		const { vcHash } = req.body;
		if (!vcHash || !/^0x[a-fA-F0-9]{64}$/.test(vcHash)) {
			res.status(400).json({ error: "Invalid VC hash format" });
			return;
		}
		const cid = await appVCRegistry.revokeVC(vcHash, signer);
		res.json({ status: "revoked", vcHash, ipfsCid: cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Fetch the latest ban-list CID
app.get("/ban-list-cid", async (_req, res) => {
	try {
		const cid = await appBanRegistry.getBanListCID();
		res.json({ cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Fetch the latest VC emitted list CID
app.get("/vc-emitted-list-cid", async (_req, res) => {
	try {
		const cid = await appVCRegistry.getEmittedListCID();
		res.json({ cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Fetch the latest VC revoked list CID
app.get("/vc-revoked-list-cid", async (_req, res) => {
	try {
		const cid = await appVCRegistry.getRevokedListCID();
		res.json({ cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// EXPIRE NFTs (should be called via cronjob)
app.post("/expire-nfts", async (req, res) => {
	try {
		const { tokenIds } = req.body;
		if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
			res.status(400).json({ error: "tokenIds required" });
			return;
		}
		const tx = await expireNFTs(signer, tokenIds);
		res.json({ status: "expired", txHash: tx.hash });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// ----------- ZKP ROUTE -----------

// List all proof files (GET /proofs)
app.get("/proofs", (_req, res) => {
	try {
		const files = fs.readdirSync(PROOFS_DIR)
			.filter(f => f.endsWith(".json"));
		res.json({ files });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Get a specific proof file (GET /proofs/:filename)
app.get("/proofs/:filename", (req, res) => {
	const filename = req.params.filename;
	if (!/^[\w\-\.]+\.json$/.test(filename)) {
		return res.status(400).json({ error: "Invalid filename" });
	}
	const filePath = path.join(PROOFS_DIR, filename);
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({ error: "File not found" });
	}
	res.setHeader("Content-Type", "application/json");
	fs.createReadStream(filePath).pipe(res);
});

// Anchor a proof outcome on-chain (POST /anchor-proof)
app.post("/anchor-proof", async (req, res) => {
	try {
		const { filename, proofType } = req.body;
		if (!/^[\w\-\.]+\.json$/.test(filename)) {
			return res.status(400).json({ error: "Invalid filename" });
		}
		const filePath = path.join(PROOFS_DIR, filename);
		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ error: "Proof file not found" });
		}
		const proofData = JSON.parse(fs.readFileSync(filePath, "utf8"));
		const { subjectHash, proofHash } = proofData;
		if (!subjectHash || !proofHash) {
			return res.status(400).json({ error: "Invalid proof file: missing subjectHash/proofHash" });
		}
		const txHash = await recordAttestation(signer, proofType, subjectHash, proofHash);
		res.json({ status: "anchored", txHash });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Delete a proof file (DELETE /proofs/:filename)
app.delete("/proofs/:filename", (req, res) => {
	const filename = req.params.filename;
	if (!/^[\w\-\.]+\.json$/.test(filename)) {
		return res.status(400).json({ error: "Invalid filename" });
	}
	const filePath = path.join(PROOFS_DIR, filename);
	if (!fs.existsSync(filePath)) {
		return res.status(404).json({ error: "File not found" });
	}
	fs.unlinkSync(filePath);
	res.json({ status: "deleted" });
});

// Utility function to load the local database
const dbPath = path.join(__dirname, "../scripts/dApp/local-db.json");
function loadDb() {
	return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

// Utility function to retrieve a VC by wallet address
function findVCByWallet(db: Record<string, any>, wallet: string): any | null {
	for (const entry of Object.values(db)) {
		if (typeof entry === "object" && entry && entry.vc && entry.vc.credentialSubject?.wallet?.toLowerCase() === wallet.toLowerCase()) {
			return entry.vc;
		}
	}
	return null;
}

// Generate a ZKP proof (POST /generate-proof)
app.post("/generate-proof", async (req, res) => {
	try {
		const { type, wallet, skHex, badgeLevel, reputation} = req.body;
		const db = loadDb();

		// Retrieve VC by wallet address
		if (!wallet) return res.status(400).json({ error: "Missing wallet address" });
		const vc = findVCByWallet(db, wallet);
		if (!vc) return res.status(404).json({ error: "No VC for this wallet address" });

		// VP
		if (type === "VP") {
			if (!skHex) return res.status(400).json({ error: "Missing skHex for EthrDID" });

			const holderDidInstance = new EthrDID({ identifier: wallet, privateKey: skHex });
			await generateAndSaveSDVP(vc, holderDidInstance, ["nationality"]);
			return res.json({ status: "ok" });
		}

		// BBS+
		if (type === "BBS") {
			if (badgeLevel == null || reputation == null)
				return res.status(400).json({ error: "Missing badgeLevel or reputation" });
			await generateAndSaveBBSProof(wallet, reputation, badgeLevel); // qui badgeNFT = wallet address
			return res.json({ status: "ok" });
		}

		return res.status(400).json({ error: "Invalid proof type" });
	} catch (err) {
		console.error("generate-proof error:", err);
		res.status(500).json({ error: (err as Error).message });
	}
});

// ----------- BACKEND SERVER START -----------
app.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});