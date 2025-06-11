// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Main panel for viewing user reputation, listing reviews and publishing new signed reviews or to edit/revoke existing ones
 */

import {useState, useEffect, useCallback} from "react";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";

// Components
import { ReviewBadgeHeader } from "../components/SignedReviews/ReviewBadgeHeader";
import { ReviewsTable } from "../components/SignedReviews/ReviewsTable";
import { ReviewEditor } from "../components/SignedReviews/ReviewEditor";

// Contracts and scripts
import contractAddresses from "../../../scripts/contract-addresses.json";
import ReviewNFTAbi from "../../../artifacts/contracts/ReviewNFT.sol/ReviewNFT.json";
import ReviewStorageAbi from "../../../artifacts/contracts/ReviewStorage.sol/ReviewStorage.json";
import BadgeNFTAbi from "../../../artifacts/contracts/BadgeNFT.sol/BadgeNFT.json";
import { updateReputation } from "../../../scripts/dApp/appBadgeNFT.js";

// IPFS client setup
const ipfs = ipfsHttpClient({ url: "http://localhost:5001/api/v0" });

// Cooldown period for reviews in seconds (24 hours = 86400 seconds)
const COOLDOWN_SECONDS = 86400;

// Format badge level to display name and color
function formatBadge(badgeLevel: number) {
    if (badgeLevel === 3) return { name: "Gold Reviewer", color: "from-yellow-200 via-yellow-300 to-yellow-500" };
    if (badgeLevel === 2) return { name: "Silver Reviewer", color: "from-gray-200 via-gray-300 to-gray-400" };
    if (badgeLevel === 1) return { name: "Bronze Reviewer", color: "from-orange-200 via-orange-300 to-orange-500" };
    return { name: "No Badge", color: "from-slate-200 via-slate-300 to-slate-400" };
}

// Convert timestamp to date string in YYYY-MM-DD format
function toDateString(ts: number) {
    return new Date(ts * 1000).toISOString().slice(0, 10);
}

// Get Ethereum provider from window object (MetaMask)
function getProvider() {
    if (typeof window === "undefined" || !window.ethereum) {
        alert("Please install or unlock MetaMask!");
        throw new Error("No Ethereum provider found");
    }
    return new ethers.BrowserProvider(window.ethereum);
}

export default function SignedReviewsPanel({ didEntries }: { didEntries: any[] }) {
    // State variables
    const [selectedDid, setSelectedDid] = useState<any>(didEntries.length > 0 ? didEntries[0] : null);
    const [userNFTs, setUserNFTs] = useState<any[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewText, setReviewText] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitState, setSubmitState] = useState<"idle" | "success" | "fail">("idle");
    const [cid, setCid] = useState<string>("");
    const [badge, setBadge] = useState<any>(null);
    const [level, setLevel] = useState<number>(0);

    // State to track current time for cooldown calculations
    const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
    useEffect(() => {
        setNow(Math.floor(Date.now() / 1000));
    }, [selectedDid, submitState]);

    // On first render: set DID if not already selected
    useEffect(() => {
        if (!selectedDid && didEntries.length > 0) setSelectedDid(didEntries[0]);
    }, [didEntries, selectedDid]);

    // Reload data whenever selected DID or submit state changes
    useEffect(() => {
        if (selectedDid) {
            reloadNFTs();
            reloadReviews();
            reloadBadge();
        } else {
            setUserNFTs([]);
            setReviews([]);
            setBadge(null);
            setLevel(0);
        }
        // eslint-disable-next-line
    }, [selectedDid, submitState, now]);

    // Contract getters
    function getReviewNFT(signerOrProvider: any) {
        return new ethers.Contract(contractAddresses.ReviewNFT, ReviewNFTAbi.abi, signerOrProvider);
    }

    function getReviewStorage(signerOrProvider: any) {
        return new ethers.Contract(contractAddresses.ReviewStorage, ReviewStorageAbi.abi, signerOrProvider);
    }

    function getBadgeNFT(signerOrProvider: any) {
        return new ethers.Contract(contractAddresses.BadgeNFT, BadgeNFTAbi.abi, signerOrProvider);
    }

    // Download text content from IPFS CID
    async function downloadTextFromIPFS(cid: string): Promise<string> {
        const stream = ipfs.cat(cid);
        let data = "";
        for await (const chunk of stream) {
            data += new TextDecoder().decode(chunk);
        }
        return data;
    }

    // Reload available NFTs for this DID
    async function reloadNFTs() {
        if (!selectedDid) return;
        setLoading(true);
        try {
            const provider = getProvider();
            const reviewNFT = getReviewNFT(provider);
            const reviewStorage = getReviewStorage(provider);

            const tokenIds = await reviewNFT.getTokensOfDID(selectedDid.did);
            const reviewIds = await reviewStorage.getReviewsByAuthor(selectedDid.did);

            const usedTokenIds = new Set(
                (await Promise.all(
                    reviewIds.map(async id => {
                        const [, isRevoked, , tokenId] = await reviewStorage.getLatestReview(id);
                        return !isRevoked ? Number(tokenId) : null;
                    })
                )).filter(x => x !== null)
            );

            const nftObjs = [];
            for (const id of tokenIds) {
                const status = await reviewNFT.getNFTStatus(id);
                const validForReview = await reviewNFT.isValidForReview(id);
                const isUsed = usedTokenIds.has(Number(id));
                nftObjs.push({
                    id: Number(id),
                    productName: `NFT #${id}`,
                    status: Number(status),
                    isValid: Number(status) === 0 && validForReview && !isUsed
                });
            }
            setUserNFTs(nftObjs);
        } catch (e) {
            console.error("Failed to load NFTs:", e);
            setUserNFTs([]);
        }
        setLoading(false);
    }

    // Reload reviews for the selected DID
    async function reloadReviews() {
        if (!selectedDid) return;
        setLoading(true);
        try {
            const provider = getProvider();
            const reviewStorage = getReviewStorage(provider);
            const reviewIds = await reviewStorage.getReviewsByAuthor(selectedDid.did);
            const reviewData = await Promise.all(
                reviewIds.map(async (id: any) => {
                    const [cid, isRevoked, lastUpdate, tokenId, numEdits] = await reviewStorage.getLatestReview(id);
                    let reviewText;
                    try {
                        reviewText = await downloadTextFromIPFS(cid);
                    } catch {
                        reviewText = "[IPFS not available]";
                    }
                    const isCooldownActive = Number(numEdits) > 0 && (now - Number(lastUpdate)) < COOLDOWN_SECONDS;
                    return {
                        reviewId: Number(id),
                        cid,
                        reviewText,
                        isRevoked,
                        lastUpdate: Number(lastUpdate),
                        nftId: Number(tokenId),
                        did: selectedDid.did,
                        canEdit: !isRevoked && !isCooldownActive,
                        canRevoke: !isRevoked,
                        productName: `NFT #${tokenId}`,
                        isValid: !isRevoked,
                        lastEditDate: toDateString(Number(lastUpdate)),
                        cooldownActive: isCooldownActive,
                        cooldownRemaining: isCooldownActive ? COOLDOWN_SECONDS - (now - Number(lastUpdate)) : 0,
                        numEdits: Number(numEdits),
                    };
                })
            );
            setReviews(reviewData);
        } catch (e) {
            console.error("Failed to load reviews:", e);
            setReviews([]);
        }
        setLoading(false);
    }

    // Reload badge and reputation level for the selected DID
    const reloadBadge = useCallback(async () => {
        if (!selectedDid) return;
        try {
            const provider = getProvider();
            const badgeNFT = getBadgeNFT(provider);
            const rep = await badgeNFT.getReputation(selectedDid.did);
            setLevel(Number(rep));
            const badgeLevel = await badgeNFT.getUserBadge(selectedDid.did);
            setBadge(formatBadge(Number(badgeLevel)));
        } catch {
            setLevel(0);
            setBadge(formatBadge(0));
        }
    }, [selectedDid]);

    // Set up interval to reload badge every second when DID is selected
    useEffect(() => {
        if (selectedDid) {
            const interval = setInterval(() => {
                reloadBadge();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [reloadBadge, selectedDid]);

    // Handle minting a new NFT for the selected DID
    async function handleMintNFT() {
        if (!selectedDid) return;
        setLoading(true);
        try {
            const provider = getProvider();
            const signer = await provider.getSigner();
            const reviewNFT = getReviewNFT(signer);
            const productId = Math.floor(Math.random() * 1000) + 1;
            const tokenURI = "ipfs://placeholder-info";

            alert("Confirm the transaction in MetaMask to mint the NFT");
            const tx = await reviewNFT.mintNFT(selectedDid.did, productId, tokenURI);
            await tx.wait();

            await reloadNFTs();
        } catch (e: any) {
            alert("Mint NFT failed: " + (e?.message || e));
        }
        setLoading(false);
    }

    // Handle submitting a new review
    async function handleSubmitReview() {
        if (!selectedNFT || !selectedDid || !reviewText) return;
        setLoading(true);
        setSubmitState("idle");
        try {
            const result = await ipfs.add(reviewText);
            const reviewCid = result.cid.toString();
            setCid(reviewCid);

            const provider = getProvider();
            const signer = await provider.getSigner();
            const reviewStorage = getReviewStorage(signer);

            alert("Confirm the transaction in MetaMask to publish the review");
            const tx = await reviewStorage.storeReview(selectedDid.did, Number(selectedNFT.id), reviewCid);
            await tx.wait();

            alert("Confirm this second transaction in MetaMask to update your reputation");
            try {
                await updateReputation(signer, selectedDid.did, 1);
            } catch (e) {
                console.warn("Failed to update reputation:", e);
            }

            setReviewText("");
            setSelectedNFT(null);

            setNow(Math.floor(Date.now() / 1000));
            await reloadReviews();
            await reloadNFTs();
            await reloadBadge();
            setSubmitState("success");
        } catch (e: any) {
            setSubmitState("fail");
            alert("Failed to publish review: " + (e?.message || e));
        }
        setLoading(false);
    }

    // Handle editing an existing review
    async function handleEdit(review: any, newText: string) {
        if (!selectedDid || !review.canEdit) return;
        setLoading(true);
        try {
            const result = await ipfs.add(newText);
            const newCid = result.cid.toString();
            const provider = getProvider();
            const signer = await provider.getSigner();
            const reviewStorage = getReviewStorage(signer);

            alert("Confirm the transaction in MetaMask to edit the review");
            const tx = await reviewStorage.updateReview(review.reviewId, newCid, selectedDid.did);
            await tx.wait();

            setNow(Math.floor(Date.now() / 1000));
            await reloadReviews();
            await reloadBadge();
        } catch (e: any) {
            alert("Failed to update review: " + (e?.message || e));
        }
        setLoading(false);
    }

    // Handle revoking an existing review
    async function handleRevoke(review: any) {
        if (!selectedDid || !review.canRevoke) return;
        setLoading(true);
        try {
            const provider = getProvider();
            const signer = await provider.getSigner();
            const reviewStorage = getReviewStorage(signer);

            alert("Confirm the transaction in MetaMask to revoke the review");
            const tx = await reviewStorage.revokeReview(review.reviewId, selectedDid.did);
            await tx.wait();

            alert("Confirm this second transaction in MetaMask to update your reputation");
            try {
                await updateReputation(signer, selectedDid.did, -1);
            } catch (e) {
                console.warn("Failed to update reputation:", e);
            }

            setNow(Math.floor(Date.now() / 1000));
            await reloadReviews();
            await reloadNFTs();
            await reloadBadge();
        } catch (e: any) {
            alert("Failed to revoke review: " + (e?.message || e));
        }
        setLoading(false);
    }

    // ---------- RENDER ----------
    return (
        <div className="flex flex-row w-full h-auto gap-8 p-4 mt-[25px]">
            {/* Left: badge and reviews */}
            <div className="flex-1 rounded-[36px] flex flex-col items-center p-8 mr-4">
                <ReviewBadgeHeader level={level} badge={badge} />
                <ReviewsTable
                    reviews={reviews}
                    onEdit={handleEdit}
                    onRevoke={handleRevoke}
                />
            </div>
            {/* Right: DID selector + NFT selector + review editor */}
            <div className="flex-1 rounded-[36px] flex flex-col items-center p-8 ml-4">
                <h3 className="text-[20px] mb-3 font-bold text-cyan-300">Publish a new review</h3>
                <button
                    className="mb-4 px-4 py-2 min-w-[120px] min-h-[50px] h-auto w-auto text-[20px] font-[800] rounded-full
                    bg-cyan-500 hover:bg-cyan-600 transition flex items-center justify-center gap-2"
                    onClick={handleMintNFT}
                    disabled={loading || !selectedDid}
                >
                    Mint NFT
                </button>
                <div className="flex flex-col md:flex-row w-full gap-4 mb-4 justify-between items-center mx-auto mt-[20px] flex-1">
                    <div className="flex flex-col items-center justify-center">
                        <label className="mb-1 text-[18px] font-bold">Select DID:</label>
                        <select
                            className="px-4 py-2 rounded-xl bg-gray-900 text-cyan-200 font-mono border-2 border-cyan-400/40 text-[15px]"
                            value={selectedDid?.did || ""}
                            onChange={e => {
                                const entry = didEntries.find(d => d.did === e.target.value);
                                setSelectedDid(entry);
                                setSelectedNFT(null);
                            }}
                            disabled={didEntries.length === 0}
                        >
                            <option value="" disabled>Select a DID</option>
                            {didEntries.map(entry => (
                                <option key={entry.did} value={entry.did}>{entry.did} {entry.vcName ? `(${entry.vcName})` : ""}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col mt-[2%] items-center justify-center">
                        <label className="mb-1 text-[18px] font-bold">Select NFT:</label>
                        <select
                            className="px-4 py-2 rounded-xl bg-gray-900 text-cyan-200 font-mono border-2 border-cyan-400/40 max-w-[100px] w-auto text-[15px]"
                            value={selectedNFT?.id || ""}
                            onChange={e => {
                                const nft = userNFTs.find(n => String(n.id) === e.target.value);
                                setSelectedNFT(nft);
                            }}
                            disabled={userNFTs.length === 0}
                        >
                            <option value="" disabled>Select an NFT</option>
                            {userNFTs.map(nft => (
                                <option
                                    key={nft.id}
                                    value={nft.id}
                                    disabled={!nft.isValid}
                                >
                                    {`NFT #${nft.id}`}{!nft.isValid ? " (used/expired)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <ReviewEditor
                    selectedNFT={selectedNFT}
                    reviewText={reviewText}
                    setReviewText={setReviewText}
                    loading={loading}
                    onSubmit={handleSubmitReview}
                    submitState={submitState}
                    cid={cid}
                />
            </div>
        </div>
    );
}