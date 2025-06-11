// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import {ethers} from "ethers";
import contractAddresses from "../contract-addresses.json" with { type: "json" };
import ReviewNFTAbi from "../../artifacts/contracts/ReviewNFT.sol/ReviewNFT.json" with { type: "json" };

/**
 * Get ReviewNFT contract instance
 */
function getReviewNFTContract(signerOrProvider) {
    return new ethers.Contract(contractAddresses.ReviewNFT, ReviewNFTAbi.abi, signerOrProvider);
}

/**
 * Mint a new ReviewNFT for a DID and productId
 * Only callable by account with MINTER_ROLE
 */
export async function mintNFT(signer, did, productId, tokenURI) {
    console.log("Backend: minting NFT for DID", did);
    const contract = getReviewNFTContract(signer);
    return await contract.mintNFT(did, productId, tokenURI);
}

/**
 * Get all ReviewNFT token IDs for a DID
 */
export async function getTokensOfDID(provider, did) {
    const contract = getReviewNFTContract(provider);
    const arr = await contract.getTokensOfDID(did);
    return arr.map(x => Number(x));
}

/**
 * Get status (0=Valid, 1=Used, 2=Expired) for a tokenId
 */
export async function getNFTStatus(provider, tokenId) {
    const contract = getReviewNFTContract(provider);
    return await contract.getNFTStatus(tokenId);
}

/**
 * Check if NFT is valid for review (not used or expired)
 */
export async function isValidForReview(provider, tokenId) {
    const contract = getReviewNFTContract(provider);
    return await contract.isValidForReview(tokenId);
}

/**
 * Mark an NFT as used
 */
export async function useNFT(signer, tokenId, did) {
    const contract = getReviewNFTContract(signer);
    return await contract.useNFT(tokenId, did);
}