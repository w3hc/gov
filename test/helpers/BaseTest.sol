// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

/**
 * @title BaseTest
 * @notice Base test contract with common setup and utilities
 * @dev All test contracts should inherit from this for consistency
 */
abstract contract BaseTest is Test {
    /*//////////////////////////////////////////////////////////////
                            TEST ACCOUNTS
    //////////////////////////////////////////////////////////////*/

    address internal deployer;
    address internal alice;
    address internal bob;
    address internal charlie;
    address internal dave;
    address internal attacker;

    /*//////////////////////////////////////////////////////////////
                        GOVERNANCE PARAMETERS
    //////////////////////////////////////////////////////////////*/

    uint48 internal constant DEFAULT_VOTING_DELAY = 1;
    uint32 internal constant DEFAULT_VOTING_PERIOD = 30;
    uint256 internal constant DEFAULT_PROPOSAL_THRESHOLD = 0;
    uint256 internal constant DEFAULT_QUORUM_NUMERATOR = 4;

    /*//////////////////////////////////////////////////////////////
                            SETUP HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets up standard test accounts
     * @dev Call this in your setUp() function
     */
    function setUpAccounts() internal {
        deployer = makeAddr("deployer");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        dave = makeAddr("dave");
        attacker = makeAddr("attacker");
    }

    /**
     * @notice Labels contracts and accounts for better trace readability
     * @param gov Address of the governance contract
     * @param nft Address of the NFT contract
     */
    function labelContracts(address gov, address nft) internal {
        vm.label(gov, "Gov");
        vm.label(nft, "NFT");
        vm.label(deployer, "Deployer");
        vm.label(alice, "Alice");
        vm.label(bob, "Bob");
        vm.label(charlie, "Charlie");
        vm.label(dave, "Dave");
        vm.label(attacker, "Attacker");
    }

    /**
     * @notice Creates an array of initial member addresses
     * @param count Number of members to include
     * @return members Array of member addresses
     */
    function createInitialMembers(uint256 count) internal view returns (address[] memory) {
        require(count <= 4, "Max 4 initial members in base test");

        address[] memory members = new address[](count);
        if (count >= 1) members[0] = alice;
        if (count >= 2) members[1] = bob;
        if (count >= 3) members[2] = charlie;
        if (count >= 4) members[3] = dave;

        return members;
    }

    /*//////////////////////////////////////////////////////////////
                        ASSERTION HELPERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Asserts that an address is not zero
     * @param addr Address to check
     * @param message Error message if assertion fails
     */
    function assertNotZeroAddress(address addr, string memory message) internal pure {
        assertTrue(addr != address(0), message);
    }

    /**
     * @notice Asserts that a string is not empty
     * @param str String to check
     * @param message Error message if assertion fails
     */
    function assertNotEmptyString(string memory str, string memory message) internal pure {
        assertTrue(bytes(str).length > 0, message);
    }

    /*//////////////////////////////////////////////////////////////
                        UTILITY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Advances the blockchain by a specified number of blocks
     * @param blocks Number of blocks to advance
     */
    function advanceBlocks(uint256 blocks) internal {
        vm.roll(block.number + blocks);
    }

    /**
     * @notice Advances time by a specified duration
     * @param duration Time to advance in seconds
     */
    function advanceTime(uint256 duration) internal {
        vm.warp(block.timestamp + duration);
    }

    /**
     * @notice Logs a separator for better test output readability
     * @param title Title of the section
     */
    function logSection(string memory title) internal pure {
        console.log("");
        console.log("===========================================");
        console.log(title);
        console.log("===========================================");
    }

    /*//////////////////////////////////////////////////////////////
                        MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Modifier to run test as a specific user
     * @param user Address to prank
     */
    modifier asUser(address user) {
        vm.startPrank(user);
        _;
        vm.stopPrank();
    }
}
