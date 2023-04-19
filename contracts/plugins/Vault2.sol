// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

// import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

// contract Vault2 is ERC4626, ERC20Snapshot, Ownable {
contract Vault2 is ERC4626, Ownable {
    constructor(IERC20 asset_) ERC20("xUSDC", "xUSDC") ERC4626(asset_) {}

    function govTransfer(uint256 amount) public onlyOwner {
        ERC20(asset()).transfer(msg.sender, amount);
    }

    // function _beforeTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 amount
    // ) internal override(ERC20, ERC20Snapshot) {
    //     super._beforeTokenTransfer(from, to, amount);
    // }

    receive() external payable {}

    fallback() external payable {}
}
