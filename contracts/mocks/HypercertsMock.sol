// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract HypercertsMock is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    mapping(address => bool) public authorized;

    constructor() ERC721("HypercertsMock", "CERT") {}

    // https://github.com/hypercerts-org/hypercerts/blob/main/contracts/src/HypercertMinter.sol#L75-L83
    // https://testnet.hypercerts.org/docs/minting-guide/step-by-step#owners
    function mintClaim(address[] memory _authorized) public onlyOwner {
        for (uint i = 1; i < _authorized.length; i++) {
            authorized[_authorized[i]] = true;
        }
    }

    function mint(address to) public {
        require(authorized[to] == true, "Can't mint");
        authorized[to] = false;
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function getAuthorized(address to) public view returns (bool) {
        if (authorized[to] == true) {
            return true;
        } else {
            return false;
        }
    }
}
