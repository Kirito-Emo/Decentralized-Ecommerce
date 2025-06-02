// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

export function VCCard({ vc }: { vc: any }) {
    if (!vc) return null;
    return (
        <div className="w-full text-black">
            <h2 className="text-2xl font-bold mb-3 text-cyan-900 text-center">Verifiable Credential</h2>
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
                    <summary>Show raw VC JSON</summary>
                    <pre className="overflow-auto">{JSON.stringify(vc, null, 2)}</pre>
                </details>
            </div>
        </div>
    );
}