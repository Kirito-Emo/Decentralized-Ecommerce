// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import * as saml from 'samlify';

const app = express();
const PORT = 8443;

app.use(bodyParser.urlencoded({ extended: true }));

// Load private key and certificate (must match those used by the backend)
const privateKey = fs.readFileSync('./certs/idp_key.pem', 'utf-8');
const cert = fs.readFileSync('./certs/idp_cert.pem', 'utf-8');

// Configure the mock Identity Provider
const idp = saml.IdentityProvider({
    entityID: 'http://localhost:8443',
    signingCert: cert,
    privateKey: privateKey,
    singleSignOnService: [{
        Binding: 'post',
        Location: 'http://localhost:8443/sso'
    }]
});

// Optionally configure a Service Provider instance (for parsing/debugging)
const sp = saml.ServiceProvider({
    entityID: 'http://localhost:8082',
    assertionConsumerService: [{
        Binding: 'post',
        Location: 'http://localhost:8082/assert'
    }]
});

// Handle SAML AuthnRequest and respond with a signed SAMLResponse
app.post('/sso', async (req, res) => {
    try {
        // Parse the incoming SAMLRequest (optional for basic mock)
        // const { extract } = await idp.parseLoginRequest(sp, 'post', { body: req.body });

        // Create a signed SAMLResponse with a valid Assertion
        const { context } = await idp.createLoginResponse(sp, 'post', {
            attributes: { email: 'testuser@spid.it' }, // You can customize user attributes here
            nameID: 'testuser@spid.it',
            audience: 'http://localhost:8082',
            // inResponseTo: extract.id, // Use this if you want full SAML compliance
            // signatureConfig: { ... } // Use if you want to sign the Response itself
        });

        // Return the SAMLResponse via auto-submitting HTML form (POST)
        res.send(`
        <html>
          <body>
            <form method="POST" action="http://localhost:8082/assert">
              <input type="hidden" name="SAMLResponse" value="${Buffer.from(context).toString('base64')}" />
              <input type="submit" value="Continue" />
            </form>
            <script>document.forms[0].submit();</script>
          </body>
        </html>
        `);
    } catch (err) {
        console.error('SAML mock IDP error:', err);
        res.status(500).send('SAML mock IDP error: ' + err);
    }
});

// Simple healthcheck endpoint
app.get('/', (_req, res) => res.send('Mock IdP SAMLify ready!'));

app.listen(PORT, () => console.log(`Mock IdP running at http://localhost:${PORT}`));