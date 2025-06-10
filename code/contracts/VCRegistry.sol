// SPDX-License-Identifier: Apache 2.0
pragma solidity ^0.8.25;

/// @title VCRegistry - Verifiable Credential Registry with IPFS bitstring status list (W3C/WP2 compliant)
/// @notice Anchors VC hashes on-chain, manages trusted issuers, and exposes IPFS CIDs for audit/status bitstrings

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

    /// @dev Whitelist for trusted issuers
    mapping(address => bool) public trustedIssuer;

    /// @dev IPFS CIDs for different status lists (W3C/WP2)
    string public emittedListCID;    // List of all emitted VC hashes (optional)
    string public statusListCID;     // VC Status List (bitstring W3C VC Status List 2021)
    string public revokedListCID;    // List of revoked VC hashes (legacy/simple)

    /// @dev Events
    event VCRegistered(bytes32 indexed vcHash, address indexed issuer, string issuerDID, string subjectDID, uint256 timestamp);
    event VCRevoked(bytes32 indexed vcHash, address indexed issuer, uint256 timestamp);
    event TrustedIssuerSet(address indexed issuer, bool enabled);
    event EmittedListCIDUpdated(string newCID, uint256 timestamp);
    event StatusListCIDUpdated(string newCID, uint256 timestamp);
    event RevokedListCIDUpdated(string newCID, uint256 timestamp);

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

    /// @dev Registers a new VC hash on-chain
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

    /// @dev Sets the IPFS CID of the full list of emitted VC hashes
    function setEmittedListCID(string calldata newCID) external onlyTrustedIssuer {
        emittedListCID = newCID;
        emit EmittedListCIDUpdated(newCID, block.timestamp);
    }

    /// @dev Returns the IPFS CID of the emitted list
    function getEmittedListCID() external view returns (string memory) {
        return emittedListCID;
    }

    /// @dev Sets the IPFS CID of the W3C Status List (bitstring)
    function setStatusListCID(string calldata newCID) external onlyTrustedIssuer {
        statusListCID = newCID;
        emit StatusListCIDUpdated(newCID, block.timestamp);
    }
    function getStatusListCID() external view returns (string memory) {
        return statusListCID;
    }

    /// @dev Sets the IPFS CID of the list of revoked VC hashes
    function setRevokedListCID(string calldata newCID) external onlyTrustedIssuer {
        revokedListCID = newCID;
        emit RevokedListCIDUpdated(newCID, block.timestamp);
    }

    /// @dev Returns the IPFS CID of the revoked list
    function getRevokedListCID() external view returns (string memory) {
        return revokedListCID;
    }
}