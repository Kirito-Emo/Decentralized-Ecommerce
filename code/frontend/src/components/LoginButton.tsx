// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
// LoginButton.tsx

/**
 * Button that triggers SPID authentication flow
 */
export function LoginButton() {
    const handleLogin = () => {
        window.location.href = `${process.env.REACT_APP_API_URL}/auth/spid`;
    };

    return (
        <button
            className="bg-gradient-to-r from-cyan-400 to-purple-400 text-black font-bold rounded-2xl px-8 py-3 shadow-neon-cyan hover:bg-fuchsia-600/80 neon-focus focus:scale-105 active:scale-98 transition-all duration-300"
            onClick={handleLogin}
        >
            Login with SPID
        </button>
    );
}