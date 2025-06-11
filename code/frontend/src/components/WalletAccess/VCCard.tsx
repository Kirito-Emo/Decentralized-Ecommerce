// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

/**
 * Verifiable Credential display card
 */

export function VCCard({ vc, vcStatus }: { vc: any; vcStatus?: "valid" | "revoked" | "expired" | null; }) {
    if (!vc) return null;
    return (
        <div className="ml-[40%] w-auto min-h-[250px] min-w-[450px] h-auto text-[black] bg-gradient-to-tr from-[#b6e3ff] via-[#c9b6fc] to-[#ffc6e0] rounded-xl shadow-neon-cyan p-6 mb-6 border-2 border-cyan-400/30 glass-animate-in">
            <h2 className="text-2xl font-bold mb-3 text-cyan-900 text-center drop-shadow-[0_0_8px_#00fff7]">
                Verifiable Credential
            </h2>
            {/* Status badge */}
            {vcStatus === "revoked" && (
                <div className="mb-2 px-3 py-1 bg-red-600 text-white text-center rounded-lg font-bold">Revoked</div>
            )}
            {vcStatus === "expired" && (
                <div className="mb-2 px-3 py-1 bg-yellow-500 text-black text-center rounded-lg font-bold">Expired</div>
            )}
            <div className="mb-1">
                <strong>Name:</strong> {vc.credentialSubject.name}
            </div>
            <div className="mb-1">
                <strong>User:</strong> {vc.credentialSubject.id}
            </div>
            <div className="mb-1">
                <strong>Issued at:</strong> {vc.issuanceDate}
            </div>
            <div className="mt-2 text-xs text-gray-800">
                <details>
                    <summary className="cursor-pointer text-cyan-800 hover:text-fuchsia-400">Show raw VC JSON</summary>
                    <pre className="overflow-auto text-[15px]">{JSON.stringify(vc, null, 2)}</pre>
                </details>
            </div>
        </div>
    );
}