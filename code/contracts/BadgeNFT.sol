// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BanRegistry.sol";

/**
 * @title BadgeNFT
 * @dev Soulbound NFT system for DID-based reputation and badge assignment.
 *      Returns ABI-safe uint8 for enums (BadgeLevel).
 */
contract BadgeNFT is ERC721URIStorage, AccessControl {
    enum BadgeLevel { None, Bronze, Silver, Gold }

    /// @dev BanRegistry instance to check if a DID is banned
    BanRegistry public banRegistry;

    mapping(string => BadgeLevel) private badgeLevel;
    mapping(string => uint256) public lastUpdate;
    mapping(string => uint256) public reputation;
    mapping(string => uint256) public didToTokenId; // DID → tokenId

    uint256 private _tokenIds;
    bytes32 public constant REPUTATION_UPDATER_ROLE = keccak256("REPUTATION_UPDATER_ROLE");

    /// @dev Event emitted when a badge is minted or upgraded
    event BadgeMinted(string indexed did, BadgeLevel level);
    event BadgeUpgraded(string indexed did, BadgeLevel newLevel);

    /// @dev Constructor to initialize the contract and set roles
    constructor(address _banRegistry) ERC721("ReviewerBadge", "RBDG") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REPUTATION_UPDATER_ROLE, msg.sender);
        banRegistry = BanRegistry(_banRegistry);
    }

    /// @dev Modifier to check if a DID is not banned
    modifier notBanned(string memory did) {
        require(!banRegistry.isBanned(did), "DID is banned");
        _;
    }

    /// @dev Update reputation for a DID
    function updateReputation(string memory did, int256 delta) external onlyRole(REPUTATION_UPDATER_ROLE) notBanned(did) {
        if (delta >= 0) {
            reputation[did] += uint256(delta);
        } else {
            uint256 d = uint256(-delta);
            if (d > reputation[did]) {
                reputation[did] = 0;
            } else {
                reputation[did] -= d;
            }
        }
        _updateBadge(did);
    }

    /// @dev Internal function to update the badge for a DID
    function _updateBadge(string memory did) internal {
        BadgeLevel current = badgeLevel[did];
        BadgeLevel newLevel = _calculateBadgeLevel(reputation[did]);

        if (newLevel > current) {
            if (current == BadgeLevel.None) {
                _mintBadge(did, newLevel);
            } else {
                badgeLevel[did] = newLevel;
                emit BadgeUpgraded(did, newLevel);
            }
        }
    }

    /// @dev Internal function to mint a badge NFT for a DID
    function _mintBadge(string memory did, BadgeLevel level) internal {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _uriForLevel(level));
        badgeLevel[did] = level;
        didToTokenId[did] = newTokenId;

        emit BadgeMinted(did, level);
    }

    /// @dev Returns the URI for a badge level
    function _uriForLevel(BadgeLevel level) internal pure returns (string memory) {
        if (level == BadgeLevel.Bronze) return "ipfs://badge_bronze.json";
        if (level == BadgeLevel.Silver) return "ipfs://badge_silver.json";
        if (level == BadgeLevel.Gold) return "ipfs://badge_gold.json";
        return "";
    }

    /// @dev Function to get the badge level of a user
    function getUserBadge(string memory did) external view returns (BadgeLevel) {
        return badgeLevel[did];
    }

    /// @dev Returns the reputation value for a DID
    function getReputation(string memory did) external view returns (uint256) {
        return reputation[did];
    }

    /// @dev Returns the tokenId for a given DID
    function getTokenIdForDID(string memory did) external view returns (uint256) {
        return didToTokenId[did];
    }

    /// @dev Returns the last update timestamp for a DID
    function getLastUpdate(string memory did) external view returns (uint256) {
        return lastUpdate[did];
    }

    /// @dev Pure function to determine badge level from reputation
    function _calculateBadgeLevel(uint256 rep) internal pure returns (BadgeLevel) {
        if (rep >= 50) return BadgeLevel.Gold;
        if (rep >= 10) return BadgeLevel.Silver;
        if (rep >= 1) return BadgeLevel.Bronze;
        return BadgeLevel.None;
    }

    /// @dev Override the _beforeTokenTransfer function to prevent transfers
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /// @dev Override transfer functions to prevent transfers (soulbound)
    function _transfer(address /*from*/, address /*to*/, uint256 /*tokenId*/) internal pure override {
        revert("Soulbound: non-transferable");
    }

    /// @dev Override approval functions to prevent approvals (soulbound)
    function approve(address /*to*/, uint256 /*tokenId*/) public pure override(ERC721, IERC721) {
        revert("Soulbound: non-transferable");
    }

    /// @dev Override setApprovalForAll to prevent approvals (soulbound)
    function setApprovalForAll(address /*operator*/, bool /*approved*/) public pure override(ERC721, IERC721) {
        revert("Soulbound: non-transferable");
    }

    /// @dev Override supportsInterface to include both ERC721URIStorage and AccessControl interfaces
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}