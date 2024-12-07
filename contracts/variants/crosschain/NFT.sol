// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
import "./ProofHandler.sol";

/**
 * @title Cross-chain Membership NFT Contract
 * @author Web3 Hackers Collective
 * @notice Non-transferable NFT implementation for DAO membership with cross-chain capabilities
 * @dev Extends OpenZeppelin's NFT standards with cross-chain operation support and delegation
 * @custom:security-contact julien@strat.cc
 */
contract NFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    EIP712,
    ERC721Votes
{
    using ProofHandler for ProofHandler.ProofStorage;

    /// @notice Chain ID where contract was originally deployed
    uint256 public immutable home;

    /// @notice Next token ID to be minted
    uint256 private _nextTokenId;

    /// @notice Storage for proof handling
    ProofHandler.ProofStorage private _proofStorage;

    /// @notice Types of operations that can be synchronized across chains
    enum OperationType {
        MINT,
        BURN,
        SET_METADATA,
        DELEGATE
    }

    /// @notice Emitted when a membership is claimed
    /// @param tokenId The ID of the claimed token
    /// @param member The address receiving the membership
    /// @param nonce Operation sequence number
    event MembershipClaimed(uint256 indexed tokenId, address indexed member, uint256 nonce);

    /// @notice Emitted when a membership is revoked
    /// @param tokenId The ID of the revoked token
    /// @param member The address losing membership
    /// @param nonce Operation sequence number
    event MembershipRevoked(uint256 indexed tokenId, address indexed member, uint256 nonce);

    /// @notice Emitted when metadata is updated
    /// @param tokenId The ID of the updated token
    /// @param newUri The new metadata URI
    /// @param nonce Operation sequence number
    event MetadataUpdated(uint256 indexed tokenId, string newUri, uint256 nonce);

    /// @notice Emitted when delegation is synchronized across chains
    /// @param delegator The address delegating their voting power
    /// @param delegatee The address receiving the delegation
    /// @param nonce Operation sequence number
    event DelegationSynced(address indexed delegator, address indexed delegatee, uint256 nonce);

    /// @notice Restricts functions to home chain
    modifier onlyHomeChain() {
        require(block.chainid == home, "Operation only allowed on home chain");
        _;
    }

    /**
     * @notice Initializes the NFT contract
     * @param _home Chain ID where contract is considered home
     * @param initialOwner Initial contract owner
     * @param _firstMembers Array of initial member addresses
     * @param _uri Initial token URI
     * @param _name Token collection name
     * @param _symbol Token collection symbol
     */
    constructor(
        uint256 _home,
        address initialOwner,
        address[] memory _firstMembers,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(initialOwner) EIP712(_name, "1") {
        home = _home;
        for (uint i; i < _firstMembers.length; i++) {
            _govMint(_firstMembers[i], _uri);
        }
    }

    /// @notice Adds a new member to the DAO
    /// @dev Mints a new NFT to the specified address
    /// @param to The address of the new member
    /// @param uri The metadata URI for the new NFT
    function safeMint(address to, string memory uri) public onlyOwner onlyHomeChain {
        _govMint(to, uri);
    }

    /**
     * @notice Burns token on home chain
     * @dev Only callable by owner (governance) on home chain
     * @param tokenId ID of token to burn
     */
    function govBurn(uint256 tokenId) public onlyOwner onlyHomeChain {
        uint256 nonce = _proofStorage.incrementNonce(uint8(OperationType.BURN));
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit MembershipRevoked(tokenId, owner, nonce);
    }

    /**
     * @notice Updates token metadata on home chain
     * @dev Only callable by owner (governance) on home chain
     * @param tokenId ID of token to update
     * @param uri New metadata URI
     */
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner onlyHomeChain {
        uint256 nonce = _proofStorage.incrementNonce(uint8(OperationType.SET_METADATA));
        _setTokenURI(tokenId, uri);
        emit MetadataUpdated(tokenId, uri, nonce);
    }

    /**
     * @notice Delegates voting power to another address on home chain
     * @dev Overrides ERC721Votes delegate function to add cross-chain functionality
     * @param delegatee Address to delegate voting power to
     */
    function delegate(address delegatee) public virtual override onlyHomeChain {
        uint256 nonce = _proofStorage.incrementNonce(uint8(OperationType.DELEGATE));
        _delegate(_msgSender(), delegatee);
        emit DelegationSynced(_msgSender(), delegatee, nonce);
    }

    /**
     * @notice Generates proof for NFT operations
     * @dev Only callable on home chain
     * @param operationType Type of operation
     * @param params Operation parameters
     * @return Encoded proof data
     */
    function generateOperationProof(
        uint8 operationType,
        bytes memory params
    ) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs only generated on home chain");
        uint256 nextNonce = _proofStorage.getNextNonce(operationType);
        return ProofHandler.generateProof(address(this), operationType, params, nextNonce);
    }

    // Claim operations

    /**
     * @notice Claims an NFT operation on a foreign chain
     * @param proof Proof generated by home chain
     */
    function claimOperation(bytes memory proof) external {
        (uint8 operationType, bytes memory params, uint256 nonce) = ProofHandler
            .verifyAndClaimProof(proof, address(this), _proofStorage);

        if (operationType == uint8(OperationType.MINT)) {
            (uint256 tokenId, address owner, string memory uri) = abi.decode(
                params,
                (uint256, address, string)
            );

            try this.ownerOf(tokenId) returns (address) {
                revert("Token already exists");
            } catch {
                _govMint(owner, uri);
                emit MembershipClaimed(_nextTokenId - 1, owner, nonce);
            }
        } else if (operationType == uint8(OperationType.BURN)) {
            uint256 tokenId = abi.decode(params, (uint256));
            address owner = ownerOf(tokenId);
            _burn(tokenId);
            emit MembershipRevoked(tokenId, owner, nonce);
        } else if (operationType == uint8(OperationType.SET_METADATA)) {
            (uint256 tokenId, string memory uri) = abi.decode(params, (uint256, string));
            _setTokenURI(tokenId, uri);
            emit MetadataUpdated(tokenId, uri, nonce);
        } else if (operationType == uint8(OperationType.DELEGATE)) {
            (address delegator, address delegatee) = abi.decode(params, (address, address));
            _delegate(delegator, delegatee);
            emit DelegationSynced(delegator, delegatee, nonce);
        }
    }

    /**
     * @notice Internal function for minting without proof verification
     * @param to Address to receive token
     * @param uri Token metadata URI
     */
    function _govMint(address to, string memory uri) internal {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _delegate(to, to);
    }

    // Required overrides

    /**
     * @notice Updates token data
     * @dev Overrides ERC721 _update to make NFTs non-transferable
     * @param to Recipient address
     * @param tokenId Token ID
     * @param auth Address authorized for transfer
     * @return Previous owner address
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "NFT is not transferable");
        return super._update(to, tokenId, auth);
    }

    /**
     * @notice Increments account balance
     * @dev Internal override to maintain compatibility
     * @param account Account to update
     * @param value Amount to increase by
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Gets token URI
     * @param tokenId Token ID to query
     * @return URI string
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Checks interface support
     * @param interfaceId Interface identifier to check
     * @return bool True if interface is supported
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Gets current timestamp
     * @dev Used for voting snapshots
     * @return Current block timestamp
     */
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /**
     * @notice Gets clock mode description
     * @return String indicating timestamp-based voting
     */
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}
