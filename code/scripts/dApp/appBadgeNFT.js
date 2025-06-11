// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import {ethers} from "ethers";
import contractAddresses from "../contract-addresses.json" with {type: "json"};
import BadgeNFTAbi from "../../artifacts/contracts/BadgeNFT.sol/BadgeNFT.json" with {type: "json"};

/**
 * Get BadgeNFT contract instance
 */
function getBadgeNFTContract(signerOrProvider) {
    return new ethers.Contract(contractAddresses.BadgeNFT, BadgeNFTAbi.abi, signerOrProvider);
}

/**
 * Update reputation for a DID
 * Only callable by REPUTATION_UPDATER_ROLE
 */
export async function updateReputation(signer, did, delta) {
    const contract = getBadgeNFTContract(signer);
    return await contract.updateReputation(did, delta);
}

/**
 * Get badge level for a DID (0=None, 1=Bronze, 2=Silver, 3=Gold)
 */
export async function getUserBadge(provider, did) {
    const contract = getBadgeNFTContract(provider);
    return Number(await contract.getUserBadge(did));
}

/**
 * Get reputation value for a DID
 */
export async function getReputation(provider, did) {
    const contract = getBadgeNFTContract(provider);
    return Number(await contract.getReputation(did));
}