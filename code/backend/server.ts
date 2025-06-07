// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

import express from "express";
import bodyParser from "body-parser";
import { XMLParser } from "fast-xml-parser";
import cors from "cors";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const PORT = 8082;

// Serve the login page
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

// Handle Assertion POST (from IdP)
app.post("/assert", (req, res) => {
    try {
        // Extract SAMLResponse from the request body (base64 encoded)
        const samlResponseB64 = req.body.SAMLResponse;
        if (!samlResponseB64) throw new Error("Missing SAMLResponse");
        const samlResponseXml = Buffer.from(samlResponseB64, "base64").toString("utf-8");

        // Parsing XML to extract NameID
        const parser = new XMLParser({ ignoreAttributes: false });
        const obj = parser.parse(samlResponseXml);
        const assertionObj = obj["samlp:Response"]["saml:Assertion"];
        const nameID = assertionObj["saml:Subject"]["saml:NameID"];

        // Creating a Verifiable Credential (VC)
        const vc = {
            "@context": ["https://www.w3.org/2018/credentials/v1"],
            type: ["VerifiableCredential"],
            issuer: "did:web:localhost8443",
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: nameID,
                name: "Test User"
            }
        };

        // Encode the VC as base64 for the frontend
        const vcBase64 = Buffer.from(JSON.stringify(vc)).toString("base64");
        // Redirect to the frontend with the VC
        res.redirect(`http://localhost:5173/?vc=${vcBase64}`);
    } catch (err) {
        res.status(400).json({ error: (err as Error).message });
    }
});

app.listen(PORT, () => {
    console.log(`SP (backend) running at http://localhost:${PORT}`);
});