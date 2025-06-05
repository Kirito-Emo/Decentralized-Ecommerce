// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * SignedReviewsPanel
 * Main panel for viewing user reputation, listing reviews, and publishing new signed reviews or to edit/revoke existing ones.
 */

import { useState, useEffect, useRef } from "react";
import { ReviewBadgeHeader } from "../components/SignedReviews/ReviewBadgeHeader";
import { ReviewsTable } from "../components/SignedReviews/ReviewsTable";
import { NFTSelector } from "../components/SignedReviews/NFTSelector";
import { ReviewEditor } from "../components/SignedReviews/ReviewEditor";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { ethers } from "ethers";
import contractAddresses from "../../../scripts/contract-addresses.json";
import BadgeNFT from "../../../artifacts/contracts/BadgeNFT.sol/BadgeNFT.json";
import ReviewManager from "../../../artifacts/contracts/ReviewManager.sol/ReviewManager.json";

const glass = "bg-[white]/10 shadow-neon-cyan backdrop-blur-xl border border-white/20 glass-animate-in";

function formatLevel(level: number) {
    if (level >= 20) return { name: "Gold Reviewer", color: "from-badge-gold via-yellow-300 to-yellow-500" };
    if (level >= 10) return { name: "Silver Reviewer", color: "from-badge-silver via-gray-200 to-gray-400" };
    return { name: "Bronze Reviewer", color: "from-badge-bronze via-orange-200 to-orange-500" };
}

export default function SignedReviewsPanel({ wallet }: { wallet: string | null }) {
    const [badge, setBadge] = useState<any>(null);
    const [level, setLevel] = useState<number>(0);
    const [reviews, setReviews] = useState<any[]>([]);
    const [userNFTs, setUserNFTs] = useState<any[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<any>(null);
    const [reviewText, setReviewText] = useState("");
    const [loading, setLoading] = useState(false);
    const [cid, setCID] = useState("");
    const [submitState, setSubmitState] = useState<"idle" | "success" | "fail">("idle");

    const ipfs = ipfsHttpClient({ url: "http://localhost:5001/api/v0" });

    // Give 5 NFTs to the user on first load (for testing purposes)
    const initialized = useRef(false);
    useEffect(() => {
        if (!wallet || initialized.current) return;
        setUserNFTs(Array.from({ length: 5 }, (_, i) => ({
            id: 100 + i,
            productName: `Mock NFT #${i + 1}`,
            isValid: true,
            used: false,
        })));
        initialized.current = true;
        console.log("Mock NFTs initialized for wallet:", wallet);
    }, [wallet]);

    // Helper to reload all reviews (and badges) after edit/revoke
    async function reloadAll() {
        if (!wallet) return;
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        try {
            const badgeContract = new ethers.Contract(contractAddresses.BadgeNFT, BadgeNFT.abi, signer);
            const userLevel = await badgeContract.getReputation(wallet);
            setLevel(Number(userLevel));
            setBadge(formatLevel(Number(userLevel)));
        } catch {
            setLevel(0);
            setBadge(formatLevel(0));
        }
        try {
            const reviewManager = new ethers.Contract(contractAddresses.ReviewManager, ReviewManager.abi, signer);
            const userReviews = await reviewManager.getReviewsByUser(wallet);
            setReviews(userReviews);
        } catch {
            setReviews([]);
        }
    }

    useEffect(() => {
        if (submitState === "success") {
            const timeout = setTimeout(() => setSubmitState("idle"), 2200);
            return () => clearTimeout(timeout);
        }
    }, [submitState]);

    useEffect(() => {
        reloadAll();
        // eslint-disable-next-line
    }, [wallet, submitState]);

    // Handle submit new review
    const handleSubmitReview = async () => {
        setLoading(true);
        setSubmitState("idle");
        try {
            const ipfsRes = await ipfs.add(reviewText);
            setCID(ipfsRes.cid.toString());
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const reviewManager = new ethers.Contract(contractAddresses.ReviewManager, ReviewManager.abi, signer);
            await reviewManager.submitReview(selectedNFT.id, ipfsRes.cid.toString());

            // Remove the used NFT
            setUserNFTs(prevNFTs => prevNFTs.filter(nft => nft.id !== selectedNFT.id));

            setReviewText("");
            setSelectedNFT(null);
            setSubmitState("success");
            await reloadAll();
        } catch (e) {
            setSubmitState("fail");
        }
        setLoading(false);
    };

    /**
     * Edits an existing review by uploading new text to IPFS and updating on-chain.
     * @param review The review object (must contain nftId)
     * @param newText The new review text
     */
    const handleEdit = async (review: any, newText: string) => {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const reviewManager = new ethers.Contract(contractAddresses.ReviewManager, ReviewManager.abi, signer);

        // Upload new text to IPFS
        const ipfsRes = await ipfs.add(newText);
        const newCid = ipfsRes.cid.toString();

        // Call smart contract to update the review
        await reviewManager.editReview(review.nftId, newCid);

        // Reload all data
        await reloadAll();
    };

    /**
     * Revokes an existing review by calling the smart contract.
     * @param review The review object (must contain nftId)
     */
    const handleRevoke = async (review: any) => {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const reviewManager = new ethers.Contract(contractAddresses.ReviewManager, ReviewManager.abi, signer);

        await reviewManager.revokeReview(review.nftId);

        // Reload all data
        await reloadAll();
    };

    console.log("Mock NFTs:", userNFTs);

    return (
        <div className="flex flex-row w-full h-auto gap-8 p-4 mt-[25px]">
            {/* Left: reputation + table */}
            <div className={`flex-1 rounded-[36px] flex flex-col items-center p-8 mr-4`}>
                <ReviewBadgeHeader level={level} badge={badge} />
                <ReviewsTable
                    reviews={reviews}
                    onEdit={handleEdit}
                    onRevoke={handleRevoke}
                />
            </div>
            {/* Right: NFT selector + editor */}
            <div className={`flex-1 rounded-[36px] flex flex-col items-center p-8 ml-4`}>
                <h3 className="text-[20px] mb-3 font-bold text-cyan-300">Publish a new review</h3>
                { /* NFT Selector */ }
                <div className="flex flex-col md:flex-row w-full gap-4 mb-4 justify-between items-center mx-auto mt-[20px] flex-1">
                    <NFTSelector nfts={userNFTs} selected={selectedNFT} setSelected={setSelectedNFT} />
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