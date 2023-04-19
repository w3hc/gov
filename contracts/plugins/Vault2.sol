// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";

contract Vault2 is ERC4626, Ownable, ERC20Snapshot {
    uint256 public latestSnapshot;

    constructor(
        IERC20 asset_
    ) ERC20Snapshot() ERC20("xUSDC", "xUSDC") ERC4626(asset_) {}

    function govTransfer(uint256 amount) public onlyOwner {
        ERC20(asset()).transfer(msg.sender, amount);
    }

    // function snapshot(address account) public returns (uint256) {
    //     return balanceOfAt(account, _snapshot());
    // }

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
