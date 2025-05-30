// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

contract ReviewStorage {
    struct ReviewVersion {
        string ipfsCID;
        uint256 timestamp; // Timestamp rounded to day to prevent correlation
    }

    struct Review {
        address author;
        bool revoked;
        ReviewVersion[] history;
    }

    uint256 public nextReviewId;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256[]) private reviewsByAuthor;

    event ReviewStored(uint256 indexed reviewId, address indexed author, string ipfsCID);
    event ReviewUpdated(uint256 indexed reviewId, string newCID);
    event ReviewRevoked(uint256 indexed reviewId);

    /// @notice Store a new review and return its unique ID
    function storeReview(address author, string memory ipfsCID) external returns (uint256) {
        uint256 reviewId = nextReviewId++;
        reviews[reviewId].author = author;
        reviews[reviewId].revoked = false;
        reviews[reviewId].history.push(ReviewVersion(ipfsCID, (block.timestamp - (block.timestamp % 1 days))));
        reviewsByAuthor[author].push(reviewId);

        emit ReviewStored(reviewId, author, ipfsCID);
        return reviewId;
    }

    /// @notice Update the IPFS CID for an existing review
    function updateReview(uint256 reviewId, string memory newCID) external {
        require(msg.sender == reviews[reviewId].author, "Not the author");
        require(!reviews[reviewId].revoked, "Review is revoked");

        reviews[reviewId].history.push(ReviewVersion(newCID, (block.timestamp - (block.timestamp % 1 days))));
        emit ReviewUpdated(reviewId, newCID);
    }

    /// @notice Revoke a review permanently
    function revokeReview(uint256 reviewId) external {
        require(msg.sender == reviews[reviewId].author, "Not the author");
        require(!reviews[reviewId].revoked, "Already revoked");

        reviews[reviewId].revoked = true;
        reviews[reviewId].history.push(ReviewVersion("REVOKED", (block.timestamp - (block.timestamp % 1 days))));
        emit ReviewRevoked(reviewId);
    }

    /// @notice Get the latest version of a review
    function getLatestReview(uint256 reviewId) external view returns (string memory cid, bool isRevoked, uint256 lastUpdate) {
        require(reviews[reviewId].history.length > 0, "Not found");

        ReviewVersion storage v = reviews[reviewId].history[reviews[reviewId].history.length - 1];
        return (v.ipfsCID, reviews[reviewId].revoked, v.timestamp);
    }

    /// @notice Get the full history of a review
    function getHistory(uint256 reviewId) external view returns (ReviewVersion[] memory) {
        return reviews[reviewId].history;
    }

    /// @notice Check if a given user is the author of a review
    function isOwner(address user, uint256 reviewId) external view returns (bool) {
        return reviews[reviewId].author == user;
    }

    /// @notice Get all review IDs submitted by an author
    function getReviewsByAuthor(address author) external view returns (uint256[] memory) {
        return reviewsByAuthor[author];
    }
}