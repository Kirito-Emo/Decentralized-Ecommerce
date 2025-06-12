import * as ed25519 from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import bs58 from "bs58";

// Polyfill for browser environment
ed25519.etc.sha512Sync = sha512;

function toHex(arr: Uint8Array): string {
    return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function generateEd25519DID() {
    const sk = ed25519.utils.randomPrivateKey();
    const pk = ed25519.getPublicKey(sk);
    const skHex = toHex(sk);
    const pkHex = toHex(pk);

    const pubkeyWithPrefix = new Uint8Array(1 + pk.length);
    pubkeyWithPrefix[0] = 0xed;
    pubkeyWithPrefix.set(pk, 1);
    const base58pub = "z" + bs58.encode(pubkeyWithPrefix);

    const did = "did:key:" + base58pub;

    return { did, pkHex, skHex };
}