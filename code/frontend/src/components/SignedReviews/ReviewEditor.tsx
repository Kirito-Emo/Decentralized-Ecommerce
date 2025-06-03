// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * ReviewEditor
 * Text area, upload to IPFS and submit review to smart contract
 */
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function ReviewEditor({
                                 selectedNFT, reviewText, setReviewText, loading, onSubmit, submitState, cid
                             }: {
    selectedNFT: any;
    reviewText: string;
    setReviewText: (t: string) => void;
    loading: boolean;
    onSubmit: () => void;
    submitState: "idle" | "success" | "fail";
    cid: string;
}) {
    return (
        <div className="w-[70%] h-auto mt-[35px] p-6 rounded-2xl shadow-neon-cyan backdrop-blur-xl glass-animate-in flex flex-col gap-4">
            <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write your review..."
                className="w-[90%] h-[200px] mx-auto p-3 mt-2 rounded-xl border-2 border-cyan-400/40 bg-[white]/40 text-[cyan]-[300] font-mono resize-none glass-animate-in shadow-neon-cyan focus:scale-105 focus:ring-2 focus:ring-cyan-400 neon-focus transition"
                disabled={!selectedNFT || loading}
            />
            <button
                className={`mx-auto mt-[20px] w-[30%] py-[10px] rounded-[24px] font-[600] text-[18px] shadow-neon-cyan transition-all duration-300 neon-focus
                    ${
                    selectedNFT && reviewText
                        ? "bg-cyan-400/90 hover:bg-fuchsia-600/80 text-black focus:scale-105 active:scale-98"
                        : "bg-gray-600/40 text-gray-300 cursor-not-allowed"
                }`}
                disabled={!selectedNFT || !reviewText || loading}
                onClick={onSubmit}
            >
                {loading ? "Uploading..." : "Publish review"}
            </button>
            {submitState === "success" && (
                <div className="flex items-center gap-2 mt-4 text-[green] text-[18px] font-bold animate-bounce">
                    <CheckCircle2 className="w-6 h-6 drop-shadow-[0_0_10px_#00ff88] animate-glow" /> Review published!
                </div>
            )}
            {submitState === "fail" && (
                <div className="flex items-center gap-2 mt-4 text-[red] text-[18px] font-bold animate-pulse">
                    <AlertTriangle className="w-6 h-6 drop-shadow-[0_0_10px_#ff0059] animate-glow" /> Submit error!
                </div>
            )}
            {cid && (
                <div className="mt-2 text-xs text-cyan-200 break-all">
                    IPFS CID: <a href={`https://ipfs.io/ipfs/${cid}`} className="underline hover:text-fuchsia-400 transition" target="_blank" rel="noreferrer">{cid}</a>
                </div>
            )}
        </div>
    );
}