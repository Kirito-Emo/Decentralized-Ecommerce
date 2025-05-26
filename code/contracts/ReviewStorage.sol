// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi

pragma solidity ^0.8.20;

interface IReviewNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract ReviewStorage {
    struct Review {
        address reviewer;
        string shopDID;
        string ipfsCid;
        bytes32 contentHash;
        uint256 timestamp;
    }

    address public nftContract;
    mapping(uint256 => bool) public isConsumed;
    Review[] private reviews;

    event ReviewSubmitted(
        address indexed reviewer,
        uint256 indexed nftId,
        string shopDID,
        string ipfsCid,
        bytes32 contentHash,
        uint256 timestamp
    );

    constructor(address _nftContract) {
        nftContract = _nftContract;
    }

    function submitReview(
        uint256 nftId,
        string calldata shopDID,
        string calldata ipfsCid,
        bytes32 contentHash
    ) external {
        require(!isConsumed[nftId], "NFT already used");
        require(
            IReviewNFT(nftContract).ownerOf(nftId) == msg.sender,
            "Not the NFT owner"
        );

        isConsumed[nftId] = true;
        reviews.push(Review(msg.sender, shopDID, ipfsCid, contentHash, block.timestamp));

        emit ReviewSubmitted(
            msg.sender,
            nftId,
            shopDID,
            ipfsCid,
            contentHash,
            block.timestamp
        );
    }

    function getAllReviews() public view returns (string[] memory) {
        string[] memory cids = new string[](reviews.length);
        for (uint256 i = 0; i < reviews.length; i++) {
            cids[i] = reviews[i].ipfsCid;
        }
        return cids;
    }

    function getReview(uint256 index) public view returns (
        address,
        string memory,
        string memory,
        bytes32,
        uint256
    ) {
        require(index < reviews.length, "Index out of bounds");
        Review memory r = reviews[index];
        return (r.reviewer, r.shopDID, r.ipfsCid, r.contentHash, r.timestamp);
    }

    function getReviewCount() public view returns (uint256) {
        return reviews.length;
    }
}