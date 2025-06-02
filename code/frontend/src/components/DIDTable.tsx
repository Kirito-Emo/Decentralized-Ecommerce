// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { ArrowDownCircle } from "lucide-react";

interface DidEntry {
    did: string;
    skHex: string;
    pkHex: string;
    vcName: string;
}

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
        <div className="bg-[lightskyblue] rounded-[24px] shadow-xl p-8 mt-[2.5%] mr-[2%] w-[95%] h-[500px] flex flex-col border-2 border-cyan-400/50">
            <h3 className="text-xl font-[800] text-[black] mb-4 text-center">Your DIDs</h3>
            <button
                onClick={onCreateDid}
                className="mb-4 mx-auto mb-[20px] px-4 py-2 rounded-full h-[40px] w-[120px] text-[black] font-[600] hover:bg-[cyan] transition"
            >
                Create DID
            </button>
            <div className="overflow-y-auto flex-1 rounded-lg">
                <table className="w-full text-[black] text-sm border rounded-lg">
                    <thead>
                    <tr>
                        <th className="p-2 border-b border-cyan-300 bg-cyan-200">#</th>
                        <th className="p-2 border-b border-cyan-300 bg-cyan-200">VC</th>
                        <th className="p-2 border-b border-cyan-300 bg-cyan-200">DID</th>
                        <th className="p-2 border-b border-cyan-300 bg-cyan-200">Download</th>
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
                        <tr key={idx} className={idx % 2 === 0 ? "bg-cyan-50" : "bg-cyan-100"}>
                            <td className="p-2 border-b border-cyan-200 text-center font-mono">{idx + 1}</td>
                            <td className="p-2 border-b border-cyan-200 text-center font-mono">{entry.vcName}</td>
                            <td className="p-2 border-b border-cyan-200 break-all font-mono">{entry.did}</td>
                            <td className="p-2 border-b border-cyan-200 text-center">
                                <button
                                    onClick={() => onDownloadKey(entry.did, entry.skHex, entry.pkHex)}
                                    className="bg-[lightskyblue] border-0 rounded-[100%] hover:bg-[lightcoral] w-[30px] h-[30px] flex items-center justify-center mx-auto"
                                >
                                    <ArrowDownCircle className="w-[30px] h-[30px]" />
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