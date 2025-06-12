// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Single column for a ZKP type: lists proofs, actions for anchor/delete, visual feedback
 */

import { Fingerprint, Upload, Link2, Check, Trash2 } from "lucide-react";
import React, { useState } from "react";
import Modal from "./Modal";

export function ZKPColumn({
                              icon, color, name, description,
                              proofFiles, onGenerate, onAnchor, onDelete,
                              anchor, loading
}: {
    icon: React.ReactNode;
    color: string;
    name: string;
    description: string;
    proofFiles: string[];
    onGenerate: (showModal: (title: string, message: React.ReactNode) => void) => void;
    onAnchor: (filename: string, showModal: (title: string, message: React.ReactNode) => void) => void;
    onDelete: (filename: string, showModal: (title: string, message: React.ReactNode) => void) => void;
    anchor: any;
    loading: boolean;
}) {
    // Local modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState<string>("");
    const [modalMessage, setModalMessage] = useState<React.ReactNode>("");

    // Show modal helper
    function showModal(title: string, message: React.ReactNode) {
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
    }

    // --- RENDER UI ---
    return (
        <div className={`flex-1 rounded-2xl p-8 m-2 ${color} h-[500px] max-w-[500px] mx-auto my-auto mt-[50px] shadow-neon-cyan glass-animate-in flex flex-col items-center justify-center hover:scale-105 transition-all duration-300`}>
            {/* Modal for feedback/errors, scoped to this column */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
                {modalMessage}
            </Modal>
            <div className="drop-shadow-[0_0_16px_#00fff7] animate-glow mb-[20px]">{icon}</div>
            <div className="font-[800] text-[20px] mb-2 text-cyan-200">{name}</div>
            <div className="text-[16px] text-[white]/80 mb-[20px] text-center">{description}</div>
            <button
                className="bg-cyan-400/80 hover:bg-fuchsia-600/80 text-black text-[22px] font-[600] mt-[20px] min-w-[200px] min-h-[50px] rounded-[24px] px-6 py-2 shadow-neon-cyan transition focus:scale-105 active:scale-98 neon-focus mb-2"
                onClick={() => onGenerate(showModal)}
                disabled={loading}
            >
                {loading && <span className="animate-spin mr-2 w-4 h-4 border-2 border-t-2 border-cyan-600 rounded-full" />}
                Generate Proof
            </button>
            <ul className="w-[75%] mt-[50px]">
                {proofFiles.length === 0 && <li className="text-gray-400 text-center">No proof found</li>}
                {proofFiles.map(filename => (
                    <li key={filename} className="flex flex-row gap-2 items-center text-xs bg-black/30 rounded-lg px-2 py-1 my-[10px] font-mono">
                        <a href={`http://localhost:8082/proofs/${filename}`} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> {filename}
                        </a>
                        <div className="flex flex-col gap-[10px] mt-2">
                            <button
                                onClick={() => onAnchor(filename, showModal)}
                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[100px] h-[50px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                disabled={anchor?.status === "pending" && anchor?.filename === filename}
                            >
                                <Upload className="w-3 h-3 mr-1" /> Anchor on-chain
                            </button>
                            <button
                                onClick={() => onDelete(filename, showModal)}
                                className="bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] rounded-full w-[30px] h-[30px] flex items-center justify-center mx-auto shadow-neon-cyan transition"
                                disabled={anchor?.status === "pending" && anchor?.filename === filename}
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                            </button>
                            {anchor?.filename === filename && anchor.status === "pending" && (
                                <span className="ml-2 text-yellow-400 flex items-center">
                                    <Upload className="w-3 h-3 animate-spin" /> Anchoring…
                                </span>
                            )}
                            {anchor?.filename === filename && anchor.status === "ok" && (
                                <span className="ml-2 text-green-400 flex items-center">
                                    <Check className="w-3 h-3" /> Anchored!
                                </span>
                            )}
                            {anchor?.filename === filename && anchor.status === "fail" && (
                                <span className="ml-2 text-red-400 flex items-center">
                                    <Fingerprint className="w-3 h-3" /> Failed!
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}