// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadgeNFT is ERC721URIStorage, Ownable {
    enum BadgeLevel { None, Bronze, Silver, Gold }

    mapping(string => BadgeLevel) public badgeLevel;
    mapping(string => uint256) public lastUpdate;
    mapping(string => uint256) public reputation;
    mapping(string => uint256) public didToTokenId; // DID → tokenId

    uint256 private _tokenIds;

    /// @dev Event emitted when a badge is minted or upgraded
    event BadgeMinted(string indexed did, BadgeLevel level);
    event BadgeUpgraded(string indexed did, BadgeLevel newLevel);

    constructor() ERC721("ReviewerBadge", "RBDG") {}

    /// @dev Function to update reputation for a DID
    function updateReputation(string memory did, int delta) external onlyOwner {
        if (delta >= 0) {
            reputation[did] += uint(delta);
        } else {
            uint d = uint(-delta);
            if (d > reputation[did]) {
                reputation[did] = 0;
            } else {
                reputation[did] -= d;
            }
        }

        _updateBadge(did);
    }

    /// @dev Function to get the badge level of a DID
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

    /// @dev Function to mint a badge for DID
    function _mintBadge(string memory did, BadgeLevel level) internal {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _uriForLevel(level));
        badgeLevel[did] = level;
        didToTokenId[did] = newTokenId;

        emit BadgeMinted(did, level);
    }

    /// @dev Functions to upgrade a user's badge
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

    /// @dev Get DID reputation
    function getReputation(string memory did) external view returns (uint256) {
        return reputation[did];
    }

    /// @dev Get tokenId for a given DID
    function getTokenIdForDID(string memory did) external view returns (uint256) {
        return didToTokenId[did];
    }

    /// @dev Function to calculate the badge level based on reputation
    function _calculateBadgeLevel(uint rep) internal pure returns (BadgeLevel) {
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
    function _transfer(address from, address to, uint256 tokenId) internal pure override {
        revert("Soulbound: non-transferable");
    }

    /// @dev Override approval functions to prevent approvals (soulbound)
    function approve(address to, uint256 tokenId) public pure override {
        revert("Soulbound: non-transferable");
    }

    /// @dev Override setApprovalForAll to prevent approvals (soulbound)
    function setApprovalForAll(address operator, bool approved) public pure override {
        revert("Soulbound: non-transferable");
    }
}