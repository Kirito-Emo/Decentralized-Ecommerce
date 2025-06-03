// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

import "./ReviewNFT.sol";
import "./BadgeNFT.sol";
import "./ReviewStorage.sol";
import "./VCRegistry.sol";
import "./VPVerifier.sol";
import "./BBSVerifier.sol";
import "./SemaphoreVerifier.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReviewManager is AccessControl {
    ReviewNFT public reviewNFT;
    BadgeNFT public badgeNFT;
    ReviewStorage public reviewStorage;
    VCRegistry public vcRegistry;
    VPVerifier public vpVerifier;
    BBSVerifier public bbsVerifier;
    SemaphoreVerifier public semaphoreVerifier;

    uint256 public cooldownTime = 1 days;

    mapping(string => bool) public isBanned;
    mapping(uint256 => uint256) public lastEdit;
    mapping(string => uint256) public reputation;

    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    event ReviewSubmitted(string indexed did, uint256 indexed tokenId, uint256 reviewId);
    event ReviewEdited(uint256 indexed reviewId, string newCID);
    event ReviewRevoked(uint256 indexed reviewId);
    event UserBanned(string indexed did);

    constructor(
        address _reviewNFT,
        address _badgeNFT,
        address _reviewStorage,
        address _vcRegistry,
        address _vpVerifier,
        address _bbsVerifier,
        address _semaphoreVerifier
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MODERATOR_ROLE, msg.sender);

        reviewNFT = ReviewNFT(_reviewNFT);
        badgeNFT = BadgeNFT(_badgeNFT);
        reviewStorage = ReviewStorage(_reviewStorage);
        vcRegistry = VCRegistry(_vcRegistry);
        vpVerifier = VPVerifier(_vpVerifier);
        bbsVerifier = BBSVerifier(_bbsVerifier);
        semaphoreVerifier = SemaphoreVerifier(_semaphoreVerifier);
    }

    /// @dev Modifier to check if the DID is not banned
    modifier notBanned(string memory did) {
        require(!isBanned[did], "DID banned");
        _;
    }

    /// @dev Function to submit a review
    function submitReview(string memory did, uint256 tokenId, string memory ipfsCID) external notBanned(did) {
        require(_isTokenOwnedByDID(tokenId, did), "Not owner of NFT");
        require(reviewNFT.isValidForReview(tokenId), "NFT not eligible for review");

        reviewNFT.useNFT(tokenId, did);
        uint256 reviewId = reviewStorage.storeReview(did, ipfsCID);

        reputation[did]++;
        badgeNFT.updateReputation(did, 1);

        emit ReviewSubmitted(did, tokenId, reviewId);
    }

    /// @dev Function to edit a review
    function editReview(string memory did, uint256 reviewId, string memory newCID) external notBanned(did) {
        require(reviewStorage.isOwner(msg.sender, reviewId), "Not owner of review");
        require(block.timestamp >= lastEdit[reviewId] + cooldownTime, "Cooldown in progress");

        reviewStorage.updateReview(reviewId, newCID, did);
        lastEdit[reviewId] = block.timestamp;

        emit ReviewEdited(reviewId, newCID);
    }

    /// @dev Function to revoke a review
    function revokeReview(string memory did, uint256 reviewId) external notBanned(did) {
        require(reviewStorage.isOwner(msg.sender, reviewId), "Not owner of review");
        reviewStorage.revokeReview(reviewId, did);
        emit ReviewRevoked(reviewId);
    }

    /// @dev Function to get the reputation of a DID
    function getReputation(string memory did) external view returns (uint256) {
        return reputation[did];
    }

    /// @dev Function to ban a DID
    function banUser(string memory did) external onlyRole(MODERATOR_ROLE) {
        isBanned[did] = true;
        emit UserBanned(did);
    }

    /// @dev Function to verify VP or BBS ZKP proofs
    function verifyZKP(bytes calldata proof, bytes32[] calldata publicSignals, string memory protocol) external view returns (bool) {
        if (keccak256(abi.encodePacked(protocol)) == keccak256("vp")) {
            return vpVerifier.verifyProof(proof, publicSignals);
        } else if (keccak256(abi.encodePacked(protocol)) == keccak256("bbs")) {
            return bbsVerifier.verifyProof(proof, publicSignals);
        } else {
            revert("ZKP protocol not supported");
        }
    }

    /// @dev Function to verify Semaphore ZKP proofs
    function verifySemaphoreProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[4] calldata _publicSignals,
        uint merkleTreeDepth
    ) external view returns (bool) {
        return semaphoreVerifier.verifyProof(_pA, _pB, _pC, _publicSignals, merkleTreeDepth);
    }

    /// @dev Internal function to check if the token is owned by the DID
    function _isTokenOwnedByDID(uint256 tokenId, string memory did) internal view returns (bool) {
        return (keccak256(bytes(reviewNFT.ownerDIDOf(tokenId))) == keccak256(bytes(did)));
    }
}