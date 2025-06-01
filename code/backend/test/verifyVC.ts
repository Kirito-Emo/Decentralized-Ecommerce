// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

// This script verifies a Verifiable Credential (VC) JWT using a DID resolver.

import { verifyJWT } from 'did-jwt';
import { Resolver } from 'did-resolver';
import fetch from 'node-fetch';

// Replace this with your actual VC.jwt (copy from backend response)
const JWT = 'PASTE_YOUR_JWT_HERE';

const resolver = new Resolver({
    web: async (did) => {
        const url = 'http://localhost:8082/.well-known/did.json';
        const doc = await fetch(url).then(res => res.json());
        return {
            didDocument: doc,
            didResolutionMetadata: { contentType: 'application/did+ld+json' },
            didDocumentMetadata: {}
        };
    }
});

async function verifyVC() {
    try {
        const result = await verifyJWT(JWT, { resolver });
        console.log('✅ VC is valid:');
        console.log(result.payload.vc);
    } catch (err) {
        console.error('❌ VC verification failed:');
        console.error(err.message);
    }
}

verifyVC();