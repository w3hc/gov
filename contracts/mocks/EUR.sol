// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EUR is ERC20 {
    constructor() ERC20("Euro", "EUR") {
        _mint(msg.sender, 10000000000000000000000);
    }

    function mint(address recipient, uint amount) public {
        _mint(recipient, amount);
    }
}
