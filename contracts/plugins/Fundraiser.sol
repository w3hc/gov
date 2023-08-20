// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

contract Fundraiser is ERC4626, Ownable, ERC20Snapshot {
    uint256 public latestSnapshot;
    IERC20 public usdc;
    uint public minCap;
    uint public deadline;

    constructor(
        IERC20 _usdc,
        uint _minCap,
        uint _deadline
    ) ERC20Snapshot() ERC20("xUSDC", "xUSDC") ERC4626(_usdc) {
        usdc = _usdc;
        minCap = _minCap;
        deadline = _deadline;
    }

    function fund(uint amount) public {
        IERC20(usdc).transferFrom(msg.sender, address(this), amount);
    }

    function exit(uint amount) public {
        IERC20(usdc).transfer(owner(), amount);
    }

    function stop() public {
        if (
            deadline > block.timestamp ||
            IERC20(usdc).balanceOf(address(this)) > minCap
        ) {
            IERC20(usdc).transfer(
                owner(),
                IERC20(usdc).balanceOf(address(this))
            );
        } else {
            uint amount = 1;
            address addr;
            address people_who_donated;
            IERC20(usdc).transfer(people_who_donated, amount);
            for (uint i; i < 3; i++) {
                pay(addr);
            }
        }
    }

    function pay(address target) internal {
        uint amount = 1;
        address people_who_donated;
        IERC20(usdc).transfer(target, amount);
    }

    function govTransfer(uint256 amount) public onlyOwner {
        ERC20(asset()).transfer(msg.sender, amount);
    }

    function snapshot() public {
        latestSnapshot = _snapshot();
    }

    function decimals() public pure override(ERC20, ERC4626) returns (uint8) {
        return 18;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) {
        super._beforeTokenTransfer(from, to, amount);
    }

    receive() external payable {}

    fallback() external payable {}
}
