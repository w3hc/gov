// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import {BaseTest} from "../helpers/BaseTest.sol";
import {Gov} from "../../src/Gov.sol";
import {NFT} from "../../src/NFT.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

/**
 * @title GovTest
 * @notice Comprehensive unit tests for the Gov contract
 */
contract GovTest is BaseTest {
    NFT public nft;
    Gov public gov;

    // Proposal variables
    address[] public proposalTargets;
    uint256[] public proposalValues;
    bytes[] public proposalCalldatas;
    string public proposalDescription;

    function setUp() public {
        setUpAccounts();

        vm.startPrank(deployer);

        // Create initial members
        address[] memory initialMembers = createInitialMembers(2);

        // Deploy NFT
        nft = new NFT(deployer, initialMembers, "ipfs://QmTokenURI", "DAO Membership", "DAOM");

        // Deploy governance
        gov = new Gov(
            nft,
            "QmInitialManifestoCID",
            "DAO Governance",
            DEFAULT_VOTING_DELAY,
            DEFAULT_VOTING_PERIOD,
            DEFAULT_PROPOSAL_THRESHOLD,
            DEFAULT_QUORUM_NUMERATOR
        );

        // Transfer ownership to governance
        nft.transferOwnership(address(gov));

        vm.stopPrank();

        labelContracts(address(gov), address(nft));
    }

    /*//////////////////////////////////////////////////////////////
                        DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_constructor_SetsCorrectInitialState() public view {
        assertEq(gov.name(), "DAO Governance");
        assertEq(gov.manifesto(), "QmInitialManifestoCID");
        assertEq(gov.votingDelay(), DEFAULT_VOTING_DELAY);
        assertEq(gov.votingPeriod(), DEFAULT_VOTING_PERIOD);
        assertEq(gov.proposalThreshold(), DEFAULT_PROPOSAL_THRESHOLD);
    }

    function test_constructor_SetsCorrectToken() public view {
        assertEq(address(gov.token()), address(nft));
    }

    /*//////////////////////////////////////////////////////////////
                    MANIFESTO UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setManifesto_UpdatesManifestoSuccessfully() public {
        string memory newManifesto = "QmNewManifestoCID";

        vm.expectEmit(true, true, false, true);
        emit Gov.ManifestoUpdated("QmInitialManifestoCID", newManifesto);

        vm.prank(address(gov));
        gov.setManifesto(newManifesto);

        assertEq(gov.manifesto(), newManifesto);
    }

    function test_setManifesto_RevertsWhen_CalledByNonGovernance() public asUser(alice) {
        vm.expectRevert();
        gov.setManifesto("QmNewManifestoCID");
    }

    /*//////////////////////////////////////////////////////////////
                    VOTING DELAY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setVotingDelay_UpdatesDelaySuccessfully() public {
        uint48 newDelay = 200;
        uint256 oldDelay = gov.votingDelay();

        vm.expectEmit(true, false, false, true);
        emit Gov.GovernanceParameterUpdated(Gov.OperationType.UPDATE_VOTING_DELAY, oldDelay, newDelay);

        vm.prank(address(gov));
        gov.setVotingDelay(newDelay);

        assertEq(gov.votingDelay(), newDelay);
    }

    function test_setVotingDelay_RevertsWhen_CalledByNonGovernance() public asUser(alice) {
        vm.expectRevert();
        gov.setVotingDelay(200);
    }

    /*//////////////////////////////////////////////////////////////
                    VOTING PERIOD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setVotingPeriod_UpdatesPeriodSuccessfully() public {
        uint32 newPeriod = 1000;
        uint256 oldPeriod = gov.votingPeriod();

        vm.expectEmit(true, false, false, true);
        emit Gov.GovernanceParameterUpdated(Gov.OperationType.UPDATE_VOTING_PERIOD, oldPeriod, newPeriod);

        vm.prank(address(gov));
        gov.setVotingPeriod(newPeriod);

        assertEq(gov.votingPeriod(), newPeriod);
    }

    function test_setVotingPeriod_RevertsWhen_CalledByNonGovernance() public asUser(alice) {
        vm.expectRevert();
        gov.setVotingPeriod(1000);
    }

    /*//////////////////////////////////////////////////////////////
                PROPOSAL THRESHOLD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_setProposalThreshold_UpdatesThresholdSuccessfully() public {
        uint256 newThreshold = 5;
        uint256 oldThreshold = gov.proposalThreshold();

        vm.expectEmit(true, false, false, true);
        emit Gov.GovernanceParameterUpdated(Gov.OperationType.UPDATE_PROPOSAL_THRESHOLD, oldThreshold, newThreshold);

        vm.prank(address(gov));
        gov.setProposalThreshold(newThreshold);

        assertEq(gov.proposalThreshold(), newThreshold);
    }

    function test_setProposalThreshold_RevertsWhen_CalledByNonGovernance() public asUser(alice) {
        vm.expectRevert();
        gov.setProposalThreshold(5);
    }

    /*//////////////////////////////////////////////////////////////
                    QUORUM UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_updateQuorumNumerator_UpdatesQuorumSuccessfully() public {
        uint256 newQuorum = 10;
        uint256 oldQuorum = gov.quorumNumerator();

        vm.expectEmit(true, false, false, true);
        emit Gov.GovernanceParameterUpdated(Gov.OperationType.UPDATE_QUORUM, oldQuorum, newQuorum);

        vm.prank(address(gov));
        gov.updateQuorumNumerator(newQuorum);

        assertEq(gov.quorumNumerator(), newQuorum);
    }

    function test_updateQuorumNumerator_RevertsWhen_CalledByNonGovernance() public asUser(alice) {
        vm.expectRevert();
        gov.updateQuorumNumerator(10);
    }

    /*//////////////////////////////////////////////////////////////
                    PROPOSAL CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_propose_CreatesProposalSuccessfully() public {
        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceBlocks(1);

        // Create proposal
        _setupBasicProposal();

        vm.prank(alice);
        uint256 proposalId = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        assertGt(proposalId, 0);
        assertEq(uint8(gov.state(proposalId)), uint8(IGovernor.ProposalState.Pending));
    }

    function test_propose_TracksProposalId() public {
        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceBlocks(1);

        // Create proposal
        _setupBasicProposal();

        vm.prank(alice);
        uint256 proposalId = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        assertEq(gov.proposalIds(0), proposalId);
        assertEq(gov.proposalCount(), 1);
    }

    function test_propose_RevertsWhen_BelowThreshold() public {
        // Set threshold higher than alice's votes
        vm.prank(address(gov));
        gov.setProposalThreshold(5);

        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceBlocks(1);

        // Try to create proposal
        _setupBasicProposal();

        vm.prank(alice);
        vm.expectRevert();
        gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);
    }

    /*//////////////////////////////////////////////////////////////
                    VOTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_castVote_VotesSuccessfully() public {
        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceTime(1);

        // Create proposal
        _setupBasicProposal();
        vm.prank(alice);
        uint256 proposalId = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        // Advance to active state
        advanceTime(DEFAULT_VOTING_DELAY + 1);

        // Vote
        vm.prank(alice);
        gov.castVote(proposalId, 1); // Vote "For"

        assertEq(gov.hasVoted(proposalId, alice), true);
    }

    function test_castVote_RevertsWhen_VotingNotActive() public {
        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceBlocks(1);

        // Create proposal
        _setupBasicProposal();
        vm.prank(alice);
        uint256 proposalId = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        // Try to vote before voting starts
        vm.prank(alice);
        vm.expectRevert();
        gov.castVote(proposalId, 1);
    }

    /*//////////////////////////////////////////////////////////////
                    QUORUM CALCULATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_quorum_HasCorrectNumerator() public view {
        // Verify quorum numerator is set correctly
        assertEq(gov.quorumNumerator(), DEFAULT_QUORUM_NUMERATOR);
    }

    function test_quorum_NumeratorUpdates() public {
        uint256 initialNumerator = gov.quorumNumerator();
        assertEq(initialNumerator, DEFAULT_QUORUM_NUMERATOR);

        // Update quorum to 50%
        uint256 newQuorum = 50;
        vm.prank(address(gov));
        gov.updateQuorumNumerator(newQuorum);

        // Verify numerator updated
        assertEq(gov.quorumNumerator(), newQuorum, "Quorum numerator should update");
        assertTrue(gov.quorumNumerator() > initialNumerator, "New quorum should be higher");
    }

    function test_quorum_CalculatesCorrectly() public {
        // Setup delegation to ensure voting power is checkpointed
        vm.prank(alice);
        nft.delegate(alice);
        vm.prank(bob);
        nft.delegate(bob);

        // Advance time to create a checkpoint
        advanceTime(1);

        // Test quorum calculation at a past timestamp
        // With 2 members and 4% quorum numerator
        uint256 quorumValue = gov.quorum(block.timestamp - 1);

        // Quorum should be 4% of 2 = 0.08, which rounds down to 0
        // But the function should execute without reverting
        assertEq(quorumValue, 0);
    }

    /*//////////////////////////////////////////////////////////////
                    PROPOSAL TRACKING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_proposalCount_StartsAtZero() public view {
        assertEq(gov.proposalCount(), 0);
    }

    function test_proposalCount_IncrementsCorrectly() public {
        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceBlocks(1);

        // Create first proposal
        _setupBasicProposal();
        vm.prank(alice);
        gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);
        assertEq(gov.proposalCount(), 1);

        // Create second proposal
        proposalDescription = "Second proposal";
        vm.prank(alice);
        gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);
        assertEq(gov.proposalCount(), 2);
    }

    function test_proposalIds_ReturnsAllProposalIds() public {
        // Setup delegation
        vm.prank(alice);
        nft.delegate(alice);
        advanceBlocks(1);

        // Create first proposal
        _setupBasicProposal();
        vm.prank(alice);
        uint256 proposalId1 = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        // Create second proposal
        proposalDescription = "Second proposal";
        vm.prank(alice);
        uint256 proposalId2 = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        // Get all proposal IDs
        uint256[] memory ids = gov.proposalIds();
        assertEq(ids.length, 2);
        assertEq(ids[0], proposalId1);
        assertEq(ids[1], proposalId2);
    }

    /*//////////////////////////////////////////////////////////////
                    PROPOSAL EXECUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_execute_ExecutesProposalSuccessfully() public {
        // Setup delegation for alice and bob
        vm.prank(alice);
        nft.delegate(alice);
        vm.prank(bob);
        nft.delegate(bob);
        advanceTime(1);

        // Create proposal
        _setupBasicProposal();
        vm.prank(alice);
        uint256 proposalId = gov.propose(proposalTargets, proposalValues, proposalCalldatas, proposalDescription);

        // Advance to active state
        advanceTime(DEFAULT_VOTING_DELAY + 1);

        // Both vote "For"
        vm.prank(alice);
        gov.castVote(proposalId, 1);
        vm.prank(bob);
        gov.castVote(proposalId, 1);

        // Advance past voting period
        advanceTime(DEFAULT_VOTING_PERIOD + 1);

        // Execute
        gov.execute(proposalTargets, proposalValues, proposalCalldatas, keccak256(bytes(proposalDescription)));

        // Verify state
        assertEq(uint8(gov.state(proposalId)), uint8(IGovernor.ProposalState.Executed));
        assertEq(gov.manifesto(), "QmNewManifestoCID");
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setupBasicProposal() internal {
        proposalTargets = new address[](1);
        proposalTargets[0] = address(gov);

        proposalValues = new uint256[](1);
        proposalValues[0] = 0;

        proposalCalldatas = new bytes[](1);
        proposalCalldatas[0] = abi.encodeWithSignature("setManifesto(string)", "QmNewManifestoCID");

        proposalDescription = "Update manifesto to new version";
    }
}
