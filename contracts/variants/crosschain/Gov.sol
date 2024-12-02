// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "./ProofHandler.sol";

/**
 * @title Cross-chain Governance Contract
 * @author Web3 Hackers Collective
 * @notice Implementation of a DAO with cross-chain synchronization capabilities
 * @dev Extends OpenZeppelin's Governor contract with cross-chain parameter updates
 * @custom:security-contact julien@strat.cc
 */
contract Gov is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    /// @notice Chain ID where this contract was originally deployed
    uint256 public immutable home;

    /// @notice IPFS CID of the DAO's manifesto
    string public manifesto;

    /// @notice Storage for proof handling
    ProofHandler.ProofStorage private _proofStorage;

    /// @notice Types of operations that can be synchronized across chains
    enum OperationType {
        SET_MANIFESTO,
        UPDATE_VOTING_DELAY,
        UPDATE_VOTING_PERIOD,
        UPDATE_PROPOSAL_THRESHOLD,
        UPDATE_QUORUM
    }

    /// @notice Emitted when the manifesto is updated
    /// @param oldManifesto Previous manifesto CID
    /// @param newManifesto New manifesto CID
    /// @param nonce Update sequence number
    event ManifestoUpdated(string oldManifesto, string newManifesto, uint256 nonce);

    /// @notice Emitted when a governance parameter is updated
    /// @param operationType Type of parameter updated
    /// @param oldValue Previous value
    /// @param newValue New value
    /// @param nonce Update sequence number
    event GovernanceParameterUpdated(
        OperationType indexed operationType,
        uint256 oldValue,
        uint256 newValue,
        uint256 nonce
    );

    /// @notice Restricts functions to be called only on the home chain
    modifier onlyHomeChain() {
        require(block.chainid == home, "Operation only allowed on home chain");
        _;
    }

    /**
     * @notice Initializes the governance contract
     * @dev Sets up initial governance parameters and manifesto
     * @param _home Chain ID where this contract is considered home
     * @param _token The voting token contract address
     * @param _manifestoCid Initial manifesto CID
     * @param _name Name of the governance contract
     * @param _votingDelay Time before voting begins
     * @param _votingPeriod Duration of voting period
     * @param _proposalThreshold Minimum votes needed to create a proposal
     * @param _quorum Minimum participation percentage required
     */
    constructor(
        uint256 _home,
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
        home = _home;
        manifesto = _manifestoCid;
    }

    /**
     * @notice Updates the DAO's manifesto on the home chain
     * @param newManifesto New manifesto CID
     */
    function setManifesto(string memory newManifesto) public onlyGovernance onlyHomeChain {
        uint256 nonce = ProofHandler.incrementNonce(
            _proofStorage,
            uint8(OperationType.SET_MANIFESTO)
        );
        string memory oldManifesto = manifesto;
        manifesto = newManifesto;
        emit ManifestoUpdated(oldManifesto, newManifesto, nonce);
    }

    /**
     * @notice Updates the voting delay parameter on the home chain
     * @param newVotingDelay New voting delay value
     */
    function setVotingDelay(
        uint48 newVotingDelay
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 nonce = ProofHandler.incrementNonce(
            _proofStorage,
            uint8(OperationType.UPDATE_VOTING_DELAY)
        );
        uint256 oldValue = votingDelay();
        _setVotingDelay(newVotingDelay);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_VOTING_DELAY,
            oldValue,
            newVotingDelay,
            nonce
        );
    }

    /**
     * @notice Updates the voting period parameter on the home chain
     * @param newVotingPeriod New voting period value
     */
    function setVotingPeriod(
        uint32 newVotingPeriod
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 nonce = ProofHandler.incrementNonce(
            _proofStorage,
            uint8(OperationType.UPDATE_VOTING_PERIOD)
        );
        uint256 oldValue = votingPeriod();
        _setVotingPeriod(newVotingPeriod);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_VOTING_PERIOD,
            oldValue,
            newVotingPeriod,
            nonce
        );
    }

    /**
     * @notice Updates the proposal threshold parameter on the home chain
     * @param newProposalThreshold New proposal threshold value
     */
    function setProposalThreshold(
        uint256 newProposalThreshold
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 nonce = ProofHandler.incrementNonce(
            _proofStorage,
            uint8(OperationType.UPDATE_PROPOSAL_THRESHOLD)
        );
        uint256 oldValue = proposalThreshold();
        _setProposalThreshold(newProposalThreshold);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_PROPOSAL_THRESHOLD,
            oldValue,
            newProposalThreshold,
            nonce
        );
    }

    /**
     * @notice Updates the quorum numerator on the home chain
     * @param newQuorumNumerator New quorum numerator value
     */
    function updateQuorumNumerator(
        uint256 newQuorumNumerator
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 nonce = ProofHandler.incrementNonce(
            _proofStorage,
            uint8(OperationType.UPDATE_QUORUM)
        );
        uint256 oldValue = quorumNumerator();
        _updateQuorumNumerator(newQuorumNumerator);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_QUORUM,
            oldValue,
            newQuorumNumerator,
            nonce
        );
    }

    /**
     * @notice Generates proof for parameter updates
     * @param operationType Type of parameter being updated
     * @param value Encoded parameter value
     * @return proof Encoded proof data
     */
    function generateParameterProof(
        uint8 operationType,
        bytes memory value
    ) external view returns (bytes memory proof) {
        require(block.chainid == home, "Proofs only generated on home chain");
        uint256 nextNonce = ProofHandler.getNextNonce(_proofStorage, operationType);
        return ProofHandler.generateProof(address(this), operationType, value, nextNonce);
    }

    /**
     * @notice Claims a parameter update on a foreign chain
     * @param proof Proof generated by home chain
     */
    function claimParameterUpdate(bytes memory proof) external {
        (uint8 operationType, bytes memory value, uint256 nonce) = ProofHandler.verifyAndClaimProof(
            proof,
            address(this),
            _proofStorage
        );

        if (operationType == uint8(OperationType.SET_MANIFESTO)) {
            string memory newManifesto = abi.decode(value, (string));
            string memory oldManifesto = manifesto;
            manifesto = newManifesto;
            emit ManifestoUpdated(oldManifesto, newManifesto, nonce);
        } else if (operationType == uint8(OperationType.UPDATE_VOTING_DELAY)) {
            uint48 newValue = uint48(bytes6(value));
            uint256 oldValue = votingDelay();
            _setVotingDelay(newValue);
            emit GovernanceParameterUpdated(
                OperationType.UPDATE_VOTING_DELAY,
                oldValue,
                newValue,
                nonce
            );
        } else if (operationType == uint8(OperationType.UPDATE_VOTING_PERIOD)) {
            uint32 newValue = uint32(bytes4(value));
            uint256 oldValue = votingPeriod();
            _setVotingPeriod(newValue);
            emit GovernanceParameterUpdated(
                OperationType.UPDATE_VOTING_PERIOD,
                oldValue,
                newValue,
                nonce
            );
        } else if (operationType == uint8(OperationType.UPDATE_PROPOSAL_THRESHOLD)) {
            uint256 newValue = abi.decode(value, (uint256));
            uint256 oldValue = proposalThreshold();
            _setProposalThreshold(newValue);
            emit GovernanceParameterUpdated(
                OperationType.UPDATE_PROPOSAL_THRESHOLD,
                oldValue,
                newValue,
                nonce
            );
        } else if (operationType == uint8(OperationType.UPDATE_QUORUM)) {
            uint256 newValue = abi.decode(value, (uint256));
            uint256 oldValue = quorumNumerator();
            _updateQuorumNumerator(newValue);
            emit GovernanceParameterUpdated(OperationType.UPDATE_QUORUM, oldValue, newValue, nonce);
        }
    }

    // Required overrides

    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(
        uint256 blockNumber
    ) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
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
}
