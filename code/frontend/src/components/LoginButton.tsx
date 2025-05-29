// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
// LoginButton.tsx

import React from 'react';

/**
 * Button that triggers SPID authentication flow
 */
export function LoginButton() {
    const handleLogin = () => {
        window.location.href = `${process.env.REACT_APP_API_URL}/auth/spid`;
    };

    return (
        <button className="btn" onClick={handleLogin}>
            Login with SPID
        </button>
    );
}