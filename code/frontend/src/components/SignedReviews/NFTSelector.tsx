// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * NFTSelector
 * Lets user pick an available NFT to associate with their review
 */
import { motion } from "framer-motion";

export function NFTSelector({ nfts, selected, setSelected }: { nfts: any[]; selected: any; setSelected: (nft: any) => void }) {
    return (
        <div className="mb-4">
            <label className="block mb-2 text-[18px] font-bold">Select NFT:</label>
            <div className="flex flex-wrap gap-3">
                {nfts.length === 0 && (
                    <span className="text-gray-400">No NFT available</span>
                )}
                {nfts.map((nft, idx) => (
                    <motion.div
                        key={nft.id}
                        className={`rounded-2xl px-6 py-5 bg-gradient-to-tr from-[#121e3a] via-[#2a0099] to-[#00fff7]/40
                            shadow-neon-cyan border-2 border-white/10 cursor-pointer 
                            transition-all duration-300 font-mono glass-animate-in
                            ${
                            selected?.id === nft.id
                                ? "border-yellow-400 scale-110 shadow-neon-yellow"
                                : "border-transparent hover:scale-105 hover:shadow-[0_0_30px_#ff00ff]"
                        }`}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelected(nft)}
                    >
                        <span className="font-bold text-cyan-100 drop-shadow-[0_0_8px_#00fff7]">#{nft.id}</span>
                        <div className="text-xs text-cyan-200">{nft.productName || "NFT"}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}