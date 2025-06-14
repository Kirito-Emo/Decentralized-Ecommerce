// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi

/**
 * Benchmark for ReviewStorage:
 * - Uploads two versions of a review to IPFS
 * - Calls storeReview() and updateReview() for N iterations
 * - Measures gas and execution time
 * Requirements: Ganache (localhost:8545), IPFS Desktop (localhost:5001)
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const math = require("mathjs");
const { create } = require("ipfs-http-client");

async function main() {
    console.log("\n===== Benchmark: ReviewStorage store + update =====");

    // Load DID and contract address
    const addresses = JSON.parse(fs.readFileSync(path.join(__dirname, "../contract-addresses.json"), "utf8"));
    const holder = JSON.parse(fs.readFileSync(path.join(__dirname, "../interact/holder-did.json"), "utf8"));
    const holderDID = holder.did;
    let tokenId = 51;

    const ReviewStorage = await ethers.getContractAt("ReviewStorage", addresses.ReviewStorage);
    const signer = (await ethers.getSigners())[0];
    const ipfs = create({ url: "http://localhost:5001" });

    const iterations = 10;
    const gasStore = [], gasUpdate = [], timeStore = [], timeUpdate = [];

    for (let i = 0; i < iterations; i++) {
        const reviewText1 = `First honest review [${i}]`;
        const { cid: cid1 } = await ipfs.add({ content: reviewText1 });
        const ipfsCID1 = cid1.toString();

        // Store review
        const t1 = process.hrtime();
        const tx1 = await ReviewStorage.connect(signer).storeReview(holderDID, tokenId, ipfsCID1);
        const rc1 = await tx1.wait();
        const dt1 = process.hrtime(t1);
        const ms1 = dt1[0] * 1000 + dt1[1] / 1e6;

        const event = rc1.logs.find(log => log.fragment?.name === "ReviewStored");
        const reviewId = event?.args?.reviewId;

        gasStore.push(Number(rc1.gasUsed));
        timeStore.push(ms1);

        const reviewText2 = `Updated review [${i}] with improvements`;
        const { cid: cid2 } = await ipfs.add({ content: reviewText2 });
        const ipfsCID2 = cid2.toString();

        // Update review
        const t2 = process.hrtime();
        const tx2 = await ReviewStorage.connect(signer).updateReview(reviewId, ipfsCID2, holderDID);
        const rc2 = await tx2.wait();
        const dt2 = process.hrtime(t2);
        const ms2 = dt2[0] * 1000 + dt2[1] / 1e6;

        gasUpdate.push(Number(rc2.gasUsed));
        timeUpdate.push(ms2);

        tokenId++;
    }

    const printStats = (label, data) => {
        console.log(`🔹 ${label} Avg: ${math.mean(data).toFixed(2)}, Std: ${math.std(data).toFixed(2)}`);
    };

    console.log("===== Benchmark Summary =====");
    printStats("storeReview gas", gasStore);
    printStats("updateReview gas", gasUpdate);
    printStats("storeReview time (ms)", timeStore);
    printStats("updateReview time (ms)", timeUpdate);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});