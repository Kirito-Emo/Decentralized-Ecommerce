// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * ZKPColumn
 * UI for a type of zero-knowledge proof
 */
import { motion } from "framer-motion";
import { ShieldCheck, BadgeCheck, Fingerprint } from "lucide-react";

export function ZKPColumn({
                              icon, color, name, description,
                              proof, onGenerate, onVerify, verifyResult
                          }: {
    icon: JSX.Element;
    color: string;
    name: string;
    description: string;
    proof: any;
    onGenerate: () => void;
    onVerify: () => void;
    verifyResult: "pending" | "ok" | "fail" | undefined;
}) {
    return (
        <motion.div
            className={`flex-1 rounded-2xl p-8 m-2 ${color} h-[500px] max-w-[500px] mx-auto my-auto mt-[50px] shadow-neon-cyan glass-animate-in flex flex-col items-center justify-center hover:scale-105 transition-all duration-300`}
            initial={{ y: 20, opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
        >
            <div className="drop-shadow-[0_0_16px_#00fff7] animate-glow mb-[20px]">{icon}</div>
            <div className="font-[800] text-[20px] mb-2 text-cyan-200">{name}</div>
            <div className="text-[16px] text-[white]/80 mb-[20px] text-center">{description}</div>
            <button
                className="bg-cyan-400/80 hover:bg-fuchsia-600/80 text-black text-[22px] font-[600] mt-[20px] min-w-[200px] min-h-[50px] rounded-[24px] px-6 py-2 font-bold shadow-neon-cyan transition focus:scale-105 active:scale-98 neon-focus mb-2"
                onClick={onGenerate}
            >
                Generate Proof
            </button>
            {proof && (
                <div className="w-full mt-[20px] text-[20px] text-[lightgreen] mb-2 text-xs bg-black/30 p-2 rounded-lg font-mono glass-animate-in">
                    {proof.proof}
                </div>
            )}
            <button
                className={`bg-cyan-400/80 hover:bg-fuchsia-600/80 text-black text-[22px] mt-[20px] font-[600] min-w-[200px] min-h-[50px] rounded-[24px] px-6 py-2 font-bold shadow-neon-cyan transition focus:scale-105 active:scale-98 neon-focus
                    ${verifyResult === "pending" ? "animate-pulse" : ""}`}
                onClick={onVerify}
                disabled={verifyResult === "pending"}
            >
                Verify on-chain
            </button>
            {verifyResult === "ok" && (
                <div className="mt-[20px] text-[20px] text-[lightgreen] font-bold flex items-center gap-2 animate-bounce">
                    <ShieldCheck className="w-5 h-5 drop-shadow-[0_0_8px_#00ff99]" /> Proof verified!
                </div>
            )}
            {verifyResult === "fail" && (
                <div className="mt-[20px] text-[20px] text-[red] font-bold flex items-center gap-2 animate-pulse">
                    <Fingerprint className="w-5 h-5 drop-shadow-[0_0_8px_#ff0059]" /> Invalid proof!
                </div>
            )}
        </motion.div>
    );
}