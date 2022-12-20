// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {
    constructor() {}

    function transferETH() public onlyOwner {}

    function transferERC20() public onlyOwner {}

    function transferERC721() public onlyOwner {}

    function transferERC1155() public onlyOwner {}

    receive() external payable {}
}
