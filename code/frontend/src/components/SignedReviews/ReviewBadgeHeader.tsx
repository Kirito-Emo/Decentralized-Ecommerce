// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * ReviewBadgeHeader
 * Shows user's reputation and badge in a styled header
 */
import { motion } from "framer-motion";

export function ReviewBadgeHeader({ level, badge }: { level: number; badge: any }) {
    return (
        <motion.div
            className={`w-[50%] mx-auto mb-6 py-7 px-6 bg-gradient-to-r ${badge?.color} rounded-2xl shadow-neon-yellow text-center glass-animate-in relative`}
            initial={{ scale: 0.92, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
        >
            <span className="text-[22px] font-[600] font-extrabold tracking-wider drop-shadow-xl text-black">
                Your reputation: <span className="font-black text-3xl">{level}</span>
            </span>
            <div className="mt-2 text-xl text-gray-800 font-bold flex items-center justify-center gap-2 animate-bounce">
                {/* Confetti SVG */}
                <span className="relative confetti-badge">
                    {badge?.name}
                    <span className="absolute left-0 top-0 w-full h-full pointer-events-none">
                        <svg width="100" height="24" className="absolute -top-2 left-1/2 -translate-x-1/2">
                            <circle cx="10" cy="10" r="2" fill="#ff00ff" />
                            <circle cx="40" cy="6" r="1.7" fill="#00fff7" />
                            <circle cx="70" cy="13" r="2.2" fill="#ffe600" />
                        </svg>
                    </span>
                </span>
            </div>
        </motion.div>
    );
}