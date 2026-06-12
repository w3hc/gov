// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ERC721Votes} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

/**
 * @title Membership NFT Contract
 * @author W3HC
 * @notice A non-transferable NFT implementation for DAO membership
 * @dev Extends OpenZeppelin's NFT standards
 * @custom:security-contact julien@strat.cc
 */
contract NFT is ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Burnable, Ownable, EIP712, ERC721Votes {
    /// @notice Next token ID to be minted
    uint256 private _nextTokenId;

    /// @notice The current operator address authorized to mint without governance
    address public operator;

    /// @notice Expiration timestamp for operator privileges
    uint256 public operatorExpiration;

    // Custom errors
    /// @notice Error thrown when attempting to transfer non-transferable NFTs
    error NFTNonTransferable();

    /// @notice Error thrown when a non-operator tries to call operator-only functions
    error OnlyOperatorAllowed();

    /// @notice Error thrown when operator privileges have expired
    error OperatorExpired();

    /// @notice Error thrown when an address already holds a membership NFT
    error OneMemberOneVote();

    /**
     * @notice Emitted when a membership is revoked
     * @param tokenId The ID of the revoked token
     * @param member The address losing membership
     */
    event MembershipRevoked(uint256 indexed tokenId, address indexed member);

    /**
     * @notice Emitted when a token's metadata is updated
     * @param tokenId The ID of the updated token
     * @param newUri The new metadata URI
     */
    event MetadataUpdated(uint256 indexed tokenId, string newUri);

    /// @notice Emitted when operator is updated by owner/governance
    event OperatorUpdated(address indexed previousOperator, address indexed newOperator);

    /// @notice Emitted when operator expiration is updated by owner/governance
    event OperatorExpirationUpdated(uint256 previousExpiration, uint256 newExpiration);

    /**
     * @notice Restricts function to operator only and checks expiration
     */
    modifier onlyOperator() {
        if (msg.sender != operator) revert OnlyOperatorAllowed();
        if (operatorExpiration > 0 && block.timestamp > operatorExpiration) revert OperatorExpired();
        _;
    }

    /**
     * @notice Initializes the NFT contract with initial members
     * @dev Sets up ERC721 parameters and mints initial tokens
     * @param initialOwner The initial contract owner (typically governance)
     * @param _firstMembers Array of initial member addresses
     * @param _uri Initial token URI
     * @param _name Token collection name
     * @param _symbol Token collection symbol
     */
    constructor(
        address initialOwner,
        address[] memory _firstMembers,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(initialOwner) EIP712(_name, "1") {
        for (uint256 i; i < _firstMembers.length; ++i) {
            _mint(_firstMembers[i], _uri);
            _delegate(_firstMembers[i], _firstMembers[i]);
        }
    }

    /**
     * @notice Mints a new membership token
     * @dev Only callable by owner
     * @param to Recipient address
     * @param uri Token metadata URI
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        _mint(to, uri);
        _delegate(to, to);
    }

    /**
     * @notice Sets the operator address
     * @dev Can only be called by owner (governance)
     * @param newOperator Address of the new operator (can be address(0) to disable)
     */
    function setOperator(address newOperator) public onlyOwner {
        address previousOperator = operator;
        operator = newOperator;
        emit OperatorUpdated(previousOperator, newOperator);
    }

    /**
     * @notice Sets the operator expiration timestamp
     * @dev Can only be called by owner (governance)
     * Set to 0 to disable expiration
     * @param newExpiration New expiration timestamp (unix time)
     */
    function setOperatorExpiration(uint256 newExpiration) public onlyOwner {
        uint256 previousExpiration = operatorExpiration;
        operatorExpiration = newExpiration;
        emit OperatorExpirationUpdated(previousExpiration, newExpiration);
    }

    /**
     * @notice Mints a new membership token as operator
     * @dev Allows the operator to mint without a governance vote
     * Intended for use by off-chain relayers (e.g., Next.js API routes)
     * @param to Recipient address
     * @param uri Token metadata URI
     */
    function operatorMint(address to, string memory uri) public onlyOperator {
        _mint(to, uri);
        _delegate(to, to);
    }

    /**
     * @notice Revokes a membership
     * @dev Only callable by owner
     * @param tokenId ID of token to burn
     */
    function govBurn(uint256 tokenId) public onlyOwner {
        _govBurn(tokenId);
    }

    /**
     * @notice Updates a token's metadata
     * @dev Only callable by owner
     * @param tokenId ID of token to update
     * @param uri New metadata URI
     */
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner {
        _updateTokenMetadata(tokenId, uri);
    }

    // Internal Functions

    /**
     * @dev Internal function to mint new token with metadata
     * @param to Address receiving the token
     * @param uri Metadata URI for the token
     */
    function _mint(address to, string memory uri) private {
        if (balanceOf(to) != 0) revert OneMemberOneVote();
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Internal function to burn token through governance
     * @param tokenId ID of token to burn
     */
    function _govBurn(uint256 tokenId) private {
        address owner = ownerOf(tokenId);
        _update(address(0), tokenId, owner);
        emit MembershipRevoked(tokenId, owner);
    }

    /**
     * @dev Internal function to update token metadata
     * @param tokenId ID of token to update
     * @param uri New metadata URI
     */
    function _updateTokenMetadata(uint256 tokenId, string memory uri) private {
        _setTokenURI(tokenId, uri);
        emit MetadataUpdated(tokenId, uri);
    }

    // Required Overrides

    /**
     * @dev Override of ERC721's _update to make tokens non-transferable
     * @param to Target address (only allowed to be zero address for burns)
     * @param tokenId Token ID being updated
     * @param auth Address initiating the update
     * @return Previous owner of the token
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Votes)
        returns (address)
    {
        if (auth != address(0) && to != address(0)) {
            revert NFTNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Increases an account's token balance
     * @dev Internal function required by inherited contracts
     * @param account Address to increase balance for
     * @param value Amount to increase by
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Gets the token URI
     * @dev Returns the metadata URI for a given token
     * @param tokenId ID of the token
     * @return URI string for the token metadata
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Checks if the contract supports a given interface
     * @dev Implements interface detection for ERC721 and extensions
     * @param interfaceId Interface identifier to check
     * @return bool True if the interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Gets the current timestamp
     * @dev Used for voting snapshots, returns block timestamp as uint48
     * @return Current block timestamp
     */
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /**
     * @notice Gets the clock mode for voting snapshots
     * @dev Returns a description of how the clock value should be interpreted
     * @return String indicating timestamp-based clock mode
     */
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}
