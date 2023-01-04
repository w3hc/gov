// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@prb/math/src/UD60x18.sol";

contract Vault is Ownable, ERC20, ReentrancyGuard {
    constructor(address _usdc) ERC20("USDg", "USDg") {
        usdc = _usdc;
    }

    address public usdc;

    function withdraw(uint256 amount) public nonReentrant {
        UD60x18 ratio = toUD60x18(amount).div(toUD60x18(totalSupply()));
        UD60x18 usdcBal = toUD60x18(IERC20(usdc).balanceOf(address(this)));
        UD60x18 _amountToTransfer = usdcBal.mul(ratio);
        uint256 amountToTransfer = fromUD60x18(_amountToTransfer);

        _burn(msg.sender, amount);
        IERC20(usdc).transfer(msg.sender, amountToTransfer);
    }

    function give(uint256 amount) public nonReentrant {
        IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }

    function govWithdraw(uint256 amount) public onlyOwner {
        IERC20(usdc).transfer(owner(), amount);
    }

    receive() external payable {}

    fallback() external payable {}
}
