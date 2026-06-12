// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes, IVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {
    GovernorVotesQuorumFraction
} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovProposalTracking} from "./extensions/GovProposalTracking.sol";

/**
 * @title Gov
 * @author W3HC
 * @notice Implementation of a DAO governance contract
 * @dev Extends OpenZeppelin's Governor contract
 * @custom:security-contact julien@strat.cc
 */
contract Gov is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovProposalTracking
{
    /// @notice IPFS CID of the DAO's manifesto
    string public manifesto;

    /// @notice Emitted when the manifesto is updated
    /// @param oldManifesto Previous manifesto CID
    /// @param newManifesto New manifesto CID
    event ManifestoUpdated(string oldManifesto, string newManifesto);

    /// @notice Types of operations for governance parameter updates
    enum OperationType {
        SET_MANIFESTO,
        UPDATE_VOTING_DELAY,
        UPDATE_VOTING_PERIOD,
        UPDATE_PROPOSAL_THRESHOLD,
        UPDATE_QUORUM
    }

    /// @notice Emitted when a governance parameter is updated
    /// @param operationType Type of parameter that was updated
    /// @param oldValue Previous value of the parameter
    /// @param newValue New value of the parameter
    event GovernanceParameterUpdated(OperationType indexed operationType, uint256 oldValue, uint256 newValue);

    /**
     * @notice Initializes the governance contract
     * @dev Sets up initial governance parameters and manifesto
     * @param _token The voting token contract address
     * @param _manifestoCid Initial manifesto CID
     * @param _name Name of the governance contract
     * @param _votingDelay Time before voting begins in seconds
     * @param _votingPeriod Duration of voting period in seconds
     * @param _proposalThreshold Minimum votes needed to create a proposal
     * @param _quorum Minimum participation percentage required
     */
    constructor(
        IVotes _token,
        string memory _manifestoCid,
        string memory _name,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorum
    )
        Governor(_name)
        GovernorSettings(_votingDelay, _votingPeriod, _proposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorum)
    {
        manifesto = _manifestoCid;
    }

    /**
     * @notice Updates the DAO's manifesto
     * @dev Can only be called through governance
     * @param newManifesto New manifesto CID
     */
    function setManifesto(string memory newManifesto) public onlyGovernance {
        string memory oldManifesto = manifesto;
        manifesto = newManifesto;
        emit ManifestoUpdated(oldManifesto, newManifesto);
    }

    /**
     * @notice Updates the voting delay parameter
     * @dev Can only be called through governance
     * @param newVotingDelay New voting delay value in seconds
     */
    function setVotingDelay(uint48 newVotingDelay) public virtual override onlyGovernance {
        uint256 oldValue = votingDelay();
        _setVotingDelay(newVotingDelay);
        emit GovernanceParameterUpdated(OperationType.UPDATE_VOTING_DELAY, oldValue, newVotingDelay);
    }

    /**
     * @notice Updates the voting period parameter
     * @dev Can only be called through governance
     * @param newVotingPeriod New voting period value in seconds
     */
    function setVotingPeriod(uint32 newVotingPeriod) public virtual override onlyGovernance {
        uint256 oldValue = votingPeriod();
        _setVotingPeriod(newVotingPeriod);
        emit GovernanceParameterUpdated(OperationType.UPDATE_VOTING_PERIOD, oldValue, newVotingPeriod);
    }

    /**
     * @notice Updates the proposal threshold parameter
     * @dev Can only be called through governance
     * @param newProposalThreshold New proposal threshold value
     */
    function setProposalThreshold(uint256 newProposalThreshold) public virtual override onlyGovernance {
        uint256 oldValue = proposalThreshold();
        _setProposalThreshold(newProposalThreshold);
        emit GovernanceParameterUpdated(OperationType.UPDATE_PROPOSAL_THRESHOLD, oldValue, newProposalThreshold);
    }

    /**
     * @notice Updates the quorum numerator
     * @dev Can only be called through governance
     * @param newQuorumNumerator New quorum numerator value (percentage * 100)
     */
    function updateQuorumNumerator(uint256 newQuorumNumerator)
        public
        virtual
        override(GovernorVotesQuorumFraction)
        onlyGovernance
    {
        uint256 oldValue = quorumNumerator();
        _updateQuorumNumerator(newQuorumNumerator);
        emit GovernanceParameterUpdated(OperationType.UPDATE_QUORUM, oldValue, newQuorumNumerator);
    }

    /**
     * @notice Submits a new proposal
     * @dev Required override to resolve diamond inheritance between Governor and GovProposalTracking
     * @param targets Array of target addresses for proposal calls
     * @param values Array of values for proposal calls
     * @param calldatas Array of calldatas for proposal calls
     * @param description Description of the proposal
     * @return proposalId The ID of the created proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(Governor, GovProposalTracking) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    // Required overrides

    /**
     * @notice Gets the current voting delay
     * @dev Overrides Governor and GovernorSettings to provide the correct value
     * @return Current voting delay in seconds
     */
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /**
     * @notice Gets the current voting period
     * @dev Overrides Governor and GovernorSettings to provide the correct value
     * @return Current voting period in seconds
     */
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /**
     * @notice Gets the quorum required for a specific block
     * @dev Overrides Governor and GovernorVotesQuorumFraction to provide the correct quorum calculation
     * @param blockNumber Block number to check quorum for
     * @return Minimum number of votes required for quorum
     */
    function quorum(uint256 blockNumber) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    /**
     * @notice Gets the current proposal threshold
     * @dev Overrides Governor and GovernorSettings to provide the correct value
     * @return Minimum number of votes required to create a proposal
     */
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
}
