// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Onboarding is Ownable {
    constructor() {}

    receive() external payable {}
}
