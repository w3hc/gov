// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";

/**
 * @title GovProposalTracking
 * @author W3HC
 * @notice Extension for tracking proposal IDs in a Governor contract
 * @dev Extends Governor to maintain an array of all proposal IDs
 * @custom:security-contact julien@strat.cc
 */
abstract contract GovProposalTracking is Governor {
    /// @notice Array storing all proposal IDs
    uint256[] private _proposalIds;

    /**
     * @notice Gets all proposal IDs
     * @return Array of all proposal IDs that have been created
     */
    function proposalIds() public view returns (uint256[] memory) {
        return _proposalIds;
    }

    /**
     * @notice Gets a specific proposal ID by index
     * @param index Index in the proposalIds array
     * @return The proposal ID at the given index
     */
    function proposalIds(uint256 index) public view returns (uint256) {
        return _proposalIds[index];
    }

    /**
     * @notice Gets the total number of proposals
     * @return The total count of proposals
     */
    function proposalCount() public view returns (uint256) {
        return _proposalIds.length;
    }

    /**
     * @notice Submits a new proposal and tracks its ID
     * @dev Overrides the propose function to track proposal IDs
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
    ) public virtual override returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        _proposalIds.push(proposalId);
        return proposalId;
    }
}
