// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/// @title DAO contract
/// @author Web3 Hackers Collective
contract Gov is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    string public manifesto;

    event ManifestoUpdated(string cid);

    constructor(
        IVotes _token,
        string memory _manifesto,
        string memory _name,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _votingThreshold,
        uint256 _quorum
    )
        Governor(_name)
        GovernorSettings(_votingDelay, _votingPeriod, _votingThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorum)
    {
        manifesto = _manifesto;
    }

    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
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

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    /// @notice Replaces the CID of the manifesto
    /// @dev Must include the DAO mission statement
    /// @param cid The CID of the new manifesto
    function setManifesto(string memory cid) public onlyGovernance {
        manifesto = cid;
        emit ManifestoUpdated(cid);
    }
}
