// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Lets user pick a DID from their available identities
 */

import { motion } from "framer-motion";

export function DIDSelector({ dids, selected, setSelected }: {
	dids: any[];
	selected: any;
	setSelected: (did: any) => void;
}) {
	return (
		<div className="mb-4">
			<label className="block mb-2 text-[18px] font-bold">Select DID:</label>
			<div className="flex flex-wrap gap-3">
				{dids.length === 0 && (
					<span className="text-gray-400">No DID available</span>
				)}
				{dids.map((entry, idx) => (
					<motion.div
						key={entry.did}
						className={`rounded-2xl px-6 py-5 bg-gradient-to-tr from-[#2a0044] via-[#002f3a] to-[#00fff7]/40
						shadow-neon-cyan border-2 border-white/10 cursor-pointer transition-all duration-300 font-mono glass-animate-in
						
						${ selected?.did === entry.did
							? "border-yellow-400 scale-110 shadow-neon-yellow"
							: "border-transparent hover:scale-105 hover:shadow-[0_0_30px_#ff00ff]"
						}`}

						whileTap={{ scale: 0.97 }}
						onClick={() => setSelected(entry)}
						title={entry.did}
					>
						<span className="font-bold text-cyan-100 break-all">{entry.did}</span>
						<div className="text-xs text-cyan-200">{entry.vcName || "DID"}</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}