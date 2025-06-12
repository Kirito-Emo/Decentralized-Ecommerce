// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";
import { maybeGetSnarkArtifacts, Project } from "@zk-kit/artifacts"

/**
 * Generate a Semaphore ZK proof for group membership in the browser
 */
export async function generateSemaphoreProof({
	                                             identitySeed,
	                                             members,
	                                             signal,
	                                             externalNullifierText,
	                                             groupDepth = 20
}: {
	identitySeed: string;
	members: string[];
	signal: string;
	externalNullifierText: string;
	groupDepth?: number
}) {
	// Create identity from seed
	const identity = new Identity(identitySeed);

	// Create empty group
	const group = new Group();

	// Add all current identity commitments
	for (const m of members) group.addMember(BigInt(m));

	// Hash the external nullifier string to BigInt (SHA-256)
	const encoder = new TextEncoder();
	const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoder.encode(externalNullifierText));
	const externalNullifier = BigInt("0x" + Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join(""));

	// Download zk-SNARK artifacts automatically from zk-kit (WASM/ZKEY for depth)
	const snarkArtifacts = await maybeGetSnarkArtifacts(Project.SEMAPHORE, { parameters: [groupDepth], version: "4.0.0" });

	// Call as object
	return await generateProof(
		identity,
		group,
		signal,
		externalNullifier,
		groupDepth,
		snarkArtifacts
	);
}