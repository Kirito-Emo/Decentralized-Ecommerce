// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { ethers } from "ethers";
import contractAddresses from "../contract-addresses.json" with { type: "json" };
import ReviewStorageAbi from "../../artifacts/contracts/ReviewStorage.sol/ReviewStorage.json" with { type: "json" };
import { create as ipfsHttpClient } from "ipfs-http-client";

// Configure contract address here
function getReviewStorageContract(signerOrProvider) {
    return new ethers.Contract(contractAddresses.ReviewStorage, ReviewStorageAbi.abi, signerOrProvider);
}

// Initialize IPFS client
const ipfs = ipfsHttpClient({ url: "http://localhost:5001/api/v0" });

// Upload review text to IPFS and return the CID
export async function uploadReviewToIPFS(text) {
    const { cid } = await ipfs.add(text);
    return cid.toString();
}

// Download review text from IPFS using the CID
export async function downloadReviewFromIPFS(cid) {
    let data = "";
    for await (const chunk of ipfs.cat(cid)) {
        data += new TextDecoder().decode(chunk);
    }
    return data;
}

// Store a new review
export async function storeReview(signer, authorDID, tokenId, text) {
    const cid = await uploadReviewToIPFS(text);
    const contract = getReviewStorageContract(signer);
    const tx = await contract.storeReview(authorDID, tokenId, cid);
    return { tx, cid };
}

// Update review by uploading new text to IPFS and update CID on-chain
export async function updateReview(signer, reviewId, newText, did) {
    const cid = await uploadReviewToIPFS(newText);
    const contract = getReviewStorageContract(signer);
    const tx = await contract.updateReview(reviewId, cid, did);
    return { tx, cid };
}

// Revoke a review permanently
export async function revokeReview(signer, reviewId, did) {
    const contract = getReviewStorageContract(signer);
    return await contract.revokeReview(reviewId, did);
}

// Get the full history of a review
export async function getReviewsByAuthor(provider, authorDID) {
    const contract = getReviewStorageContract(provider);
    const arr = await contract.getReviewsByAuthor(authorDID);
    return arr.map(x => Number(x));
}

// Get the latest version of a review
export async function getLatestReview(provider, reviewId) {
    const contract = getReviewStorageContract(provider);
    // <-- 5 return values now!
    const [cid, isRevoked, lastUpdate, tokenId, numEdits] = await contract.getLatestReview(reviewId);
    return {
        cid,
        isRevoked,
        lastUpdate: Number(lastUpdate),
        tokenId: Number(tokenId),
        numEdits: Number(numEdits)
    };
}