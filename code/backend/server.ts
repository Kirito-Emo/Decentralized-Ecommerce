// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

import express from "express";
import bodyParser from "body-parser";
import { XMLParser } from "fast-xml-parser";
import cors from "cors";
import crypto from "crypto";
import validator from "validator";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Import contract interaction helpers
const appBanRegistry = require("../scripts/dApp-scripts/appBanRegistry.js");
const appVCRegistry = require("../scripts/dApp-scripts/appVCRegistry.js");

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

// Get hash for user identity
function getUserHash({ name, surname, birthDate, nationality }: any) {
	const str = `${name}|${surname}|${birthDate}|${nationality}`;
	return crypto.createHash("sha256").update(str).digest("hex");
}

// Sanitization and validation for all user input
function validateUserData({ name, surname, birthDate, nationality }: any) {
	if (!name || !surname || !birthDate || !nationality)
		throw new Error("Missing required fields");
	if (!validator.isAlpha(name, "en-US", { ignore: " " }))
		throw new Error("Invalid name: letters only");
	if (!validator.isAlpha(surname, "en-US", { ignore: " " }))
		throw new Error("Invalid surname: letters only");
	if (!validator.isISO8601(birthDate))
		throw new Error("Invalid birth date (expected YYYY-MM-DD)");
	if (!validator.isAlpha(nationality, "en-US", { ignore: " " }))
		throw new Error("Invalid nationality: letters only");
	if (!validator.isLength(name, { min: 1, max: 32 }) ||
		!validator.isLength(surname, { min: 1, max: 32 }) ||
		!validator.isLength(nationality, { min: 2, max: 32 }))
		throw new Error("Input fields out of range");
}

// --- HTML login page with dual SPID + VC buttons ---
app.get("/login", (_req, res) => {
	res.send(`
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
				name: "Test User (SPID)"
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
    <html lang="it">
      <body>
        <form method="POST" action="/login-vc">
          <input name="name" placeholder="Name" required /><br/>
          <input name="surname" placeholder="Surname" required /><br/>
          <input type="date" name="birthDate" placeholder="Birthdate (YYYY-MM-DD)" required /><br/>
          <input name="nationality" placeholder="Nationality" required /><br/>
          <button type="submit">Get VC</button>
        </form>
      </body>
    </html>
    `);
});

// --- Issue VC via SSI ---
app.post("/login-vc", async (req, res) => {
	try {
		const { name, surname, birthDate, nationality } = req.body;
		validateUserData({ name, surname, birthDate, nationality });
		const userHash = getUserHash({ name, surname, birthDate, nationality });
		const issuerDID = `${issuer.did}`;
		const cid = await appVCRegistry.issueNewVC(userHash, name, surname, birthDate, nationality, signer, issuerDID);

		// Build VC
		const vc = {
			"@context": ["https://www.w3.org/2018/credentials/v1"],
			type: ["VerifiableCredential"],
			issuer: issuerDID,
			issuanceDate: new Date().toISOString(),
			credentialSubject: { id: userHash, name, surname, birthDate, nationality, ipfsCid: cid }
		};
		const vcBase64 = Buffer.from(JSON.stringify(vc)).toString("base64");

		// Serve page that postMessages to opener and closes itself
		res.send(`
	      <html lang="en">
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

// ----------- Routes -------------

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

// Revoke a VC (admin action)
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
app.get("/ban-list-cid", async (req, res) => {
	try {
		const cid = await appBanRegistry.getBanListCID();
		res.json({ cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Fetch the latest emitted VC list CID
app.get("/vc-emitted-list-cid", async (req, res) => {
	try {
		const cid = await appVCRegistry.getEmittedListCID();
		res.json({ cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

// Fetch the latest revoked VC list CID
app.get("/vc-revoked-list-cid", async (req, res) => {
	try {
		const cid = await appVCRegistry.getRevokedListCID();
		res.json({ cid });
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

app.listen(PORT, () => {
	console.log(`Backend running at http://localhost:${PORT}`);
});