// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadgeNFT is ERC721URIStorage, Ownable {
    enum BadgeLevel { None, Bronze, Silver, Gold }

    mapping(address => BadgeLevel) public badgeLevel;
    mapping(address => uint256) public lastUpdate;
    mapping(address => uint256) public reputation; // numReviews - penalties

    uint256 private _tokenIds;

    event BadgeMinted(address indexed user, BadgeLevel level);          // Emitted when a badge is minted
    event BadgeUpgraded(address indexed user, BadgeLevel newLevel);     // Emitted when a badge is upgraded

    constructor() ERC721("ReviewerBadge", "RBDG") {}                    // Initializes the contract with the name and symbol

    // Function to update reputation
    function updateReputation(address user, int delta) external onlyOwner {
        if (delta >= 0) {
            reputation[user] += uint(delta);
        } else {
            uint d = uint(-delta);
            if (d > reputation[user]) {
                reputation[user] = 0;
            } else {
                reputation[user] -= d;
            }
        }

        _updateBadge(user);
    }

    // Function to get the badge level of a user
    function _updateBadge(address user) internal {
        BadgeLevel current = badgeLevel[user];
        BadgeLevel newLevel = _calculateBadgeLevel(reputation[user]);

        if (newLevel > current) {
            if (current == BadgeLevel.None) {
                _mintBadge(user, newLevel);
            } else {
                badgeLevel[user] = newLevel;
                emit BadgeUpgraded(user, newLevel);
            }
        }
    }

    // Function to mint a badge for a user
    function _mintBadge(address to, BadgeLevel level) internal {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(to, newTokenId);
        _setTokenURI(newTokenId, _uriForLevel(level));
        badgeLevel[to] = level;

        emit BadgeMinted(to, level);
    }

    // Functions to upgrade a user's badge
    function _uriForLevel(BadgeLevel level) internal pure returns (string memory) {
        if (level == BadgeLevel.Bronze) return "ipfs://badge_bronze.json";
        if (level == BadgeLevel.Silver) return "ipfs://badge_silver.json";
        if (level == BadgeLevel.Gold) return "ipfs://badge_gold.json";
        return "";
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function getUserBadge(address user) external view returns (BadgeLevel) {
        return badgeLevel[user];
    }

    function _calculateBadgeLevel(uint rep) internal pure returns (BadgeLevel) {
        if (rep >= 50) return BadgeLevel.Gold;
        if (rep >= 10) return BadgeLevel.Silver;
        if (rep >= 1) return BadgeLevel.Bronze;
        return BadgeLevel.None;
    }
}