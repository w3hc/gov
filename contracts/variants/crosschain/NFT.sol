// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "./ProofHandler.sol";

/**
 * @title Cross-chain Membership NFT Contract
 * @author Web3 Hackers Collective
 * @notice Non-transferable NFT implementation for DAO membership with cross-chain capabilities
 * @dev Extends OpenZeppelin's NFT standards with cross-chain operation support
 * @custom:security-contact julien@strat.cc
 */
contract NFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    EIP712,
    ERC721Votes
{
    using ProofHandler for ProofHandler.ProofStorage;

    /// @notice Chain ID where contract was originally deployed
    uint256 public immutable home;

    /// @notice Next token ID to be minted
    uint256 private _nextTokenId;

    /// @notice Storage for proof handling
    ProofHandler.ProofStorage private _proofStorage;

    /// @notice Types of operations that can be synchronized across chains
    enum OperationType {
        MINT,
        BURN,
        SET_METADATA
    }

    /// @notice Emitted when a membership is claimed
    /// @param tokenId The ID of the claimed token
    /// @param member The address receiving the membership
    /// @param nonce Operation sequence number
    event MembershipClaimed(uint256 indexed tokenId, address indexed member, uint256 nonce);

    /// @notice Emitted when a membership is revoked
    /// @param tokenId The ID of the revoked token
    /// @param member The address losing membership
    /// @param nonce Operation sequence number
    event MembershipRevoked(uint256 indexed tokenId, address indexed member, uint256 nonce);

    /// @notice Emitted when metadata is updated
    /// @param tokenId The ID of the updated token
    /// @param newUri The new metadata URI
    /// @param nonce Operation sequence number
    event MetadataUpdated(uint256 indexed tokenId, string newUri, uint256 nonce);

    /// @notice Restricts functions to home chain
    modifier onlyHomeChain() {
        require(block.chainid == home, "Operation only allowed on home chain");
        _;
    }

    /**
     * @notice Initializes the NFT contract
     * @param _home Chain ID where contract is considered home
     * @param initialOwner Initial contract owner
     * @param _firstMembers Array of initial member addresses
     * @param _uri Initial token URI
     * @param _name Token collection name
     * @param _symbol Token collection symbol
     */
    constructor(
        uint256 _home,
        address initialOwner,
        address[] memory _firstMembers,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(initialOwner) EIP712(_name, "1") {
        home = _home;
        for (uint i; i < _firstMembers.length; i++) {
            _govMint(_firstMembers[i], _uri);
        }
    }

    /**
     * @notice Adds a new member on home chain
     * @dev Only callable by owner (governance) on home chain
     * @param to Address to mint token to
     * @param uri Token metadata URI
     */
    function safeMint(address to, string memory uri) public onlyOwner onlyHomeChain {
        uint256 nonce = _proofStorage.incrementNonce(uint8(OperationType.MINT));
        _govMint(to, uri);
        emit MembershipClaimed(_nextTokenId - 1, to, nonce);
    }

    /**
     * @notice Burns token on home chain
     * @dev Only callable by owner (governance) on home chain
     * @param tokenId ID of token to burn
     */
    function govBurn(uint256 tokenId) public onlyOwner onlyHomeChain {
        uint256 nonce = _proofStorage.incrementNonce(uint8(OperationType.BURN));
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit MembershipRevoked(tokenId, owner, nonce);
    }

    /**
     * @notice Updates token metadata on home chain
     * @dev Only callable by owner (governance) on home chain
     * @param tokenId ID of token to update
     * @param uri New metadata URI
     */
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner onlyHomeChain {
        uint256 nonce = _proofStorage.incrementNonce(uint8(OperationType.SET_METADATA));
        _setTokenURI(tokenId, uri);
        emit MetadataUpdated(tokenId, uri, nonce);
    }

    /**
     * @notice Generates proof for NFT operations
     * @param operationType Type of operation
     * @param params Operation parameters
     * @return Encoded proof data
     */
    function generateOperationProof(
        uint8 operationType,
        bytes memory params
    ) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs only generated on home chain");
        uint256 nextNonce = _proofStorage.getNextNonce(operationType);
        return ProofHandler.generateProof(address(this), operationType, params, nextNonce);
    }

    /**
     * @notice Claims an NFT operation on a foreign chain
     * @param proof Proof generated by home chain
     */
    function claimOperation(bytes memory proof) external {
        (uint8 operationType, bytes memory params, uint256 nonce) = ProofHandler
            .verifyAndClaimProof(proof, address(this), _proofStorage);

        if (operationType == uint8(OperationType.MINT)) {
            (address to, string memory uri) = abi.decode(params, (address, string));
            _govMint(to, uri);
            emit MembershipClaimed(_nextTokenId - 1, to, nonce);
        } else if (operationType == uint8(OperationType.BURN)) {
            uint256 tokenId = abi.decode(params, (uint256));
            address owner = ownerOf(tokenId);
            _burn(tokenId);
            emit MembershipRevoked(tokenId, owner, nonce);
        } else if (operationType == uint8(OperationType.SET_METADATA)) {
            (uint256 tokenId, string memory uri) = abi.decode(params, (uint256, string));
            _setTokenURI(tokenId, uri);
            emit MetadataUpdated(tokenId, uri, nonce);
        }
    }

    /**
     * @notice Internal function for minting without proof verification
     * @param to Address to receive token
     * @param uri Token metadata URI
     */
    function _govMint(address to, string memory uri) internal {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // Required overrides

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "NFT is not transferable");
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}
