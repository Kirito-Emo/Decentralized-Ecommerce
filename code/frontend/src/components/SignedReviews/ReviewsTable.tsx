// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Renders user's reviews as a scrollable table with IPFS links and NFT reference with Edit and Revoke actions
 * Shows badges for cooldown and edit limit
 */

import { useState, useRef } from "react";
import { Pencil, Trash2, XCircle, Upload, AlertTriangle, Shredder, Check, SquarePen } from "lucide-react";

export function ReviewsTable({ reviews, onEdit, onRevoke }: {
    reviews: any[];
    onEdit: (review: any, newText: string) => Promise<void>;
    onRevoke: (review: any) => Promise<void>;
}) {
    // State for edit modal
    const [editing, setEditing] = useState<null | any>(null);
    const [editText, setEditText] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    // State for revoke modal
    const [revoking, setRevoking] = useState<null | any>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Modal for edit
    const openEditModal = async (review: any) => {
        setRevoking(null);
        setEditLoading(true);
        setEditing(review);
        try {
            setEditText(review.reviewText ?? "");
        } catch {
            setEditText("[Failed to fetch review text]");
        }
        setEditLoading(false);
    };

    // Modal for revoke
    const openRevokeModal = (review: any) => {
        setEditing(null);
        setRevoking(review);
    };

    // Save edit
    const handleEditSave = async () => {
        if (!editing) return;
        setEditLoading(true);
        await onEdit(editing, editText);
        setEditing(null);
        setEditLoading(false);
    };

    // Handle revoke
    const handleRevoke = async () => {
        if (!revoking) return;
        setRevokeLoading(true);
        await onRevoke(revoking);
        setRevoking(null);
        setRevokeLoading(false);
    };

    return (
        <div
            ref={cardRef}
            className="w-[90%] h-full flex flex-col items-center justify-center relative rounded-[24px] bg-white/10 shadow-neon-cyan backdrop-blur-xl p-2 glass-animate-in"
            style={{ minHeight: 0 }}
        >
            {/* Table */}
            <div
                className="w-full mt-[30px] mx-auto flex-1 overflow-y-auto rounded-[24px]"
                style={{ maxHeight: "450px", minHeight: "200px" }}
            >
                <table className="w-full text-center text-[18px] text-[white]/90 rounded-[24px] overflow-hidden border-separate border-spacing-0">
                    <thead className="bg-gradient-to-br from-[#ba85ff]/70 to-[#fef08a]/40 text-cyan-200 font-bold sticky top-0 z-10">
                    <tr>
                        <th>Product</th>
                        <th>IPFS CID</th>
                        <th>Review</th>
                        <th>DID</th>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {reviews.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center p-4 text-gray-500">No reviews yet</td>
                        </tr>
                    )}
                    {reviews.map((r, i) => {
                        const editDisabled = r.isRevoked || r.cooldownActive;
                        const revokeDisabled = r.isRevoked;

                        return (
                            <tr key={i} className="hover:bg-fuchsia-600/10 hover:scale-[1.01] transition-all duration-200">
                                <td className="p-2 font-bold">{r.productName || "N/A"}</td>
                                <td className="p-2 font-mono break-all">
                                    {r.cid && !r.isRevoked ? (
                                        <a href={`http://localhost:5001/webui/bafybeibfd5kbebqqruouji6ct5qku3tay273g7mt24mmrfzrsfeewaal5y/#/ipfs/${r.cid}`}
                                           target="_blank" rel="noreferrer"
                                           className="text-[lightgreen] underline transition">
                                            {r.cid.slice(0, 10)}...
                                        </a>
                                    ) : (
                                        <span className="text-yellow-400">REVOKED</span>
                                    )}
                                </td>
                                <td className="p-2 wrap-anywhere">
                                    {r.reviewText && r.reviewText.length > 50 ? r.reviewText.slice(0, 50) + "..." : r.reviewText}
                                </td>
                                <td className="p-2 font-mono break-all">{r.did || ""}</td>
                                <td className="p-2">
                                    {r.lastEditDate || ""}
                                </td>
                                <td className="p-2 flex items-center justify-center gap-2">
                                    {/* Edit */}
                                    <button
                                        title={
                                            r.isRevoked
                                                ? "Review revoked"
                                                : r.cooldownActive
                                                    ? `Edit disabled for cooldown (${Math.ceil(r.cooldownRemaining / 3600)}h)`
                                                    : "Edit Review"
                                        }
                                        onClick={() => !editDisabled && openEditModal(r)}
                                        className={`rounded-full p-2 transition shadow-neon-cyan mx-[10px] my-[10px]
                                            ${editDisabled
                                            ? "bg-gray-400/40 text-gray-500 cursor-not-allowed"
                                            : "bg-cyan-200/80 hover:bg-cyan-300"
                                        }`}
                                        disabled={editDisabled}
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    {/* Revoke */}
                                    <button
                                        title={
                                            r.isRevoked
                                                ? "Review already revoked"
                                                : "Revoke Review"
                                        }
                                        onClick={() => !revokeDisabled && openRevokeModal(r)}
                                        className={`rounded-full p-2 ml-2 transition shadow-neon-cyan mx-[10px] my-[10px]
                                            ${revokeDisabled
                                            ? "bg-gray-400/40 text-gray-500 cursor-not-allowed"
                                            : "bg-pink-200/80 hover:bg-pink-300"
                                        }`}
                                        disabled={revokeDisabled}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                                <td className="p-2">
                                    {/* Status badge */}
                                    {r.isRevoked ? (
                                        <span className="inline-block px-2 py-1 bg-red-700 text-white text-xs rounded-full font-bold">
                                            <Shredder className="w-4 h-4"/>
                                        </span>
                                    ) : r.numEdits > 0 ? (
                                        <span className="inline-block px-2 py-1 bg-gray-600 text-white text-xs rounded-full font-bold">
                                            <SquarePen className="w-4 h-4"/>
                                        </span>
                                    ) : (
                                        <span className="inline-block px-2 py-1 bg-emerald-700 text-white text-xs rounded-full font-bold">
                                            <Check className="w-4 h-4"/>
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="bg-gradient-to-br from-[#b6e3ff] via-[#c9b6fc] to-[#ffc6e0] rounded-[36px] p-8 shadow-neon-cyan w-[400px] max-w-[90vw] flex flex-col items-center animate-glass-in">
                        <h2 className="text-xl font-bold text-[black] mb-2">Edit Review</h2>
                        {editing.cooldownActive && (
                            <div className="mb-3 text-yellow-600 font-bold flex gap-2 items-center">
                                <AlertTriangle className="w-5 h-5" /> Cooldown: {Math.ceil(editing.cooldownRemaining / 3600)}h remaining
                            </div>
                        )}
                        {editLoading ? (
                            <div className="text-cyan-600 my-8">Loading...</div>
                        ) : (
                            <textarea
                                className="w-[90%] h-32 p-3 mb-[15px] rounded-[24px] border-2 border-cyan-400/40 bg-white/30 text-cyan-900 font-mono resize-none glass-animate-in shadow-neon-cyan focus:scale-105 focus:ring-2 focus:ring-cyan-400 transition"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                disabled={editing.cooldownActive}
                            />
                        )}
                        <div className="flex gap-3 mt-2">
                            <button
                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[50px] h-[50px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                onClick={handleEditSave}
                                disabled={editing.cooldownActive || editLoading}
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                            <button
                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[50px] h-[50px] ml-[15px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                onClick={() => setEditing(null)}
                            >
                                <XCircle className="inline-block w-5 h-5 mr-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Modal */}
            {revoking && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="bg-gradient-to-tr from-[#b6e3ff] via-[#c9b6fc] to-[#ffc6e0] rounded-[24px] p-8 w-[350px] max-w-[90vw] flex flex-col items-center animate-glass-in">
                        <h2 className="text-xl font-bold text-[black] mb-3">Revoke Review</h2>
                        <div className="text-[black] mb-[25px]">Are you sure you want to revoke this review?</div>
                        <div className="flex gap-3 mt-2">
                            <button
                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[50px] h-[50px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                onClick={handleRevoke}
                                disabled={revokeLoading}
                            >
                                <Trash2 className="inline-block w-5 h-5 mr-1" />
                            </button>
                            <button
                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[50px] h-[50px] ml-[15px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                onClick={() => setRevoking(null)}
                            >
                                <XCircle className="inline-block w-5 h-5 mr-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}