// SPDX-License-Identifier: Apache 2.0
// Copyright 2025 Emanuele Relmi
pragma solidity ^0.8.25;

/// @title DID Registry with owner/delegate management and anti-replay protection
contract DIDRegistry {
    /// @dev Maps each identity (address) to its current owner (address)
    mapping(address => address) public owners;

    /// @dev Maps (identity, delegateType hash, delegate) to validity timestamp (expiry)
    mapping(address => mapping(bytes32 => mapping(address => uint256))) public delegates;

    /// @dev Records the last block number when an identity changed
    mapping(address => uint256) public changed;

    /// @dev Nonce per identity, incremented for each signed action, used to prevent replay attacks
    mapping(address => uint256) public nonce;

    /// @dev Restricts function execution to the current owner of the identity
    modifier onlyOwner(address identity) {
        require(msg.sender == identityOwner(identity), "Not identity owner");
        _;
    }

    /// @dev Emitted when the owner of an identity changes
    event DIDOwnerChanged(
        address indexed identity,
        address owner,
        uint256 previousChange
    );

    /// @dev Emitted when a delegate is added, updated, or revoked for an identity
    event DIDDelegateChanged(
        address indexed identity,
        bytes32 delegateType,
        address delegate,
        uint256 validTo,
        uint256 previousChange
    );

    /// @dev Returns the current owner of an identity. If owners[identity] is zero, identity owns itself.
    function identityOwner(address identity) public view returns (address) {
        address owner = owners[identity];
        if (owner != address(0x00)) {
            return owner;
        }
        return identity;
    }

    /// @dev Checks if a delegate is currently valid for the given identity and delegateType
    function validDelegate(address identity, bytes32 delegateType, address delegate) public view returns (bool) {
        bytes32 delegateTypeHash = keccak256(abi.encodePacked(delegateType));
        uint256 validity = delegates[identity][delegateTypeHash][delegate];
        return (validity > block.timestamp);
    }

    /// @dev Changes the owner of the identity. Only the current owner can call.
    function changeOwner(address identity, address newOwner) public onlyOwner(identity) {
        owners[identity] = newOwner;
        emit DIDOwnerChanged(identity, newOwner, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Internal: Changes the owner of identity, used by signature-based methods
    function _changeOwner(address identity, address actor, address newOwner) internal {
        require(actor == identityOwner(identity), "Not identity owner");
        owners[identity] = newOwner;
        emit DIDOwnerChanged(identity, newOwner, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Changes the owner using an off-chain signature (anti-replay)
    function changeOwnerSigned(
        address identity,
        uint8 sigV, bytes32 sigR, bytes32 sigS,
        address newOwner
    ) public {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19), bytes1(0), this, nonce[identityOwner(identity)], identity, "changeOwner", newOwner
            )
        );
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == identityOwner(identity), "Bad Signature");
        nonce[signer]++;
        _changeOwner(identity, signer, newOwner);
    }

    /// @dev Adds or updates a delegate for the identity (owner only)
    function addDelegate(address identity, bytes32 delegateType, address delegate, uint256 validity) public onlyOwner(identity) {
        bytes32 delegateTypeHash = keccak256(abi.encodePacked(delegateType));
        delegates[identity][delegateTypeHash][delegate] = block.timestamp + validity;
        emit DIDDelegateChanged(identity, delegateType, delegate, block.timestamp + validity, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Internal: Adds/updates a delegate (used by signature-based add)
    function _addDelegate(address identity, address actor, bytes32 delegateType, address delegate, uint256 validity) internal {
        require(actor == identityOwner(identity), "Not identity owner");
        bytes32 delegateTypeHash = keccak256(abi.encodePacked(delegateType));
        delegates[identity][delegateTypeHash][delegate] = block.timestamp + validity;
        emit DIDDelegateChanged(identity, delegateType, delegate, block.timestamp + validity, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Adds or updates a delegate via off-chain signature
    function addDelegateSigned(
        address identity,
        uint8 sigV, bytes32 sigR, bytes32 sigS,
        bytes32 delegateType, address delegate, uint256 validity
    ) public {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19), bytes1(0), this, nonce[identityOwner(identity)], identity, "addDelegate", delegateType, delegate, validity
            )
        );
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == identityOwner(identity), "Bad Signature");
        nonce[signer]++;
        _addDelegate(identity, signer, delegateType, delegate, validity);
    }

    /// @dev Revokes a delegate before expiry (owner only)
    function revokeDelegate(address identity, bytes32 delegateType, address delegate) public onlyOwner(identity) {
        bytes32 delegateTypeHash = keccak256(abi.encodePacked(delegateType));
        delegates[identity][delegateTypeHash][delegate] = block.timestamp;
        emit DIDDelegateChanged(identity, delegateType, delegate, block.timestamp, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Internal: Revokes delegate, used by signature-based revoke
    function _revokeDelegate(address identity, address actor, bytes32 delegateType, address delegate) internal {
        require(actor == identityOwner(identity), "Not identity owner");
        bytes32 delegateTypeHash = keccak256(abi.encodePacked(delegateType));
        delegates[identity][delegateTypeHash][delegate] = block.timestamp;
        emit DIDDelegateChanged(identity, delegateType, delegate, block.timestamp, changed[identity]);
        changed[identity] = block.number;
    }

    /// @dev Revokes a delegate via off-chain signature
    function revokeDelegateSigned(
        address identity,
        uint8 sigV, bytes32 sigR, bytes32 sigS,
        bytes32 delegateType, address delegate
    ) public {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19), bytes1(0), this, nonce[identityOwner(identity)], identity, "revokeDelegate", delegateType, delegate
            )
        );
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == identityOwner(identity), "Bad Signature");
        nonce[signer]++;
        _revokeDelegate(identity, signer, delegateType, delegate);
    }
}