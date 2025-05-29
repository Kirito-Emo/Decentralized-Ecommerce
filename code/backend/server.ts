// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
// server.ts

import express from 'express';
import session from 'express-session';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
}));

// Redirect to SPID login (hub-spid-login-ms)
app.get('/auth/spid', (_req, res) => {
    const SPID_BASE = process.env.SPID_LOGIN_BASE_URL || 'http://localhost:3001';
    res.redirect(`${SPID_BASE}/login/spid`);
});

// Assertion Consumer Service: assertion + JWT SPID
app.post('/spid/assert', express.urlencoded({ extended: true }), (req, res) => {
    const { token } = req.body as { token: string };
    req.session.spidToken = token;
    res.redirect(process.env.FRONTEND_URL + '/dashboard');
});

// Issue Verifiable Credential calling Issuer
app.get('/vc/issue', async (req, res) => {
    const token = req.session.spidToken;
    if (!token) return res.status(401).send('Not authenticated');

    const resp = await fetch(process.env.ISSUER_URL! + '/credentials', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            type: 'VerifiableCredential',
            proofType: 'jwt',
        }),
    });

    const vc = await resp.json();
    res.json(vc);
});

app.listen(PORT, () => {
    console.log(`Orchestrator listening on http://localhost:${PORT}`);
});
