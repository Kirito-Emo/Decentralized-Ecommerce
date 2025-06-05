// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

/// @title DID Registry with Owner and Delegate Management, Anti-Replay and Auditable Features
contract DIDRegistry {
    /// @dev Maps each identity (address) to its current owner (address)
    mapping(address => address) public owners;

    /// @dev Maps (identity, delegateType, delegate) to validity timestamp (delegation expiry)
    mapping(address => mapping(bytes32 => mapping(address => uint))) public delegates;

    /// @dev Records the last block number when an identity changed
    mapping(address => uint) public changed;

    /// @dev Nonce per identity, incremented for each signed action, used to prevent replay attacks
    mapping(address => uint) public nonce;

    /// @dev Restricts function execution to the current owner of the identity.
    modifier onlyOwner(address identity, address actor) {
        require (actor == identityOwner(identity), "Bad Actor");
        _;
    }

    /// @dev Emitted when the owner of an identity changes
    event DIDOwnerChanged(
        address indexed identity,
        address owner,
        uint previousChange
    );

    /// @dev Emitted when a delegate is added, updated or revoked for an identity
    event DIDDelegateChanged(
        address indexed identity,
        bytes32 delegateType,
        address delegate,
        uint validTo,
        uint previousChange
    );

    /// @dev Returns the owner of a given identity
    function identityOwner(address identity) public view returns(address) {
        address owner = owners[identity];
        if (owner != address(0x00)) {
            return owner;
        }
        return identity;
    }

    /// @dev Checks if a signature matches the identity owner and updates nonce
    function checkSignature(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 hash) internal returns(address) {
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == identityOwner(identity), "Bad Signature");
        nonce[signer]++;
        return signer;
    }

    /// @dev Checks if a delegate is currently valid for the given identity and type
    function validDelegate(address identity, bytes32 delegateType, address delegate) public view returns(bool) {
        uint validity = delegates[identity][keccak256(abi.encode(delegateType))][delegate];
        return (validity > block.timestamp);
    }

    /// @dev Changes the owner of the identity
    function changeOwner(address identity, address actor, address newOwner) internal onlyOwner(identity, actor) {
        owners[identity] = newOwner;
        emit DIDOwnerChanged(identity, newOwner, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Changes the owner of the identity, callable directly by the current owner
    function changeOwner(address identity, address newOwner) public {
        changeOwner(identity, msg.sender, newOwner);
    }

    /// @dev Changes the owner using an off-chain signature
    function changeOwnerSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, address newOwner) public {
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0x19), bytes1(0), this, nonce[identityOwner(identity)], identity, "changeOwner", newOwner
        ));
        changeOwner(identity, checkSignature(identity, sigV, sigR, sigS, hash), newOwner);
    }

    /// @dev Adds or updates a delegate for the identity
    function addDelegate(address identity, address actor, bytes32 delegateType, address delegate, uint validity) internal onlyOwner(identity, actor) {
        delegates[identity][keccak256(abi.encode(delegateType))][delegate] = block.timestamp + validity;
        emit DIDDelegateChanged(identity, delegateType, delegate, block.timestamp + validity, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Adds or updates a delegate, callable directly by the current owner
    function addDelegate(address identity, bytes32 delegateType, address delegate, uint validity) public {
        addDelegate(identity, msg.sender, delegateType, delegate, validity);
    }

    /// @dev Adds or updates a delegate via off-chain signature
    function addDelegateSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 delegateType, address delegate, uint validity) public {
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0x19), bytes1(0), this, nonce[identityOwner(identity)], identity, "addDelegate", delegateType, delegate, validity
        ));
        addDelegate(identity, checkSignature(identity, sigV, sigR, sigS, hash), delegateType, delegate, validity);
    }

    /// @dev Revokes a delegate before expiry
    function revokeDelegate(address identity, address actor, bytes32 delegateType, address delegate) internal onlyOwner(identity, actor) {
        delegates[identity][keccak256(abi.encode(delegateType))][delegate] = block.timestamp;
        emit DIDDelegateChanged(identity, delegateType, delegate, block.timestamp, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Revokes a delegate, callable directly by the current owner
    function revokeDelegate(address identity, bytes32 delegateType, address delegate) public {
        revokeDelegate(identity, msg.sender, delegateType, delegate);
    }

    /// @dev Revokes a delegate via off-chain signature
    function revokeDelegateSigned(address identity, uint8 sigV, bytes32 sigR, bytes32 sigS, bytes32 delegateType, address delegate) public {
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0x19), bytes1(0), this, nonce[identityOwner(identity)], identity, "revokeDelegate", delegateType, delegate
        ));
        revokeDelegate(identity, checkSignature(identity, sigV, sigR, sigS, hash), delegateType, delegate);
    }
}