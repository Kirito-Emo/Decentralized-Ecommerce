// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

contract ReviewStorage {
    struct ReviewVersion {
        string ipfsCID;
        uint256 timestamp; // Timestamp rounded to day to prevent correlation
    }

    struct Review {
        string authorDID;
        bool revoked;
        ReviewVersion[] history;
    }

    uint256 public nextReviewId;
    mapping(uint256 => Review) public reviews;
    mapping(address => uint256[]) public reviewsByAuthorDID;

    event ReviewStored(uint256 indexed reviewId, string indexed authorDID, string ipfsCID);
    event ReviewUpdated(uint256 indexed reviewId, string newCID);
    event ReviewRevoked(uint256 indexed reviewId);

    /// @dev Store a new review and return its unique ID
    function storeReview(string memory authorDID, string memory ipfsCID) external returns (uint256) {
        uint256 reviewId = nextReviewId++;
        reviews[reviewId].authorDID = authorDID;
        reviews[reviewId].revoked = false;
        reviews[reviewId].history.push(ReviewVersion(ipfsCID, (block.timestamp - (block.timestamp % 1 days))));
        reviewsByAuthorDID[authorDID].push(reviewId);

        emit ReviewStored(reviewId, authorDID, ipfsCID);
        return reviewId;
    }

    /// @dev Update the IPFS CID for an existing review
    function updateReview(uint256 reviewId, string memory newCID, string memory did) external {
        require(_compareDID(reviews[reviewId].authorDID, did), "Not the author");
        require(!reviews[reviewId].revoked, "Review is revoked");

        reviews[reviewId].history.push(ReviewVersion(newCID, (block.timestamp - (block.timestamp % 1 days))));
        emit ReviewUpdated(reviewId, newCID);
    }

    /// @dev Revoke a review permanently
    function revokeReview(uint256 reviewId, string memory did) external {
        require(_compareDID(reviews[reviewId].authorDID, did), "Not the author");
        require(!reviews[reviewId].revoked, "Already revoked");

        reviews[reviewId].revoked = true;
        reviews[reviewId].history.push(ReviewVersion("REVOKED", (block.timestamp - (block.timestamp % 1 days))));
        emit ReviewRevoked(reviewId);
    }

    /// @dev Get the latest version of a review
    function getLatestReview(uint256 reviewId) external view returns (string memory cid, bool isRevoked, uint256 lastUpdate) {
        require(reviews[reviewId].history.length > 0, "Not found");

        ReviewVersion storage v = reviews[reviewId].history[reviews[reviewId].history.length - 1];
        return (v.ipfsCID, reviews[reviewId].revoked, v.timestamp);
    }

    /// @dev Get the full history of a review
    function getHistory(uint256 reviewId) external view returns (ReviewVersion[] memory) {
        return reviews[reviewId].history;
    }

    /// @dev Check if a given user is the author of a review
    function isOwner(string memory did, uint256 reviewId) external view returns (bool) {
        return _compareDID(reviews[reviewId].authorDID, did);
    }

    /// @dev Get all review IDs submitted by an author
    function getReviewsByAuthor(string memory authorDID) external view returns (uint256[] memory) {
        return reviewsByAuthorDID[authorDID];
    }

    /// @dev Safe string comparison (per DID W3C)
    function _compareDID(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(bytes(a)) == keccak256(bytes(b)));
    }
}