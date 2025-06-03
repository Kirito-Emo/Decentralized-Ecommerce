// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

contract RevocationRegistry {
    string public revocationListCID;
    address public issuerDID;

    /// @dev Event emitted when the revocation list is updated
    event RevocationListUpdated(string newCID);

    /// @dev Modifier to restrict access to the issuer
    modifier onlyIssuer(string memory did) {
        require(_compareDID(did, issuerDID), "Not Issuer");
        _;
    }

    /// @dev Constructor to set the issuer address
    constructor(address _issuerDID) {
        issuerDID = _issuerDID;
    }

    /// @dev Update the revocation list CID
    function updateRevocationList(string calldata newCID, string calldata did) external onlyIssuer(did) {
        revocationListCID = newCID;
        emit RevocationListUpdated(newCID);
    }

    /// @dev Get the current revocation list CID
    function getRevocationCID() external view returns (string memory) {
        return revocationListCID;
    }

    /// @dev Safe string comparison (for DID W3C)
    function _compareDID(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(bytes(a)) == keccak256(bytes(b)));
    }
}