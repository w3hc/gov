// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

/// @title DAO Membership NFT Contract
/// @notice This contract implements a non-transferable NFT with voting rights for DAO membership
/// @dev Extends multiple OpenZeppelin contracts to create a feature-rich NFT
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

    /// @notice Initializes the NFT contract
    /// @param initialOwner The address of the initial owner (typically the governance contract)
    /// @param _firstMembers An array of addresses for the initial DAO members
    /// @param _uri The initial token URI for the NFTs
    /// @param _name The name of the NFT
    /// @param _symbol The symbol of the NFT
    constructor(
        address initialOwner,
        address[] memory _firstMembers,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(initialOwner) EIP712(_name, "1") {
        for (uint i; i < _firstMembers.length; i++) {
            safeMint(_firstMembers[i], _uri);
            _delegate(_firstMembers[i], _firstMembers[i]);
        }
    }

    /// @notice Returns the current timestamp
    /// @dev This function is used for voting snapshots
    /// @return The current block timestamp as a uint48
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Describes the clock mode for voting snapshots
    /// @return A string indicating that the contract uses timestamps for voting
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    /// @notice Adds a new member to the DAO
    /// @dev Mints a new NFT to the specified address
    /// @param to The address of the new member
    /// @param uri The metadata URI for the new NFT
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _delegate(to, to);
    }

    /// @notice Updates the NFT ownership
    /// @dev Overrides the transfer function to make NFTs non-transferable
    /// @param to The recipient address
    /// @param tokenId The ID of the token
    /// @param auth The address authorized to make the transfer
    /// @return The previous owner of the token
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "This NFT is not transferable");
        return super._update(to, tokenId, auth);
    }

    /// @notice Increases the balance of an account
    /// @dev Internal function to update balances, overridden to maintain compatibility
    /// @param account The account whose balance is being increased
    /// @param value The amount to increase the balance by
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /// @notice Returns the token URI for a given token ID
    /// @param tokenId The ID of the token
    /// @return The URI string for the token's metadata
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /// @notice Removes a member from the DAO
    /// @dev Burns the NFT associated with the member
    /// @param tokenId The ID of the NFT to burn
    function govBurn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    /// @notice Updates the metadata for a given NFT
    /// @param tokenId The ID of the NFT to update
    /// @param uri The new metadata URI for the NFT
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    /// @notice Checks if the contract supports a given interface
    /// @param interfaceId The interface identifier to check
    /// @return bool True if the contract supports the interface, false otherwise
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
