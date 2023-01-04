// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Mock is ERC1155, Ownable {
    constructor() ERC1155("Thistle") {
        _mint(msg.sender, 1, 1, "0x");
        setURI("Yo");
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}
