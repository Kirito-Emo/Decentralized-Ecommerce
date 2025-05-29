// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

import "./ReviewNFT.sol";
import "./BadgeNFT.sol";
import "./ReviewStorage.sol";
import "./VCRegistry.sol";
import "./VPVerifier.sol";
import "./BBS+Verifier.sol";
import "./SemaphoreVerifier.sol";

contract ReviewManager {
    ReviewNFT public reviewNFT;
    BadgeNFT public badgeNFT;
    ReviewStorage public reviewStorage;
    VCRegistry public vcRegistry;
    VPVerifier public vpVerifier;
    BBSPlusVerifier public bbsVerifier;
    SemaphoreVerifier public semaphoreVerifier;

    uint256 public cooldownTime = 1 days;

    mapping(address => bool) public isBanned;
    mapping(uint256 => uint256) public lastEdit;
    mapping(address => uint256) public reputation;

    event ReviewSubmitted(address indexed user, uint256 indexed tokenId, uint256 reviewId);
    event ReviewEdited(uint256 indexed reviewId, string newCID);
    event ReviewRevoked(uint256 indexed reviewId);
    event UserBanned(address indexed user);

    constructor(
        address _reviewNFT,
        address _badgeNFT,
        address _reviewStorage,
        address _vcRegistry,
        address _vpVerifier,
        address _bbsVerifier,
        address _semaphoreVerifier
    ) {
        reviewNFT = ReviewNFT(_reviewNFT);
        badgeNFT = BadgeNFT(_badgeNFT);
        reviewStorage = ReviewStorage(_reviewStorage);
        vcRegistry = VCRegistry(_vcRegistry);
        vpVerifier = VPVerifier(_vpVerifier);
        bbsVerifier = BBSPlusVerifier(_bbsVerifier);
        semaphoreVerifier = SemaphoreVerifier(_semaphoreVerifier);
    }

    modifier notBanned() {
        require(!isBanned[msg.sender], "User banned");
        _;
    }

    function submitReview(uint256 tokenId, string memory ipfsCID) external notBanned {
        require(reviewNFT.ownerOf(tokenId) == msg.sender, "Not owner of NFT");
        require(reviewNFT.isValidForReview(tokenId), "NFT not eligible for review");

        reviewNFT.useNFT(tokenId);
        uint256 reviewId = reviewStorage.storeReview(msg.sender, ipfsCID);

        reputation[msg.sender]++;
        badgeNFT.updateReputation(msg.sender, 1);

        emit ReviewSubmitted(msg.sender, tokenId, reviewId);
    }

    function editReview(uint256 reviewId, string memory newCID) external notBanned {
        require(reviewStorage.isOwner(msg.sender, reviewId), "Not owner of review");
        require(block.timestamp >= lastEdit[reviewId] + cooldownTime, "Cooldown in progress");

        reviewStorage.updateReview(reviewId, newCID);
        lastEdit[reviewId] = block.timestamp;

        emit ReviewEdited(reviewId, newCID);
    }

    function revokeReview(uint256 reviewId) external notBanned {
        require(reviewStorage.isOwner(msg.sender, reviewId), "Not owner of review");
        reviewStorage.revokeReview(reviewId);
        emit ReviewRevoked(reviewId);
    }

    function getReputation(address user) external view returns (uint256) {
        return reputation[user];
    }

    function banUser(address user) external {
        isBanned[user] = true;
        emit UserBanned(user);
    }

    function verifyZKP(bytes calldata proof, bytes32[] calldata publicSignals, string memory protocol) external view returns (bool) {
        if (keccak256(abi.encodePacked(protocol)) == keccak256("vp")) {
            return vpVerifier.verifyProof(proof, publicSignals);
        } else if (keccak256(abi.encodePacked(protocol)) == keccak256("bbs")) {
            return bbsVerifier.verifyProof(proof, publicSignals);
        } else if (keccak256(abi.encodePacked(protocol)) == keccak256("semaphore")) {
            return semaphoreVerifier.verifyProof(proof, publicSignals);
        } else {
            revert("ZKP protocol not supported");
        }
    }
}