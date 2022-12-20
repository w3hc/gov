// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Logs is Ownable {
    constructor() {}

    function govWrite() public onlyOwner {
        // official
    }

    function memberWrite() public {
        // only DAO members can write
    }

    function openWrite() public {
        // pay something to write
    }

    receive() external payable {}
}
