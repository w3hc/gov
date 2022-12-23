// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

import "../Gov.sol";

contract Onboarding {
    constructor(address _gov) {
        gov = _gov;
    }

    address[] public targets;
    uint256[] public values;
    bytes[] public calldatas;
    string public descriptionHash;

    address public gov;

    function submitProposal() public {
        Gov(payable(gov)).propose(targets, values, calldatas, descriptionHash);
    }

    function setProposal(
        address[] memory _targets,
        uint256[] memory _values,
        bytes[] memory _calldatas,
        string memory _descriptionHash
    ) public {
        // require(msg.sender == gov);
        targets = _targets;
        values = _values;
        calldatas = _calldatas;
        descriptionHash = _descriptionHash;
    }

    receive() external payable {}

    fallback() external payable {}
}
