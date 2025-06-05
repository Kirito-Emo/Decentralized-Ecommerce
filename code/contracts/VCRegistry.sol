// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

/// @title VCRegistry - Verifiable Credential Registry with DID support and trusted issuer control
/// @notice This contract anchors on-chain the hashes of Verifiable Credentials (VCs) issued off-chain
///         Only addresses whitelisted as "trusted issuers" can register or revoke VC hashes
///         For each VC hash, the registry stores: issuer (address + DID), subject DID, timestamp, and revocation status
///         No personal data or cleartext attributes are ever stored; only minimal audit and compliance data
contract VCRegistry {
    /// @dev Structure for each VC registration entry
    struct VCRecord {
        address issuer;         // Ethereum address of the issuer (on-chain authority)
        string issuerDID;       // DID of the issuer (for cross-chain or off-chain verification)
        string subjectDID;      // DID of the credential subject
        uint256 timestamp;      // Registration timestamp (block.time)
        bool revoked;           // Revocation status (false=valid, true=revoked)
    }

    /// @dev Maps VC hash to its registration record
    mapping(bytes32 => VCRecord) public registry;

    /// @dev Maps address to trusted issuer status
    mapping(address => bool) public trustedIssuer;

    /// @dev Events for monitoring registry actions
    event VCRegistered(bytes32 indexed vcHash, address indexed issuer, string issuerDID, string subjectDID, uint256 timestamp);
    event VCRevoked(bytes32 indexed vcHash, address indexed issuer, uint256 timestamp);
    event TrustedIssuerSet(address indexed issuer, bool enabled);

    /// @dev Restricts access to only trusted issuers
    modifier onlyTrustedIssuer() {
        require(trustedIssuer[msg.sender], "Not a trusted issuer");
        _;
    }

    /// @dev The deployer is set as the first trusted issuer
    constructor() {
        trustedIssuer[msg.sender] = true;
        emit TrustedIssuerSet(msg.sender, true);
    }

    /// @dev Set or unset a trusted issuer
    function setTrustedIssuer(address issuer, bool enabled) external onlyTrustedIssuer {
        trustedIssuer[issuer] = enabled;
        emit TrustedIssuerSet(issuer, enabled);
    }

    /// @dev Registers a new VC hash anchored on-chain
    function registerVC(bytes32 vcHash, string calldata issuerDID, string calldata subjectDID) external onlyTrustedIssuer {
        require(registry[vcHash].timestamp == 0, "VC already registered");
        registry[vcHash] = VCRecord({
            issuer: msg.sender,
            issuerDID: issuerDID,
            subjectDID: subjectDID,
            timestamp: block.timestamp,
            revoked: false
        });
        emit VCRegistered(vcHash, msg.sender, issuerDID, subjectDID, block.timestamp);
    }

    /// @dev Revokes a registered VC
    function revokeVC(bytes32 vcHash) external onlyTrustedIssuer {
        VCRecord storage rec = registry[vcHash];
        require(rec.timestamp != 0, "VC not registered");
        require(rec.issuer == msg.sender, "Only the issuer can revoke");
        require(!rec.revoked, "VC already revoked");
        rec.revoked = true;
        emit VCRevoked(vcHash, msg.sender, block.timestamp);
    }

    /// @dev Checks if the VC hash is registered and not revoked
    function isValid(bytes32 vcHash) external view returns (bool valid) {
        VCRecord storage rec = registry[vcHash];
        valid = (rec.timestamp != 0 && !rec.revoked);
    }

    /// @dev Returns all details of a VC hash
    function getVC(bytes32 vcHash) external view returns (VCRecord memory record) {
        record = registry[vcHash];
    }
}