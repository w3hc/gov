// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Shop is Ownable, ReentrancyGuard, IERC721Receiver {
    constructor(address _usdc, address _vault) {
        usdc = _usdc;
        vault = _vault;
    }

    address public usdc;
    address public vault;

    // struct Hypercert {
    //     address addr;
    //     uint256 id;
    //     uint256 price;
    // }
    // mapping(uint256 => Hypercert) public hypercerts;

    function sell(address addr, uint256 id, uint256 price) public onlyOwner {
        // hypercerts.push(addr, id, price);
    }

    function buy(address addr, uint256 id) public nonReentrant {
        // require();
        uint256 price = 2 * 10 ** 18;
        require(
            IERC20(usdc).transferFrom(msg.sender, vault, price),
            "USDC amount too low"
        );
        IERC721(addr).transferFrom(address(this), msg.sender, id);
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
