// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@prb/math/src/UD60x18.sol";
import "../Gov.sol";
import "../NFT.sol";
import "hardhat/console.sol";

contract Vault is Ownable, ERC20 {
    constructor(
        address _gov,
        address _nft,
        address _usdc
    ) ERC20("USDg", "USDg") {
        setAddr(_gov, _nft);
        usdc = _usdc;
    }

    address public gov;
    address public nft;
    address public usdc;

    function withdraw(uint256 amount) public {
        UD60x18 ratio = toUD60x18(amount).div(toUD60x18(totalSupply()));
        UD60x18 usdcBal = toUD60x18(IERC20(usdc).balanceOf(address(this)));
        UD60x18 _amountToTransfer = usdcBal.mul(ratio);
        uint256 amountToTransfer = fromUD60x18(_amountToTransfer);

        console.log("       amount: %s", amount);
        console.log("totalSupply(): %s", totalSupply());
        console.log("(usdc)balance: %s", IERC20(usdc).balanceOf(address(this)));

        console.log("amtToTransfer: %s", amountToTransfer);

        _burn(msg.sender, amount);
        IERC20(usdc).transfer(msg.sender, amountToTransfer);
    }

    // test
    function govWithdraw(uint256 amount) public {
        IERC20(usdc).transfer(owner(), amount);
    }

    function give(uint256 amount) public {
        IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, amount);
    }

    function setAddr(address _gov, address _nft) public onlyOwner {
        gov = _gov;
        nft = _nft;
    }

    receive() external payable {}

    fallback() external payable {}
}
