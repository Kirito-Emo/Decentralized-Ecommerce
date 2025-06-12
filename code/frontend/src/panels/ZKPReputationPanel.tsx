// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Main panel for ZKP proofs (VP (SD-JWT), BBS+, Semaphore)
 * File-based orchestration, on-chain anchoring, BadgeNFT integration
 * Semaphore proofs are generated fully client-side, BBS+/VP proofs handled by backend
 */

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ZKPColumn } from "../components/ZKPReputation/ZKPColumn";
import { getUserBadge, getReputation } from "../../../scripts/dApp/appBadgeNFT.js";
import { BadgeCheck, Fingerprint, ShieldCheck, Check } from "lucide-react";
import { generateSemaphoreProof } from "../utils/generateSemaphoreProof.ts";

// ---- ZKP types configuration ----
const zkpBlocks = [
    {
        name: "VP Verifier",
        color: "bg-gradient-to-b from-[#11081e]/50 via-[#9e3aff]/50 to-[#fef08a]/40",
        icon: <ShieldCheck className="w-[70px] h-[70px] mx-auto mt-[20px] mb-4 text-cyan-400 drop-shadow-[0_0_10px_#00fff7] animate-glow" />,
        proofType: 2,
        prefix: "VP_",
        description: "Generate and verify a Verifiable Presentation from your VC",
    },
    {
        name: "BBS+ Verifier",
        color: "bg-gradient-to-b from-[#11081e]/50 via-[#9e3aff]/70 to-[#fef08a]/40",
        icon: <BadgeCheck className="w-[70px] h-[70px] mx-auto mt-[20px] mb-4 text-purple-300 drop-shadow-[0_0_10px_#ba85ff] animate-glow" />,
        proofType: 1,
        prefix: "BBS_",
        description: "Prove your reputation meets a threshold using BBS+",
    },
    {
        name: "Semaphore",
        color: "bg-gradient-to-b from-[#11081e]/50 via-[#9e3aff]/50 to-[#fef08a]/50",
        icon: <Fingerprint className="w-[70px] h-[70px] mx-auto mt-[20px] mb-4 text-yellow-300 drop-shadow-[0_0_10px_#ffe600] animate-glow" />,
        proofType: 0,
        prefix: "SEM_",
        description: "Anonymous group proof (Semaphore)",
    },
];

export default function ZKPReputationPanel({ wallet, didEntries, activeDid, setActiveDid }: {
    wallet: string | null,
    didEntries: any[],
    activeDid: any,
    setActiveDid: (d: any) => void
}) {
    // BadgeNFT states
    const [badgeLevel, setBadgeLevel] = useState<number>(0);
    const [reputation, setReputation] = useState<number>(0);

    // Proof files and status (for backend proofs only)
    const [proofFiles, setProofFiles] = useState<{ [k: string]: string[] }>({ VP: [], BBS: [], SEM: [] });
    const [anchorStatus, setAnchorStatus] = useState<{ [k: string]: any }>({});
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState<{ [k: string]: boolean }>({});

    // Fetch badge and reputation on active DID change
    useEffect(() => {
        const fetchBadge = async () => {
            if (!activeDid) { setBadgeLevel(0); setReputation(0); return; }
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                setBadgeLevel(await getUserBadge(provider, activeDid.did));
                setReputation(await getReputation(provider, activeDid.did));
            } catch {
                setBadgeLevel(0); setReputation(0);
            }
        };
        fetchBadge();
    }, [activeDid]);

    // Load proof files from backend for BBS+ and VP proofs
    const loadProofFiles = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8082/proofs");
            const { files } = await res.json();
            const map: { [k: string]: string[] } = { VP: [], BBS: [], SEM: [] };
            for (const f of files) {
                if (f.startsWith("VP_")) map.VP.push(f);
                else if (f.startsWith("BBS_")) map.BBS.push(f);
                else if (f.startsWith("SEM_")) map.SEM.push(f);
            }
            setProofFiles(map);
        } catch {
            setProofFiles({ VP: [], BBS: [], SEM: [] });
        }
        setLoading(false);
    };
    useEffect(() => { loadProofFiles(); }, []);

    /**
     * Main proof generation handler:
     * - For VP (SD-JWT) and BBS+, calls backend API
     * - For Semaphore, generates ZKP fully browser-side, shows modal for info/error and downloads file locally
     */
    const handleGenerateProof = (type: string) => async (showModal: (title: string, message: React.ReactNode) => void) => {
        setGenerating(g => ({ ...g, [type]: true }));
        // ---- SEMAPHORE PROOF (browser-only, fully client-side, modal for UX) ----
        if (type === "SEM") {
            if (!activeDid || !activeDid.identitySeed || !activeDid.identityCommitment) {
                showModal("Invalid DID", "Select a valid DID with identitySeed and identityCommitment for Semaphore proof.");
                setGenerating(g => ({ ...g, [type]: false }));
                return;
            }
            try {
                // Generate ZKP in browser with wasm/zkey from @zk-kit/semaphore-artifacts
                const proof = await generateSemaphoreProof({
                    identitySeed: activeDid.identitySeed,
                    members: [activeDid.identityCommitment],
                    signal: "Decentralized Review!",
                    externalNullifierText: "Decentralized-Ecommerce:Semaphore-Proof"
                });
                // Download as JSON file
                const blob = new Blob([JSON.stringify(proof, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `SEM_proof_${Date.now()}.json`;
                link.click();
                URL.revokeObjectURL(url);
                showModal(
                    "Semaphore Proof Generated",
                    <div>
                        <div className="flex items-center justify-center mb-2">
                            <Check className="w-6 h-6 text-green-400 mr-2" /> Proof generated in browser!
                        </div>
                        <span>Your Semaphore proof was downloaded as a JSON file. To anchor on-chain, upload this file via your dApp panel or pass to a smart contract.</span>
                    </div>
                );
            } catch (err: any) {
                showModal("Error Generating Proof", err?.message || String(err));
            }
            setGenerating(g => ({ ...g, [type]: false }));
            return;
        }
        // ---- VP/BBS+ PROOFS (handled via backend API, files appear in "/code/scripts/dApp/proofs" dir) ----
        if (!wallet) {
            showModal("Wallet Required", "Connect your wallet first to generate this proof.");
            setGenerating(g => ({ ...g, [type]: false }));
            return;
        }
        try {
            const res = await fetch("http://localhost:8082/generate-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    wallet,
                    badgeLevel,
                    reputation,
                    skHex: activeDid?.skHex
                })
            });
            const data = await res.json();
            if (data.status === "ok") {
                await loadProofFiles();
                showModal(
                    `${type === "VP" ? "VP (SD-JWT)" : "BBS+"} Proof Generated`,
                    "Proof generated and saved in backend. Download or anchor on-chain from the list below."
                );
            } else {
                showModal("Proof Generation Failed", data.error || "Unknown error");
            }
        } catch (err) {
            showModal("Proof Generation Error", String(err));
        }
        setGenerating(g => ({ ...g, [type]: false }));
    };

    // Anchor a proof file on-chain (calls backend for VP/BBS+ backend proofs)
    const handleAnchorProof = (type: string, proofType: number) => async (filename: string, showModal: (title: string, message: React.ReactNode) => void) => {
        setAnchorStatus(prev => ({ ...prev, [type]: { status: "pending", filename } }));
        try {
            const res = await fetch("http://localhost:8082/anchor-proof", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename, proofType })
            });
            const data = await res.json();
            if (data.status === "anchored") {
                setAnchorStatus(prev => ({ ...prev, [type]: { status: "ok", filename, txHash: data.txHash } }));
                showModal(
                    "Proof Anchored",
                    <>Your proof is anchored on-chain!<br />Tx hash: <span className="font-mono">{data.txHash}</span></>
                );
            } else {
                setAnchorStatus(prev => ({ ...prev, [type]: { status: "fail", filename } }));
                showModal("Anchor Failed", data.error || "Unknown error");
            }
        } catch {
            setAnchorStatus(prev => ({ ...prev, [type]: { status: "fail", filename } }));
            showModal("Anchor Error", "Failed to anchor proof on-chain.");
        }
    };

    // Delete a proof file from backend (only for VP/BBS+ backend proofs)
    const handleDeleteProof = (type: string) => async (filename: string, showModal: (title: string, message: React.ReactNode) => void) => {
        try {
            await fetch(`http://localhost:8082/proofs/${filename}`, { method: "DELETE" });
            await loadProofFiles();
            showModal("Proof Deleted", "Proof file deleted successfully.");
        } catch {
            showModal("Delete Failed", "Could not delete proof file.");
        }
    };

    // --- RENDER UI ---
    return (
        <div className="mt-[50px] flex flex-col w-full h-[650px] max-h-[650px] gap-6 p-4 overflow-y-auto rounded-2xl shadow-neon-cyan glass-animate-in">
            {/* DID selector and badge display */}
            <div className="flex flex-row items-center justify-center mb-4 gap-6">
                <label className="font-bold text-cyan-200 mr-2 text-[18px]">Select DID:</label>
                <select
                    className="ml-[20px] px-4 py-2 rounded-xl bg-gray-900 text-cyan-200 font-mono border-2 border-cyan-400/40 text-[15px]"
                    value={activeDid?.did || ""}
                    onChange={e => {
                        const entry = didEntries.find(d => d.did === e.target.value);
                        setActiveDid(entry);
                    }}
                    disabled={didEntries.length === 0}
                >
                    <option value="" disabled>Select a DID</option>
                    {didEntries.map(entry => (
                        <option key={entry.did} value={entry.did}>
                            {entry.did} {entry.vcName ? `(${entry.vcName})` : ""}
                        </option>
                    ))}
                </select>
                <div className="ml-[50px] flex flex-col gap-1 bg-gray-800/80 rounded-2xl px-5 py-3">
                    <span className="text-[16px] text-cyan-100 font-bold">Reputation: {reputation}</span>
                    <span className="text-[15px] text-cyan-200">Badge: {["None", "Bronze", "Silver", "Gold"][badgeLevel]}</span>
                </div>
                <button
                    className="ml-[20px] px-4 py-2 bg-cyan-600/70 text-white rounded-lg shadow-lg hover:bg-fuchsia-500/90 font-bold"
                    onClick={loadProofFiles}
                    disabled={loading}
                >
                    Reload Proofs
                </button>
            </div>
            {/* ZKP columns for all proof types */}
            <div className="flex flex-row w-full h-[500px] max-h-[500px] gap-8">
                {zkpBlocks.map(block => {
                    const type = block.prefix.replace("_", "");
                    const files = proofFiles[type] || [];
                    const anchor = anchorStatus[type];
                    return (
                        <ZKPColumn
                            key={type}
                            icon={block.icon}
                            color={block.color}
                            name={block.name}
                            description={block.description}
                            proofFiles={files}
                            onGenerate={handleGenerateProof(type)}
                            onAnchor={handleAnchorProof(type, block.proofType)}
                            onDelete={handleDeleteProof(type)}
                            anchor={anchor}
                            loading={generating[type] || loading}
                        />
                    );
                })}
            </div>
        </div>
    );
}