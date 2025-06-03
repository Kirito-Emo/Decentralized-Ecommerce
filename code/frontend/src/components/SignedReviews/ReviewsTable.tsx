// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * ReviewsTable
 * Renders user's reviews as a table with IPFS links and NFT reference with Edit and Revoke actions.
 *
 * Props:
 * - reviews: [{ productName, cid, nftId, timestamp, canEdit, canRevoke, isValid, ... }]
 * - onEdit: (review, newText) => Promise<void>
 * - onRevoke: (review) => Promise<void>
 */

import { useState } from "react";
import { Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

export function ReviewsTable({
                                 reviews,
                                 onEdit,
                                 onRevoke,
                             }: {
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

    // Open edit modal and fetch current review from IPFS
    const openEditModal = async (review: any) => {
        setEditLoading(true);
        setEditing(review);
        try {
            const response = await fetch(`https://ipfs.io/ipfs/${review.cid}`);
            const text = await response.text();
            setEditText(text);
        } catch {
            setEditText("[Failed to fetch from IPFS]");
        }
        setEditLoading(false);
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
        <div className="w-[80%] h-[80%] mt-[50px] flex-1 overflow-auto rounded-xl bg-white/10 shadow-neon-cyan backdrop-blur-xl mt-2 p-2 glass-animate-in">
            <table className="w-full text-center text-[18px] text-[white]/90 rounded-xl overflow-hidden border-separate border-spacing-0">
                <thead className="bg-gradient-to-br from-[#ba85ff]/70 to-[#fef08a]/40 text-cyan-200 font-bold">
                <tr>
                    <th className="p-3 tracking-wider">Product</th>
                    <th className="p-3">IPFS CID</th>
                    <th className="p-3">NFT</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Action</th>
                </tr>
                </thead>
                <tbody>
                {reviews.length === 0 && (
                    <tr>
                        <td colSpan={5} className="text-center p-4 text-gray-500">No reviews yet</td>
                    </tr>
                )}
                {reviews.map((r, i) => (
                    <tr key={i} className="hover:bg-fuchsia-600/10 hover:scale-[1.01] transition-all duration-200">
                        <td className="p-2 font-bold">{r.productName || "N/A"}</td>
                        <td className="p-2 font-mono break-all">
                            <a href={`https://ipfs.io/ipfs/${r.cid}`} target="_blank" rel="noreferrer"
                               className="hover:text-cyan-400 underline transition">{r.cid.slice(0, 10)}...</a>
                        </td>
                        <td className="p-2 font-mono">{r.nftId}</td>
                        <td className="p-2">{new Date(Number(r.timestamp) * 1000).toLocaleDateString()}</td>
                        <td className="p-2 flex items-center justify-center gap-2">
                            {r.canEdit && r.isValid && (
                                <button
                                    title="Edit Review"
                                    onClick={() => openEditModal(r)}
                                    className="rounded-full p-2 bg-cyan-200/80 hover:bg-cyan-300 transition shadow-neon-cyan"
                                >
                                    <Pencil className="w-5 h-5 text-cyan-700 drop-shadow-[0_0_6px_#b6e3ff]" />
                                </button>
                            )}
                            {r.canRevoke && r.isValid && (
                                <button
                                    title="Revoke Review"
                                    onClick={() => setRevoking(r)}
                                    className="rounded-full p-2 bg-pink-200/80 hover:bg-pink-300 transition shadow-neon-cyan"
                                >
                                    <Trash2 className="w-5 h-5 text-fuchsia-700 drop-shadow-[0_0_6px_#ffc6e0]" />
                                </button>
                            )}
                            {!r.isValid && (
                                <span className="text-xs text-gray-400 italic">Expired</span>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="bg-gradient-to-br from-[#b6e3ff] via-[#c9b6fc] to-[#ffc6e0] rounded-2xl p-8 shadow-neon-cyan w-[400px] max-w-[90vw] flex flex-col items-center animate-glass-in">
                        <h2 className="text-xl font-bold text-cyan-800 mb-2">Edit Review</h2>
                        {editLoading ? (
                            <div className="text-cyan-600 my-8">Loading...</div>
                        ) : (
                            <textarea
                                className="w-full h-32 p-3 mb-3 rounded-xl border-2 border-cyan-400/40 bg-white/30 text-cyan-900 font-mono resize-none glass-animate-in shadow-neon-cyan focus:scale-105 focus:ring-2 focus:ring-cyan-400 transition"
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                            />
                        )}
                        <div className="flex gap-3 mt-2">
                            <button
                                className="px-6 py-2 rounded-full bg-cyan-400 text-black font-bold shadow-neon-cyan hover:bg-cyan-500 transition disabled:opacity-60"
                                onClick={handleEditSave}
                                disabled={editLoading}
                            >
                                <CheckCircle2 className="inline-block w-5 h-5 mr-1" /> Save
                            </button>
                            <button
                                className="px-6 py-2 rounded-full bg-pink-200 text-fuchsia-800 font-bold shadow-neon-cyan hover:bg-fuchsia-200 transition"
                                onClick={() => setEditing(null)}
                            >
                                <XCircle className="inline-block w-5 h-5 mr-1" /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Modal */}
            {revoking && (
                <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
                    <div className="bg-gradient-to-br from-[#ffc6e0] via-[#fffbb1] to-[#b6e3ff] rounded-2xl p-8 shadow-neon-cyan w-[350px] max-w-[90vw] flex flex-col items-center animate-glass-in">
                        <h2 className="text-xl font-bold text-fuchsia-700 mb-3">Revoke Review</h2>
                        <div className="text-cyan-800 mb-5">Are you sure you want to revoke this review?</div>
                        <div className="flex gap-3 mt-2">
                            <button
                                className="px-6 py-2 rounded-full bg-fuchsia-300 text-fuchsia-900 font-bold shadow-neon-cyan hover:bg-fuchsia-400 transition disabled:opacity-60"
                                onClick={handleRevoke}
                                disabled={revokeLoading}
                            >
                                <Trash2 className="inline-block w-5 h-5 mr-1" /> Yes, Revoke
                            </button>
                            <button
                                className="px-6 py-2 rounded-full bg-cyan-200 text-cyan-900 font-bold shadow-neon-cyan hover:bg-cyan-300 transition"
                                onClick={() => setRevoking(null)}
                            >
                                <XCircle className="inline-block w-5 h-5 mr-1" /> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}