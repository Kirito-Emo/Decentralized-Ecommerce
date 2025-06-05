// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.25",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
    tests: "./test"
  }
};