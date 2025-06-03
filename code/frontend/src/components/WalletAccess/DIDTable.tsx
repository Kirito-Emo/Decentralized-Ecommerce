// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { ArrowDownCircle } from "lucide-react";

interface DidEntry {
    did: string;
    skHex: string;
    pkHex: string;
    vcName: string;
}

/**
 * DIDTable
 * Table of user DIDs
 */
export function DIDTable({
                             didEntries,
                             onCreateDid,
                             onDownloadKey,
                         }: {
    didEntries: DidEntry[];
    onCreateDid: () => void;
    onDownloadKey: (did: string, skHex: string, pkHex: string) => void;
}) {
    return (
        <div className="rounded-2xl shadow-neon-cyan p-8 h-[500px] flex flex-col glass-animate-in">
            <h3 className="text-[25px] text-[#aafcdf] font-[800] mb-[10px] text-center drop-shadow-[0_0_8px_#00fff7]">Your DIDs</h3>
            <button
                onClick={onCreateDid}
                className="mx-auto min-h-[50px] w-auto min-w-[150px] text-[19px] font-[800] mt-[10px] rounded-full mt-4 bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] transition-all text-lg shadow-neon-cyan px-6 py-2 neon-focus hover:scale-105 active:scale-80"
            >
                Create DID
            </button>
            <div className="mt-[20px] overflow-y-auto flex-1 rounded-lg">
                <table className="mt-auto w-full text-[black] text-sm border-2 rounded-[12px] shadow-neon-cyan glass-animate-in border-[cyan] bg-gradient-to-tr from-[#b6e3ff] via-[#c9b6fc] to-[#ffc6e0]">
                    <thead className="bg-gradient-to-r from-cyan-800 to-purple-800 text-cyan-200 font-bold">
                        <tr>
                            <th className="p-2 border-b border-cyan-300">#</th>
                            <th className="p-2 border-b border-cyan-300">VC</th>
                            <th className="p-2 border-b border-cyan-300">DID</th>
                            <th className="p-2 border-b border-cyan-300">Download</th>
                        </tr>
                    </thead>
                    <tbody>
                        {didEntries.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-500 border-b border-cyan-200">
                                    No DIDs yet
                                </td>
                            </tr>
                        )}
                        {didEntries.map((entry, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-cyan-50/40" : "bg-cyan-100/20"}>
                                <td className="p-2 border-b border-cyan-200 text-center">{idx + 1}</td>
                                <td className="p-2 border-b border-cyan-200 text-center">{entry.vcName}</td>
                                <td className="p-2 border-b border-cyan-200 break-all">{entry.did}</td>
                                <td className="p-2 border-b border-cyan-200 text-center">
                                    <button
                                        onClick={() => onDownloadKey(entry.did, entry.skHex, entry.pkHex)}
                                        className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[30px] h-[30px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                    >
                                        <ArrowDownCircle className="w-[26px] h-[26px] text-cyan-400 drop-shadow-[0_0_10px_#00fff7] animate-glow" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}