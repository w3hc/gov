// Gov.sol
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/**
 * @title Cross-chain Governance Contract
 * @author Web3 Hackers Collective
 * @notice Implements DAO governance with cross-chain support
 * @dev Extends OpenZeppelin Governor with cross-chain manifesto updates
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

    /// @notice CID of the DAO's manifesto
    string public manifesto;

    /// @dev Operation types for cross-chain actions
    enum OperationType {
        SET_MANIFESTO
    }

    /**
     * @notice Emitted when the manifesto is updated
     * @param oldManifesto Previous manifesto CID
     * @param newManifesto New manifesto CID
     */
    event ManifestoUpdated(string oldManifesto, string newManifesto);

    /**
     * @notice Restricts operations to the home chain
     */
    modifier onlyHomeChain() {
        require(block.chainid == home, "Operation only allowed on home chain");
        _;
    }

    /**
     * @notice Initializes the governance contract
     * @param _home Chain ID where this contract is considered home
     * @param _token The voting token contract
     * @param _manifesto Initial manifesto CID
     * @param _name Name of the governance contract
     * @param _votingDelay Time before voting begins
     * @param _votingPeriod Duration of voting
     * @param _votingThreshold Minimum votes needed for proposal
     * @param _quorum Minimum participation percentage
     */
    constructor(
        uint256 _home,
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
        home = _home;
        manifesto = _manifesto;
    }

    /**
     * @notice Updates the manifesto CID on home chain
     * @dev Only callable through governance on home chain
     * @param newManifesto New manifesto CID
     */
    function setManifesto(string memory newManifesto) public onlyGovernance onlyHomeChain {
        _setManifestoOriginal(newManifesto);
    }

    /**
     * @notice Generates proof for cross-chain manifesto updates
     * @param newManifesto New manifesto CID
     * @return Encoded proof data
     */
    function generateManifestoProof(
        string memory newManifesto
    ) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs can only be generated on home chain");
        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.SET_MANIFESTO), newManifesto)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        return abi.encode(newManifesto, digest);
    }

    /**
     * @notice Claims a manifesto update on a foreign chain
     * @param proof Proof generated on home chain
     */
    function claimManifestoUpdate(bytes memory proof) external {
        (string memory newManifesto, bytes32 digest) = abi.decode(proof, (string, bytes32));

        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.SET_MANIFESTO), newManifesto)
        );
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid manifesto proof");

        _setManifestoOriginal(newManifesto);
    }

    /**
     * @notice Internal function to update manifesto
     * @param newManifesto New manifesto CID
     */
    function _setManifestoOriginal(string memory newManifesto) private {
        string memory oldManifesto = manifesto;
        manifesto = newManifesto;
        emit ManifestoUpdated(oldManifesto, newManifesto);
    }

    // Required Governor Overrides

    /**
     * @notice Returns the voting delay
     * @return Delay before voting starts
     */
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /**
     * @notice Returns the voting period duration
     * @return Duration of the voting period
     */
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /**
     * @notice Returns the quorum requirement
     * @param blockNumber Block number to check quorum for
     * @return Required number of votes for quorum
     */
    function quorum(
        uint256 blockNumber
    ) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    /**
     * @notice Returns the proposal threshold
     * @return Minimum votes needed to create a proposal
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
