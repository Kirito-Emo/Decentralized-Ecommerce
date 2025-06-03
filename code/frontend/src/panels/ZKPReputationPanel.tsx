// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * ZKPReputationPanel
 * Main panel with three columns for ZKP/VP/Semaphore proofs.
 * Visual: glass, neon, animated icon, cyber-gradient background.
 */
import { useState } from "react";
import { ShieldCheck, BadgeCheck, Fingerprint } from "lucide-react";
import { ZKPColumn } from "../components/ZKPReputation/ZKPColumn";

const zkpBlocks = [
    {
        name: "VP Verifier",
        color: "bg-gradient-to-br from-[#fef08a]/50 via-[#9e3aff]/50 to-[#11081e]/40",
        icon: <ShieldCheck className="w-[70px] h-[70px] mx-auto mt-[20px] mb-4 text-cyan-400 drop-shadow-[0_0_10px_#00fff7] animate-glow item" />,
        description: "Generate and verify a Verifiable Presentation from your VC.",
    },
    {
        name: "BBS+ Verifier",
        color: "bg-gradient-to-br from-[#ba85ff]/60 via-[#3b006a]/70 to-[#fef08a]/40",
        icon: <BadgeCheck className="w-[70px] h-[70px] mx-auto mt-[20px] mb-4 text-purple-300 drop-shadow-[0_0_10px_#ba85ff] animate-glow" />,
        description: "Prove your badge/reputation meets a threshold using BBS+.",
    },
    {
        name: "Semaphore",
        color: "bg-gradient-to-br from-[#00fff7]/40 via-[#29126d]/60 to-[#ba85ff]/60",
        icon: <Fingerprint className="w-[70px] h-[70px] mx-auto mt-[20px] mb-4 text-yellow-300 drop-shadow-[0_0_10px_#ffe600] animate-glow" />,
        description: "Anonymous group proof (Semaphore).",
    },
];

export default function ZKPReputationPanel({ wallet }: { wallet: string | null }) {
    const [vpProof, setVpProof] = useState<any>(null);
    const [bbsProof, setBbsProof] = useState<any>(null);
    const [semProof, setSemProof] = useState<any>(null);
    const [verifyResult, setVerifResult] = useState<{ [k: string]: "pending" | "ok" | "fail" }>({});

    const handleGenerate = async (type: string) => {
        setVerifResult(v => ({ ...v, [type]: "pending" }));
        try {
            const fakeProof = { proof: `fake-${type}-proof`, data: Date.now() };
            if (type === "VP") setVpProof(fakeProof);
            if (type === "BBS") setBbsProof(fakeProof);
            if (type === "SEM") setSemProof(fakeProof);
        } catch {
            setVerifResult(v => ({ ...v, [type]: "fail" }));
        }
    };

    const handleVerify = async (type: string) => {
        setVerifResult(v => ({ ...v, [type]: "pending" }));
        setTimeout(() => {
            setVerifResult(v => ({ ...v, [type]: Math.random() > 0.2 ? "ok" : "fail" })); // Random ok/fail
        }, 1200);
    };

    return (
        <div className="flex flex-row w-full h-[500] gap-8 p-4 overflow-y-auto rounded-2xl shadow-neon-cyan glass-animate-in">
            <ZKPColumn
                icon={zkpBlocks[0].icon}
                color={zkpBlocks[0].color}
                name={zkpBlocks[0].name}
                description={zkpBlocks[0].description}
                proof={vpProof}
                onGenerate={() => handleGenerate("VP")}
                onVerify={() => handleVerify("VP")}
                verifyResult={verifyResult["VP"]}
            />
            <ZKPColumn
                icon={zkpBlocks[1].icon}
                color={zkpBlocks[1].color}
                name={zkpBlocks[1].name}
                description={zkpBlocks[1].description}
                proof={bbsProof}
                onGenerate={() => handleGenerate("BBS")}
                onVerify={() => handleVerify("BBS")}
                verifyResult={verifyResult["BBS"]}
            />
            <ZKPColumn
                icon={zkpBlocks[2].icon}
                color={zkpBlocks[2].color}
                name={zkpBlocks[2].name}
                description={zkpBlocks[2].description}
                proof={semProof}
                onGenerate={() => handleGenerate("SEM")}
                onVerify={() => handleVerify("SEM")}
                verifyResult={verifyResult["SEM"]}
            />
        </div>
    );
}