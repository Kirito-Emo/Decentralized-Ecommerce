// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.19;

contract RevocationRegistry {
    mapping(string => bool) public revoked;
    event Revoked(string indexed cidOrId);

    function revoke(string memory cidOrId) public {
        revoked[cidOrId] = true;
        emit Revoked(cidOrId);
    }

    function isRevoked(string memory cidOrId) public view returns (bool) {
        return revoked[cidOrId];
    }
}