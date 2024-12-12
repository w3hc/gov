// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

/**
 * @title Proof Handler Library
 * @author Web3 Hackers Collective
 * @notice Library for standardized cross-chain proof generation and verification
 * @dev Handles proof generation, verification, and tracking for cross-chain operations
 * @custom:security-contact julien@strat.cc
 */
library ProofHandler {
    /// @notice Tracks which proofs have been applied and nonces for operations that require them
    struct ProofStorage {
        mapping(bytes32 => bool) updateAppliedOnChain;
        mapping(uint8 => uint256) currentNonce;
    }

    /// @dev Emitted when a proof is claimed
    event ProofClaimed(uint8 indexed operationType, bytes params, uint256 nonce);

    /**
     * @notice Generates a proof for cross-chain operations
     * @param contractAddress Address of contract generating the proof
     * @param operationType Type of operation being performed
     * @param params Operation parameters
     * @param nonce Current nonce for this operation type (0 for nonce-free operations)
     * @return proof Encoded proof data
     */
    function generateProof(
        address contractAddress,
        uint8 operationType,
        bytes memory params,
        uint256 nonce
    ) public pure returns (bytes memory proof) {
        bytes32 message = keccak256(
            abi.encodePacked(contractAddress, operationType, params, nonce)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));

        return abi.encode(operationType, params, nonce, digest);
    }

    /**
     * @notice Verifies and claims a proof
     * @param proof Proof to verify and claim
     * @param contractAddress Address of contract claiming the proof
     * @param storage_ Proof storage struct
     * @return operationType The type of operation being performed
     * @return params The operation parameters
     * @return nonce The operation sequence number
     */
    function verifyAndClaimProof(
        bytes memory proof,
        address contractAddress,
        ProofStorage storage storage_
    ) public returns (uint8 operationType, bytes memory params, uint256 nonce) {
        bytes32 digest;
        (operationType, params, nonce, digest) = abi.decode(
            proof,
            (uint8, bytes, uint256, bytes32)
        );

        bytes32 message = keccak256(
            abi.encodePacked(contractAddress, operationType, params, nonce)
        );
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid proof");

        if (operationType > 1) {
            bytes32 proofHash = keccak256(proof);
            require(!storage_.updateAppliedOnChain[proofHash], "Proof already claimed");
            require(nonce == storage_.currentNonce[operationType] + 1, "Invalid nonce");

            storage_.updateAppliedOnChain[proofHash] = true;
            storage_.currentNonce[operationType] = nonce;
        }

        emit ProofClaimed(operationType, params, nonce);

        return (operationType, params, nonce);
    }

    /**
     * @notice Gets the next nonce for an operation type
     * @param storage_ Proof storage struct
     * @param operationType Type of operation
     * @return nonce Next nonce value
     */
    function getNextNonce(
        ProofStorage storage storage_,
        uint8 operationType
    ) public view returns (uint256 nonce) {
        if (operationType <= 1) return 0; // MINT or BURN operations don't use nonces
        return storage_.currentNonce[operationType] + 1;
    }

    /**
     * @notice Increments the nonce for an operation type
     * @param storage_ Proof storage struct
     * @param operationType Type of operation
     * @return nonce New nonce value
     */
    function incrementNonce(
        ProofStorage storage storage_,
        uint8 operationType
    ) public returns (uint256 nonce) {
        if (operationType <= 1) return 0; // MINT or BURN operations don't use nonces
        storage_.currentNonce[operationType]++;
        return storage_.currentNonce[operationType];
    }
}
