// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

import express from 'express';
import session from 'express-session';
import fs from 'fs';
import * as saml from 'samlify';

const app = express();
const PORT = 8082;

// Dummy schema validator for local/testing (NOT for production)
saml.setSchemaValidator({
    validate: () => Promise.resolve('skipped')
});

// Load the IdP certificate from the filesystem
const cert = fs.readFileSync(__dirname + '/certs/idp_cert.pem', 'utf-8');

// Extend express-session to include a user property
declare module 'express-session' {
    interface SessionData {
        user?: string;
    }
}

// Configure session middleware
app.use(session({
    secret: 'spidSecret',
    resave: false,
    saveUninitialized: true
}));

// Configure the SAML Service Provider (SP)
const sp = saml.ServiceProvider({
    entityID: 'http://localhost:8082',
    assertionConsumerService: [{
        Binding: 'post',
        Location: 'http://localhost:8082/assert'
    }]
});

// Configure the SAML Identity Provider (IdP)
const idp = saml.IdentityProvider({
    entityID: 'http://localhost:8443',
    singleSignOnService: [{
        Binding: 'post',
        Location: 'http://localhost:8443/sso'
    }],
    signingCert: cert
});

// SAML login endpoint: generates a SAML AuthnRequest and auto-submits it to the IdP
app.get('/login', async (_req, res) => {
    const { context } = sp.createLoginRequest(idp, 'post');
    const html = `
      <!DOCTYPE html>
      <html lang="it">
        <head>
          <meta charset="utf-8">
          <title>SPID Login</title>
        </head>
        <body>
          <form method="POST" action="http://localhost:8443/sso">
            <input type="hidden" name="SAMLRequest" value="${context}" />
            <input type="submit" value="Continue" />
          </form>
          <script>document.forms[0].submit();</script>
        </body>
      </html>
      `;
    res.set('Content-Type', 'text/html');
    res.send(html);
});

// Assertion Consumer Service (ACS) endpoint: receives and processes the SAML Response
app.post('/assert', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { extract, samlContent } = await sp.parseLoginResponse(idp, 'post', { body: req.body });

        console.log('[DEBUG] SAML Response XML:', Buffer.from(req.body.SAMLResponse, 'base64').toString('utf-8'));

        if (!extract.nameID) {
            console.error('[ERROR] Missing nameID in SAML assertion');
            res.status(401).send('Authentication failed: missing nameID');
            return;
        }

        if (extract.inResponseTo && typeof extract.inResponseTo !== 'string') {
            console.error('[ERROR] Invalid InResponseTo value:', extract.inResponseTo);
            res.status(401).send('Authentication failed: invalid InResponseTo');
            return;
        }

        if (extract.conditions) {
            const now = new Date();
            const notBefore = new Date(extract.conditions.notBefore);
            const notOnOrAfter = new Date(extract.conditions.notOnOrAfter);
            if (now < notBefore || now >= notOnOrAfter) {
                console.error('[ERROR] SAML assertion is not within valid time window', {
                    now, notBefore, notOnOrAfter
                });
                res.status(401).send('Authentication failed: assertion expired or not yet valid');
                return;
            }
        }

        req.session.user = extract.nameID;

        res.json({
            message: 'SPID login successful',
            vc: {
                subject: extract.nameID,
                claim: 'dummy VC'
            }
        });
    } catch (err: any) {
        console.error('[SAML ERROR]', err);
        res.status(401).send('Authentication failed: ' + (err?.message || JSON.stringify(err) || 'unknown error'));
    }
});

// Error endpoint for failed authentication
app.get('/error', (_req, res) => {
    res.status(401).send('Authentication failed');
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`SPID backend listening on http://localhost:${PORT}`);
});