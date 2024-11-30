// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

// NFT.sol
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

/**
 * @title Cross-chain Membership NFT Contract
 * @author Web3 Hackers Collective
 * @notice A non-transferable NFT implementation for DAO membership with cross-chain capabilities
 * @dev Extends OpenZeppelin's NFT standards with cross-chain operation support
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
    /// @notice The chain ID where the contract was originally deployed
    uint256 public immutable home;

    /// @notice Next token ID to be minted
    uint256 private _nextTokenId;

    /// @notice Tracks token existence on each chain
    mapping(uint256 => bool) public existsOnChain;

    /// @dev Operation types for cross-chain actions
    enum OperationType {
        MINT,
        BURN,
        SET_METADATA
    }

    /**
     * @notice Emitted when a membership is claimed on a new chain
     * @param tokenId The ID of the claimed token
     * @param member The address receiving the membership
     * @param claimer The address executing the claim
     */
    event MembershipClaimed(
        uint256 indexed tokenId,
        address indexed member,
        address indexed claimer
    );

    /**
     * @notice Emitted when a membership is revoked
     * @param tokenId The ID of the revoked token
     * @param member The address losing membership
     */
    event MembershipRevoked(uint256 indexed tokenId, address indexed member);

    /**
     * @notice Emitted when a token's metadata is updated
     * @param tokenId The ID of the updated token
     * @param newUri The new metadata URI
     */
    event MetadataUpdated(uint256 indexed tokenId, string newUri);

    /**
     * @notice Restricts operations to the home chain
     */
    modifier onlyHomeChain() {
        require(block.chainid == home, "Operation only allowed on home chain");
        _;
    }

    /**
     * @notice Initializes the NFT contract with initial members
     * @dev Sets up ERC721 parameters and mints initial tokens
     * @param _home The chain ID where this contract is considered home
     * @param initialOwner The initial contract owner (typically governance)
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
            _mint(_firstMembers[i], _uri);
        }
    }

    // Home Chain Operations

    /**
     * @notice Mints a new membership token
     * @dev Only callable by owner on home chain
     * @param to Recipient address
     * @param uri Token metadata URI
     */
    function safeMint(address to, string memory uri) public onlyOwner onlyHomeChain {
        _mint(to, uri);
    }

    /**
     * @notice Revokes a membership
     * @dev Only callable by owner on home chain
     * @param tokenId ID of token to burn
     */
    function govBurn(uint256 tokenId) public onlyOwner onlyHomeChain {
        _govBurn(tokenId);
    }

    /**
     * @notice Updates a token's metadata
     * @dev Only callable by owner on home chain
     * @param tokenId ID of token to update
     * @param uri New metadata URI
     */
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner onlyHomeChain {
        _setMetada(tokenId, uri);
    }

    // Cross-chain Operation Proofs

    /**
     * @notice Generates proof for cross-chain minting
     * @param tokenId ID of token
     * @return Encoded proof data
     */
    function generateMintProof(uint256 tokenId) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs can only be generated on home chain");
        address to = ownerOf(tokenId);
        string memory uri = tokenURI(tokenId);

        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.MINT), tokenId, to, uri)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));

        return abi.encode(tokenId, to, uri, digest);
    }

    /**
     * @notice Generates proof for cross-chain burning
     * @param tokenId ID of token to burn
     * @return Encoded proof data
     */
    function generateBurnProof(uint256 tokenId) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs can only be generated on home chain");
        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.BURN), tokenId)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        return abi.encode(tokenId, digest);
    }

    /**
     * @notice Generates proof for cross-chain metadata updates
     * @param tokenId Token ID to update
     * @param uri New metadata URI
     * @return Encoded proof data
     */
    function generateMetadataProof(
        uint256 tokenId,
        string memory uri
    ) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs can only be generated on home chain");
        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.SET_METADATA), tokenId, uri)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        return abi.encode(tokenId, uri, digest);
    }

    /**
     * @notice Claims a membership on a foreign chain
     * @param proof Proof generated on home chain
     */
    function claimMint(bytes memory proof) external {
        (uint256 tokenId, address to, string memory uri, bytes32 digest) = abi.decode(
            proof,
            (uint256, address, string, bytes32)
        );

        require(!existsOnChain[tokenId], "Token already exists on this chain");

        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.MINT), tokenId, to, uri)
        );
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid mint proof");

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;

        emit MembershipClaimed(tokenId, to, msg.sender);
    }

    /**
     * @notice Claims a burn operation on a foreign chain
     * @param proof Proof generated on home chain
     */
    function claimBurn(bytes memory proof) external {
        (uint256 tokenId, bytes32 digest) = abi.decode(proof, (uint256, bytes32));

        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.BURN), tokenId)
        );
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid burn proof");

        address owner = ownerOf(tokenId);
        _update(address(0), tokenId, owner);
        existsOnChain[tokenId] = false;

        emit MembershipRevoked(tokenId, owner);
    }

    /**
     * @notice Claims a metadata update on a foreign chain
     * @param proof Proof generated on home chain
     */
    function claimMetadataUpdate(bytes memory proof) external {
        (uint256 tokenId, string memory uri, bytes32 digest) = abi.decode(
            proof,
            (uint256, string, bytes32)
        );

        bytes32 message = keccak256(
            abi.encodePacked(address(this), uint8(OperationType.SET_METADATA), tokenId, uri)
        );
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid metadata proof");

        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;
        emit MetadataUpdated(tokenId, uri);
    }

    // Internal Functions

    function _mint(address to, string memory uri) private {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;
    }

    function _govBurn(uint256 tokenId) private {
        address owner = ownerOf(tokenId);
        _update(address(0), tokenId, owner);
        existsOnChain[tokenId] = false;
        emit MembershipRevoked(tokenId, owner);
    }

    function _setMetada(uint256 tokenId, string memory uri) private {
        _setTokenURI(tokenId, uri);
        emit MetadataUpdated(tokenId, uri);
    }

    // Required Overrides

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "NFT is not transferable");
        return super._update(to, tokenId, auth);
    }

    /// @notice Increases an account's token balance
    /// @dev Internal function required by inherited contracts
    /// @param account Address to increase balance for
    /// @param value Amount to increase by
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /// @notice Gets the token URI
    /// @param tokenId ID of the token
    /// @return URI string for the token metadata
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}
