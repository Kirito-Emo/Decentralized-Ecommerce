// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { useEffect, useState } from "react";

function DecryptingTitle({ text, speed = 35, className }: { text: string; speed?: number; className?: string }) {
    const [display, setDisplay] = useState(text);

    useEffect(() => {
        let frame = 0;
        let timeout: number;
        function decryptStep() {
            const newText = text.split("").map((char, i) => {
                if (char === " " || char === ".") return char;
                if (i < frame) return text[i];
                return String.fromCharCode(33 + Math.random() * 94);
            }).join("");
            setDisplay(newText);
            if (frame < text.length) {
                frame++;
                timeout = window.setTimeout(decryptStep, speed);
            } else {
                setDisplay(text);
            }
        }
        decryptStep();
        return () => clearTimeout(timeout);
    }, [text, speed]);

    return (
        <h1 className={className ?? "relative z-10 text-[50px] font-bold drop-shadow-[0_0_20px_#00fff7] font-mono tracking-wide select-none"}
            aria-label={text}>
            {display}
        </h1>
    );
}

export default DecryptingTitle;