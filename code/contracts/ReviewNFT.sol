// SPDX-License-Identifier: Apache-2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BanRegistry.sol";

contract ReviewNFT is ERC721URIStorage, AccessControl {
    enum Status { Valid, Used, Expired }

    /// @dev BanRegistry instance to check if a DID is banned
    BanRegistry public banRegistry;

    struct ReviewToken {
        string did;
        uint256 productId;
        uint256 mintTimestamp;
        Status status;
    }

    uint256 public constant EXPIRATION_TIME = 60 days;
    uint256 private _tokenIds;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Mapping from token ID to ReviewToken
    mapping(uint256 => ReviewToken) public reviewTokens;

    /// @dev Mapping from DID to array of token IDs
    mapping(string => uint256[]) public didToTokenIds;

    event NFTMinted(string indexed did, uint256 indexed tokenId, uint256 productId);
    event NFTUsed(uint256 indexed tokenId, string indexed did);
    event NFTExpired(uint256 indexed tokenId, string indexed did);

    /// @dev Constructor to initialize the contract and set roles and ban registry
    constructor(address _banRegistry) ERC721("ProofOfPurchaseNFT", "PoP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        banRegistry = BanRegistry(_banRegistry);
    }

    /// @dev Modifier to check if a DID is not banned
    modifier notBanned(string memory did) {
        require(!banRegistry.isBanned(did), "DID is banned");
        _;
    }

    /// @dev Function to mint a new NFT
    function mintNFT(string memory did, uint256 productId, string memory tokenURI) external onlyRole(MINTER_ROLE) notBanned(did) returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        reviewTokens[newTokenId] = ReviewToken({
            did: did,
            productId: productId,
            mintTimestamp: block.timestamp,
            status: Status.Valid
        });
        didToTokenIds[did].push(newTokenId);

        emit NFTMinted(did, newTokenId, productId);
        return newTokenId;
    }

    /// @dev Function to use the NFT, marking it as used
    function useNFT(uint256 tokenId, string memory did) external notBanned(did) {
        require(_isTokenOwnedByDID(tokenId, did), "Not NFT owner");
        require(reviewTokens[tokenId].status == Status.Valid, "NFT not valid");
        require(!_isExpired(tokenId), "NFT expired");

        reviewTokens[tokenId].status = Status.Used;
        emit NFTUsed(tokenId, did);
    }

    /// @dev Function to check if an NFT is valid for review
    // This function should be triggered regularly by an off-chain scheduler to mark expired NFTs
    function expireNFTs(uint256[] calldata tokenIds) external {
        for (uint i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (reviewTokens[tokenId].status == Status.Valid && _isExpired(tokenId)) {
                reviewTokens[tokenId].status = Status.Expired;
                emit NFTExpired(tokenId, reviewTokens[tokenId].did);
            }
        }
    }

    /// @dev Function to get the status of an NFT
    function getNFTStatus(uint256 tokenId) external view returns (Status) {
        return reviewTokens[tokenId].status;
    }

    /// @dev Function to check if an NFT is valid for review
    function isValidForReview(uint256 tokenId) external view returns (bool) {
        return reviewTokens[tokenId].status == Status.Valid && !_isExpired(tokenId);
    }

    /// @dev Function to get all tokens owned by a specific DID
    function getTokensOfDID(string memory did) external view returns (uint256[] memory) {
        return didToTokenIds[did];
    }

    /// @dev Function to get the DID owner of a specific token
    function ownerDIDOf(uint256 tokenId) public view returns (string memory) {
        return reviewTokens[tokenId].did;
    }

    /// @dev Function to check if a token is owned by a specific DID
    function _isTokenOwnedByDID(uint256 tokenId, string memory did) internal view returns (bool) {
        return keccak256(bytes(reviewTokens[tokenId].did)) == keccak256(bytes(did));
    }

    /// @dev Function to check if an NFT is expired
    function _isExpired(uint256 tokenId) internal view returns (bool) {
        return block.timestamp > reviewTokens[tokenId].mintTimestamp + EXPIRATION_TIME;
    }

    /// @dev Override transfer to prevent transfers (soulbound)
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