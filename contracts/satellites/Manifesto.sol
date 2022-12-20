// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Manifesto is Ownable {
    string public cid;
    string public tag;

    event Updated(
        uint indexed timestamp,
        string indexed cid,
        string indexed tag
    );

    constructor(string memory _cid, string memory _tag) {
        update(_cid, _tag);
    }

    function update(string memory _cid, string memory _tag) public onlyOwner {
        cid = _cid;
        tag = _tag;
        emit Updated(block.timestamp, _cid, _tag);
    }
}
