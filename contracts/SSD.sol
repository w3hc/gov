// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/// @custom:security-contact julien@strat.cc
contract SSD is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    constructor(
        IVotes _token
    )
        Governor("SSD")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(20) // Quorum set to 20%
    {}

    function votingDelay() public pure override returns (uint256) {
        return 1; // Vote opens 1 block after proposal submission
    }

    function votingPeriod() public pure override returns (uint256) {
        return 240; // 240 * 15 / 60 ≈ 1 hour
    }

    function quorum(
        uint256 blockNumber
    )
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    // Test
    function addMember(address newMember) public {
        // mint
    }

    // Test
    function banMember(address newMember) public {
        // burn
    }
}
