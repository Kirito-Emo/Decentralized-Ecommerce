// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReviewNFT is ERC721URIStorage, Ownable {
    enum Status { Valid, Used, Expired }

    struct Metadata {
        Status state;
        uint256 issuedAt;
    }

    uint256 public tokenCounter;
    mapping(uint256 => Metadata) public metadata;

    constructor() ERC721("ReviewAccessNFT", "RVNFT") {
        tokenCounter = 1;
    }

    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        metadata[tokenId] = Metadata(Status.Valid, block.timestamp);
        return tokenId;
    }

    function markUsed(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        metadata[tokenId].state = Status.Used;
    }

    function expire(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        metadata[tokenId].state = Status.Expired;
    }

    function isValid(uint256 tokenId) external view returns (bool) {
        return metadata[tokenId].state == Status.Valid;
    }
}