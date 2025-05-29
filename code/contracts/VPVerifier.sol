// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.19;

contract VPVerifier {
    event VPVerified(address indexed verifier, string jwt);

    function verifyVP(string memory vpJwt) external pure returns (bool) {
        require(bytes(vpJwt).length > 0, "VP is empty");
        return true;
    }
}