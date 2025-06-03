// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * WalletAccessPanel
 * Panel for VC display and DID management
 */
import { VCCard } from "../components/WalletAccess/VCCard";
import { DIDTable } from "../components/WalletAccess/DIDTable";
import { motion } from "framer-motion";

interface WalletAccessPanelProps {
    vc: any;
    didEntries: any[];
    onCreateDid: () => void;
    onDownloadKey: (did: string, skHex: string, pkHex: string) => void;
}

export default function WalletAccessPanel({
                                              vc,
                                              didEntries,
                                              onCreateDid,
                                              onDownloadKey,
                                          }: WalletAccessPanelProps) {
    return (
        <motion.div
            className="backdrop-blur-2xl shadow-neon-cyan rounded-3xl p-8 glass-animate-in flex flex-row w-full h-full gap-8"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="w-[35%] mx-auto my-auto flex flex-col items-center justify-center ml-auto h-auto text-[17px]">
                {vc ? (
                    <VCCard vc={vc} />
                ) : (
                    <button
                        onClick={() => window.location.href = "http://localhost:8082/login"}
                        className="h-auto w-auto min-h-[50px] min-w-[150px] text-[20px] font-[800] ml-[25%] mb-[20%] rounded-full mt-4 bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] hover:text-black transition-all font-extrabold text-lg shadow-neon-cyan px-6 py-2 neon-focus focus:scale-105 active:scale-80"
                    >
                        Get VC
                    </button>
                )}
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
                <DIDTable
                    didEntries={didEntries}
                    onCreateDid={onCreateDid}
                    onDownloadKey={onDownloadKey}
                />
            </div>
        </motion.div>
    );
}