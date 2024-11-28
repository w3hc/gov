// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

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
    mapping(uint256 => bool) public existsOnChain;

    event MembershipClaimed(
        uint256 indexed tokenId,
        address indexed member,
        address indexed claimer
    );
    event MembershipRevoked(uint256 indexed tokenId, address indexed member);

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

    function _mintOriginal(address to, string memory uri) private {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;
    }

    function generateMembershipProof(uint256 tokenId) external view returns (bytes memory) {
        address member = ownerOf(tokenId);
        // Simple concatenation and hashing without chain-specific info
        bytes32 message = keccak256(abi.encodePacked(address(this), tokenId, member));
        // Simply hash the message without EIP-712 structure
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        return abi.encode(tokenId, member, digest);
    }

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

    function membershipExistsHere(uint256 tokenId) external view returns (bool) {
        return existsOnChain[tokenId];
    }

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        _mintOriginal(to, uri);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "This NFT is not transferable");
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

    function govBurn(uint256 tokenId) public onlyOwner {
        address owner = ownerOf(tokenId);
        _update(address(0), tokenId, owner);
        existsOnChain[tokenId] = false;
        emit MembershipRevoked(tokenId, owner);
    }

    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
