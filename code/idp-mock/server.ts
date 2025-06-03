// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 8443;

app.post("/sso", (_req, res) => {
    // Build the SAML Assertion (without digital signature)
    const assertionXml =
        `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_assert_${Date.now()}" Version="2.0" IssueInstant="${new Date().toISOString()}">` +
        `<saml:Issuer>did:web:localhost8443</saml:Issuer>` +
        `<saml:Subject>` +
        `<saml:NameID>did:web:localhost8443</saml:NameID>` +
        `</saml:Subject>` +
        `<saml:Conditions NotBefore="${new Date().toISOString()}" NotOnOrAfter="${new Date(Date.now() + 5 * 60 * 1000).toISOString()}"/>` +
        `<saml:AuthnStatement AuthnInstant="${new Date().toISOString()}"/>` +
        `</saml:Assertion>`;

    // Build the SAML Response containing the unsigned assertion
    const samlResponse =
        `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_resp_${Date.now()}" Version="2.0" IssueInstant="${new Date().toISOString()}" Destination="http://localhost:8082/assert">` +
        `<saml:Issuer>did:web:localhost8443</saml:Issuer>` +
        assertionXml +
        `</samlp:Response>`;

    // Return an HTML page with an auto-submitting POST form to the Service Provider
    res.send(`
      <html lang="it">
        <body>
          <form method="POST" action="http://localhost:8082/assert">
            <input type="hidden" name="SAMLResponse" value="${Buffer.from(samlResponse).toString('base64')}" />
            <input type="submit" value="Continue" />
          </form>
          <script>document.forms[0].submit();</script>
        </body>
      </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Mock IdP running at http://localhost:${PORT}`);
});