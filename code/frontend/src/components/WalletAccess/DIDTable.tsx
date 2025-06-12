// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/*
 * Decentralized Identifier (DID) management table component
 */

import { ArrowDownCircle, X, Ban, Check, Trash2 } from "lucide-react";

interface DIDEntry {
    did: string;
    skHex?: string;
    pkHex?: string;
    identityCommitment?: string;
    vcName?: string;
    joinedSemaphore?: boolean; // track Semaphore group status
}

interface DIDTableProps {
    didEntries: DIDEntry[];
    bannedDids?: string[];
    revokedDids?: string[];
    onCreateDid: () => void;
    onDownloadKey: (did: string, skHex: string, pkHex: string) => void;
    onDeleteDid?: (did: string) => void;
    onJoinSemaphoreGroup?: (didEntry: DIDEntry) => void;
}

export function DIDTable({
                             didEntries,
                             bannedDids = [],
                             revokedDids = [],
                             onCreateDid,
                             onDownloadKey,
                             onDeleteDid,
                             onJoinSemaphoreGroup
}: DIDTableProps) {
    const sortedEntries = [...didEntries].sort((a, b) => a.did.localeCompare(b.did));

    return (
        <div className="rounded-2xl shadow-neon-cyan p-8 h-[500px] flex flex-col glass-animate-in">
            <h3 className="text-[25px] text-[#aafcdf] font-[800] mb-[10px] text-center drop-shadow-[0_0_8px_#00fff7]">Your DIDs</h3>
            <button
                onClick={onCreateDid}
                className="mx-auto min-h-[50px] w-auto min-w-[150px] text-[19px] font-[800] mt-[10px] rounded-full mt-4 bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] transition-all text-lg shadow-neon-cyan px-6 py-2 neon-focus hover:scale-105 active:scale-80"
            >
                New DID
            </button>
            <div className="mt-[20px] overflow-y-auto flex-1 rounded-lg">
                <table className="mt-auto w-full text-[black] text-sm border-2 rounded-[12px] shadow-neon-cyan glass-animate-in border-[cyan] bg-gradient-to-tr from-[#b6e3ff] via-[#c9b6fc] to-[#ffc6e0]">
                    <thead className="bg-gradient-to-r from-cyan-800 to-purple-800 text-cyan-200 font-bold">
                    <tr>
                        <th className="p-2 border-b border-cyan-300">#</th>
                        <th className="p-2 border-b border-cyan-300">VC</th>
                        <th className="p-2 border-b border-cyan-300">DID</th>
                        <th className="p-2 border-b border-cyan-300">Status</th>
                        <th className="p-2 border-b border-cyan-300">Download</th>
                        <th className="p-2 border-b border-cyan-300">Delete</th>
                        <th className="p-2 border-b border-cyan-300">Semaphore</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedEntries.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="p-4 text-center text-gray-500 border-b border-cyan-200">
                                No DIDs yet. Click "New DID" to create one.
                            </td>
                        </tr>
                    ) : (
                        sortedEntries.map((entry, idx) => {
                            const isBanned = bannedDids.includes(entry.did);
                            const isRevoked = revokedDids.includes(entry.did);
                            return (
                                <tr key={entry.did} className={idx % 2 === 0 ? "bg-cyan-50/40" : "bg-cyan-100/20"}>
                                    <td className="p-2 text-center font-bold">{idx + 1}</td>
                                    <td className="px-4 py-2 font-semibold">{entry.vcName ?? "—"}</td>
                                    <td className="px-4 py-2 text-[15px] break-all">{entry.did}</td>
                                    <td className="px-4 py-2 text-center">
                                        {isRevoked ? (
                                            <span className="inline-block px-2 py-1 bg-red-700 text-white text-xs rounded-full font-bold" title="Revoked DID"><X /></span>
                                        ) : isBanned ? (
                                            <span className="inline-block px-2 py-1 bg-yellow-600 text-white text-xs rounded-full font-bold" title="Banned DID"><Ban /></span>
                                        ) : (
                                            <span className="inline-block px-2 py-1 bg-emerald-700 text-white text-xs rounded-full font-bold" title="Active DID"><Check /></span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => onDownloadKey(entry.did, entry.skHex ?? "", entry.pkHex ?? "")}
                                            className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[40px] h-[40px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                            title="Download Keys"
                                        >
                                            <ArrowDownCircle className="w-[26px] h-[26px] text-cyan-400 drop-shadow-[0_0_10px_#00fff7] animate-glow" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {onDeleteDid && (
                                            <button
                                                onClick={() => onDeleteDid(entry.did)}
                                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[40px] h-[40px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                                title="Delete DID"
                                            >
                                                <Trash2 className="w-[20px] h-[20px] text-red-700" />
                                            </button>
                                        )}
                                    </td>
                                    {/* Semaphore group join logic */}
                                    <td className="px-4 py-2 text-center">
                                        {onJoinSemaphoreGroup && !entry.joinedSemaphore && (
                                            <button
                                                onClick={() => onJoinSemaphoreGroup(entry)}
                                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[120px] h-[60px] text-[15px] font-[600] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                                title="Join Semaphore Group"
                                            >
                                                Join Semaphore
                                            </button>
                                        )}
                                        {entry.joinedSemaphore && (
                                            <span className="inline-block px-2 py-1 bg-emerald-400/80 text-white text-xs rounded-full font-bold">In group</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}