// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

/// @title Non-transferable Membership NFT Contract
/// @author Web3 Hackers Collective
/// @notice This contract implements a non-transferable NFT for DAO membership with cross-chain capabilities
/// @dev Extends multiple OpenZeppelin contracts to create a feature-rich membership token
contract NFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    EIP712,
    ERC721Votes
{
    uint256 private _nextTokenId;
    /// @notice Tracks whether a token exists on the current chain
    mapping(uint256 => bool) public existsOnChain;

    /// @notice Emitted when a membership is claimed on a new chain
    /// @param tokenId The ID of the claimed token
    /// @param member The address of the member who owns the token
    /// @param claimer The address that executed the claim transaction
    event MembershipClaimed(
        uint256 indexed tokenId,
        address indexed member,
        address indexed claimer
    );

    /// @notice Emitted when a membership is revoked
    /// @param tokenId The ID of the revoked token
    /// @param member The address of the former member
    event MembershipRevoked(uint256 indexed tokenId, address indexed member);

    /// @notice Initializes the NFT contract
    /// @dev Sets up initial members and configures the base token properties
    /// @param initialOwner Address of the initial contract owner (typically the governance contract)
    /// @param _firstMembers Array of addresses for the initial DAO members
    /// @param _uri The initial token URI for the NFTs
    /// @param _name The name of the NFT collection
    /// @param _symbol The symbol of the NFT collection
    constructor(
        address initialOwner,
        address[] memory _firstMembers,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(initialOwner) EIP712(_name, "1") {
        for (uint i; i < _firstMembers.length; i++) {
            _mintOriginal(_firstMembers[i], _uri);
        }
    }

    /// @notice Internal function to mint original tokens
    /// @dev Used for initial minting and new member addition
    /// @param to Address to receive the NFT
    /// @param uri Metadata URI for the token
    function _mintOriginal(address to, string memory uri) private {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;
    }

    /// @notice Generates a proof of membership for cross-chain claiming
    /// @dev Creates a hash-based proof that can be verified on other chains
    /// @param tokenId The ID of the token to generate proof for
    /// @return The encoded proof containing tokenId, member address, and digest
    function generateMembershipProof(uint256 tokenId) external view returns (bytes memory) {
        address member = ownerOf(tokenId);
        bytes32 message = keccak256(abi.encodePacked(address(this), tokenId, member));
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        return abi.encode(tokenId, member, digest);
    }

    /// @notice Claims a membership on a new chain using proof from the original chain
    /// @dev Verifies the proof and mints the token if valid
    /// @param proof The encoded proof from the original chain
    /// @param uri The metadata URI for the token
    function claimMembership(bytes memory proof, string memory uri) external {
        (uint256 tokenId, address member, bytes32 digest) = abi.decode(
            proof,
            (uint256, address, bytes32)
        );

        require(!existsOnChain[tokenId], "Membership already exists on this chain");
        bytes32 message = keccak256(abi.encodePacked(address(this), tokenId, member));
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid proof");

        _safeMint(member, tokenId);
        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;

        emit MembershipClaimed(tokenId, member, msg.sender);
    }

    /// @notice Checks if a membership token exists on the current chain
    /// @param tokenId The ID of the token to check
    /// @return bool True if the token exists on this chain
    function membershipExistsHere(uint256 tokenId) external view returns (bool) {
        return existsOnChain[tokenId];
    }

    /// @notice Returns the current timestamp
    /// @dev Used for voting snapshots
    /// @return Current block timestamp as uint48
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Returns the clock mode for timestamps
    /// @return String indicating timestamp-based clock mode
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    /// @notice Mints a new membership token
    /// @dev Can only be called by the contract owner (governance)
    /// @param to Address to receive the new token
    /// @param uri Metadata URI for the new token
    function safeMint(address to, string memory uri) public onlyOwner {
        _mintOriginal(to, uri);
    }

    /// @notice Updates token ownership
    /// @dev Overridden to implement non-transferability
    /// @param to Recipient address
    /// @param tokenId Token ID to update
    /// @param auth Address authorized for the update
    /// @return Previous owner address
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "This NFT is not transferable");
        return super._update(to, tokenId, auth);
    }

    /// @notice Increases an account's token balance
    /// @dev Internal function required by inherited contracts
    /// @param account Address to increase balance for
    /// @param value Amount to increase by
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /// @notice Gets the token URI
    /// @param tokenId ID of the token
    /// @return URI string for the token metadata
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /// @notice Revokes a membership through governance
    /// @dev Can only be called by the contract owner (governance)
    /// @param tokenId ID of the token to burn
    function govBurn(uint256 tokenId) public onlyOwner {
        address owner = ownerOf(tokenId);
        _update(address(0), tokenId, owner);
        existsOnChain[tokenId] = false;
        emit MembershipRevoked(tokenId, owner);
    }

    /// @notice Updates the metadata URI for a token
    /// @dev Can only be called by the contract owner (governance)
    /// @param tokenId ID of the token to update
    /// @param uri New metadata URI
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    /// @notice Interface support checker
    /// @dev Overridden to support all inherited interfaces
    /// @param interfaceId Interface identifier to check
    /// @return bool True if interface is supported
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
