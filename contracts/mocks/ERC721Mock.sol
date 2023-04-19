// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Mock is ERC721 {
    constructor() ERC721("ERC721Mock", "BANANA") {
        _safeMint(msg.sender, 1);
    }

    function mint(address _recipient, uint256 _id) public {
        _safeMint(_recipient, _id);
    }
}
