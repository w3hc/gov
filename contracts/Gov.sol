// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract Gov is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    string public manifesto;

    event ManifestoUpdated(string cid);

    /// @notice Initializes the governance contract
    /// @param _token The address of the token used for voting
    /// @param _manifesto The initial CID of the manifesto
    /// @param _name The name of the governance contract
    /// @param _votingDelay The delay before voting starts
    /// @param _votingPeriod The duration of the voting period
    /// @param _votingThreshold The minimum number of votes required to create a proposal
    /// @param _quorum The percentage of total supply that must participate for a vote to succeed
    constructor(
        IVotes _token,
        string memory _manifesto,
        string memory _name,
        uint48 _votingDelay,
        uint32 _votingPeriod,
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

    /// @notice Returns the delay before voting on a proposal may take place
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /// @notice Returns the duration of the voting period
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /// @notice Returns the quorum for a specific block number
    /// @param blockNumber The block number to check the quorum for
    /// @return The number of votes required for a quorum
    function quorum(
        uint256 blockNumber
    ) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    /// @notice Returns the proposal threshold
    /// @return The minimum number of votes required to create a proposal
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
