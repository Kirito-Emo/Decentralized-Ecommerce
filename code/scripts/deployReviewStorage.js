// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Replace this mock address with actual NFT contract address in production
  const nftAddress = "0x1234567890abcdef"; // Mock NFT contract address

  const ReviewStorage = await hre.ethers.getContractFactory("ReviewStorage");
  const reviewStorage = await ReviewStorage.deploy(nftAddress);

  await reviewStorage.waitForDeployment();
  const address = await reviewStorage.getAddress();

  console.log(`✅ ReviewStorage deployed to: ${address}`);

  // Save address & ABI to frontend
  const frontendDir = path.join(__dirname, "../frontend/src/abi");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const contractJson = await hre.artifacts.readArtifact("ReviewStorage");

  fs.writeFileSync(
    path.join(frontendDir, "ReviewStorage.json"),
    JSON.stringify(contractJson, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendDir, "ReviewStorage-address.json"),
    JSON.stringify({ address }, null, 2)
  );

  console.log("📦 ABI and address saved to frontend/src/abi/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
