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
    vcStatus?: "valid" | "revoked" | "expired" | null;
    didEntries: { did: string; skHex?: string; pkHex?: string; vcName?: string; }[];
    bannedDids?: string[];
    revokedDids?: string[];
    onCreateDid: () => void;
    onDownloadKey: (did: string, skHex: string, pkHex: string) => void;
    onLogout?: () => void;
    onDeleteDid?: (did: string) => void;
}

export default function WalletAccessPanel({
                                              vc,
                                              vcStatus,
                                              didEntries,
                                              bannedDids = [],
                                              revokedDids = [],
                                              onCreateDid,
                                              onDownloadKey,
                                              onLogout,
                                              onDeleteDid,
                                          }: WalletAccessPanelProps) {
    return (
        <motion.div
            className="backdrop-blur-2xl shadow-neon-cyan rounded-3xl p-8 glass-animate-in flex flex-row w-full h-full gap-8"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* LEFT SIDE: VC card, status badge, logout OR login buttons */}
            <div className="w-[35%] mx-auto my-auto flex flex-col items-center justify-center ml-auto h-auto text-[17px]">
                {vc ? (
                    <>
                        <VCCard vc={vc} vcStatus={vcStatus} />
                        {vcStatus === "revoked" && (
                            <div className="mt-2 mb-2 px-3 py-1 bg-red-700 text-white text-center rounded-lg font-bold">
                                Credential revoked
                            </div>
                        )}
                        {vcStatus === "expired" && (
                            <div className="mt-2 mb-2 px-3 py-1 bg-yellow-600 text-white text-center rounded-lg font-bold">
                                Credential expired
                            </div>
                        )}
                        {/* --- LOGOUT BUTTON centered below VCCard --- */}
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="h-auto w-auto min-h-[50px] min-w-[150px] text-[20px] font-[800] ml-[56%] mt-[5%] mx-auto mt-8 rounded-full bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] transition-all active:scale-80"
                            >
                                Logout
                            </button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center w-full gap-4 mt-4">
                        <button
                            onClick={() =>
                                window.open(
                                    "http://localhost:8082/login-vc",
                                    "LoginVC",
                                    "width=600,height=650"
                                )
                            }
                            className="h-auto w-auto min-h-[50px] min-w-[180px] text-[20px] font-[800] ml-[30%] rounded-full bg-[#c9b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] transition-all active:scale-80"
                        >
                            Login with VC
                        </button>
                        <button
                            onClick={() => (window.location.href = "http://localhost:8082/login")}
                            className="h-auto w-auto min-h-[50px] min-w-[180px] text-[20px] font-[800] mt-[5%] ml-[30%] rounded-full bg-[#f5b6fc] border-[#8ec5e6] hover:bg-[#fffbb1] transition-all active:scale-80"
                        >
                            Login with SPID
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT SIDE: DID Table */}
            <div className="flex-1 flex flex-col items-center justify-center mt-[5%]">
                <DIDTable
                    didEntries={didEntries}
                    bannedDids={bannedDids}
                    revokedDids={revokedDids}
                    onCreateDid={onCreateDid}
                    onDownloadKey={onDownloadKey}
                    onDeleteDid={onDeleteDid}
                />
            </div>
        </motion.div>
    );
}