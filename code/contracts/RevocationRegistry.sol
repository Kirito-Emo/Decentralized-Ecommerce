// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

contract RevocationRegistry {
    string public revocationListCID;
    address public issuer;

    event RevocationListUpdated(string newCID);

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Not issuer");
        _;
    }

    constructor(address _issuer) {
        issuer = _issuer;
    }

    function updateRevocationList(string calldata newCID) external onlyIssuer {
        revocationListCID = newCID;
        emit RevocationListUpdated(newCID);
    }

    function getRevocationCID() external view returns (string memory) {
        return revocationListCID;
    }
}