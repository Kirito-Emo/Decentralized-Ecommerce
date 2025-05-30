// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReviewNFT is ERC721URIStorage, Ownable {
    enum Status { Valid, Used, Expired }

    struct ReviewToken {
        uint256 productId;
        uint256 mintTimestamp;
        Status status;
    }

    uint256 public constant EXPIRATION_TIME = 60 days;
    uint256 private _tokenIds;

    mapping(uint256 => ReviewToken) public reviewTokens;

    event NFTMinted(address indexed user, uint256 indexed tokenId, uint256 productId);
    event NFTUsed(uint256 indexed tokenId);
    event NFTExpired(uint256 indexed tokenId);

    constructor() ERC721("ProofOfPurchaseNFT", "POP") {}

    function mintNFT(address to, uint256 productId, string memory tokenURI) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        reviewTokens[newTokenId] = ReviewToken({
            productId: productId,
            mintTimestamp: block.timestamp,
            status: Status.Valid
        });

        emit NFTMinted(to, newTokenId, productId);
        return newTokenId;
    }

    function useNFT(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not owner nor approved");
        require(reviewTokens[tokenId].status == Status.Valid, "NFT not valid");
        require(!_isExpired(tokenId), "NFT expired");

        reviewTokens[tokenId].status = Status.Used;
        emit NFTUsed(tokenId);
    }

    // This function should be triggered regularly by an off-chain scheduler to mark expired NFTs
    function expireNFTs(uint256[] calldata tokenIds) external {
        for (uint i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (reviewTokens[tokenId].status == Status.Valid && _isExpired(tokenId)) {
                reviewTokens[tokenId].status = Status.Expired;
                emit NFTExpired(tokenId);
            }
        }
    }

    function getNFTStatus(uint256 tokenId) external view returns (Status) {
        return reviewTokens[tokenId].status;
    }

    function isValidForReview(uint256 tokenId) external view returns (bool) {
        return reviewTokens[tokenId].status == Status.Valid && !_isExpired(tokenId);
    }

    function _isExpired(uint256 tokenId) internal view returns (bool) {
        return block.timestamp > reviewTokens[tokenId].mintTimestamp + EXPIRATION_TIME;
    }

    // Override transfer to prevent transfers (soulbound)
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}