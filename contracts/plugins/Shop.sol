// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Gov.sol";

contract Shop is Ownable, ReentrancyGuard, IERC721Receiver {
    constructor(address _gov, address _nft, address _usdc) {
        setAddr(_gov, _nft);
        usdc = _usdc;
    }

    address public gov;
    address public nft;
    address public usdc;

    struct Hypercert {
        address addr;
        uint256 id;
        uint256 price;
    }
    mapping()

    function sell(address addr, uint256 id, uint256 price) public onlyOwner {

    }

    function buy(address addr, uint256 id, uint256 price) public {

    }

    function setAddr(address _gov, address _nft) public onlyOwner {
        gov = _gov;
        nft = _nft;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {}

    fallback() external payable {}
}
