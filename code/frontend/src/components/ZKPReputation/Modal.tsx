// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { CircleX } from "lucide-react";
import React from "react";

export default function Modal({
	                              open,
	                              onClose,
	                              title,
	                              children,
	                              className = ""
}: {
	open: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	className?: string;
}) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
			<div
				className={`relative inset-0 rounded-[24px] shadow-neon-cyan bg-gradient-to-b from-[#11081e] via-[#9e3aff] to-[#fef08a]/75 p-8 w-full max-w-md mx-auto flex flex-col items-center ${className}`}
				style={{ minHeight: "200px", maxWidth: "50%" }}
			>
				{title && (
					<div className="text-[cyan] font-[600] text-[22px] m-[10px] w-auto text-center">
						{title}
					</div>
				)}
				<div className="w-full mt-2 text-center text-[white] text-[18px] whitespace-pre-wrap break-words">{children}</div>
				<button
					onClick={onClose}
					className="bg-[#c9b6fc] hover:bg-[red] rounded-full w-[40px] h-[40px] mb-[20px] flex items-center justify-center mx-auto shadow-neon-cyan hover:scale-110 transition"
				>
					<CircleX className="w-[30px] h-[30px] text-cyan-400 drop-shadow-[0_0_10px_#00fff7] animate-glow"/>
				</button>
			</div>
		</div>
	);
}