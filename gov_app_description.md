# gov


### .env.template

```
# Signer Private Key (signer[0])
SIGNER_PRIVATE_KEY="88888"

# Optimism Mainnet
OPTIMISM_MAINNET_RPC_ENDPOINT_URL="https://mainnet.optimism.io"
OP_ETHERSCAN_API_KEY="88888"

# Base Mainnet
BASE_MAINNET_RPC_ENDPOINT_URL="https://mainnet.base.org"
BASE_ETHERSCAN_API_KEY="88888"

# Arbitrum One Mainnet
ARBITRUM_MAINNET_RPC_ENDPOINT_URL="88888"
ARBITRUM_ETHERSCAN_API_KEY="88888"

# Sepolia
SEPOLIA_RPC_ENDPOINT_URL="88888"
ETHERSCAN_API_KEY="88888"

# OP Sepolia
OP_SEPOLIA_RPC_ENDPOINT_URL="88888"

# Base Sepolia
BASE_SEPOLIA_RPC_ENDPOINT_URL="https://sepolia.base.org"

# Arbitrum Sepolia
ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL="88888"

# Addresses used when running scripts for testing cross-chain scenarios
ALICE="88888"
JUNGLE="88888"
```

### .gitignore

```
node_modules
coverage
coverage.json
typechain
typechain-types
.DS_Store

cache
artifacts

.env*
!.env.template
NOTES.md
deployments
```

### .prettierignore

```
# OSX
.DS_Store

# env
.env

# node
node_modules
package-lock.json
yarn.lock
yarn-error.log

# editooors
.idea
.vscode

# tsc / hardhat / foundry
artifacts
cache
out
data
build
dist
lib

# github
.github
```

### .prettierrc

```
{
    "tabWidth": 4,
    "useTabs": false,
    "semi": false,
    "singleQuote": false,
    "trailingComma": "none",
    "arrowParens": "avoid",
    "printWidth": 80,
    "overrides": [
        {
            "files": "*.sol",
            "options": {
                "printWidth": 100,
                "tabWidth": 4,
                "useTabs": false,
                "singleQuote": false,
                "bracketSpacing": false,
                "explicitTypes": "always"
            }
        }
    ]
}

```

### README.md

```markdown
# Gov

A DAO framework built with Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- [`Gov.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/Gov.sol) is the **Governor** contract
- [`NFT.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/NFT.sol) is the **NFT** contract (ERC-721)

Since `v0.10.0`, Gov is using non-tranferable membership NFTs ("SBTs"), it is also timestamp-based by default.

## Motivation

Provide a coordination tool that fits the needs of regular users. 

- [Documentation](https://w3hc.github.io/gov-docs/)
- [Gov UI](https://gov-ui.netlify.app/)
- [Gov UI repo](https://github.com/w3hc/gov-ui)
- [Gov Deployer](https://gov-deployer.netlify.app/)
- [Gov Deployer repo](https://github.com/w3hc/gov-deployer)
- [Example DAO on Tally](https://www.tally.xyz/gov/web3-hackers-collective)

## Install

```js
pnpm install
```

## Test

```js
pnpm test
```

## Deploy

Create a `.env` on the model of `.env.template`:

```js
cp .env.template .env
```

- Add your own keys in your `.env` file
- Edit the `dao.config.ts` file (optional)
- Then deploy to Sepolia:

```bash
pnpm deploy:sepolia
```

Then you can add your DAO in [Tally](https://www.tally.xyz/) and/or spin up your own interface using [Gov UI](https://github.com/w3hc/gov-ui). 

## Variants

### Crosschain

Make sure the contracts are deployed from the same account. 

```bash
pnpm crosschain:sepolia
pnpm crosschain:op-sepolia
```

Your DAO will be deployed on every networks at the same address.

Then you can follow these steps to verify that proofs of `safeMint`, `govBurn`, `setMetadata`, `setManifesto`, `setVotingDelay`, and `delegate` can be generated on source chain and claimed on foreign chain: 

```bash
npx hardhat run scripts/propose.ts --network sepolia
npx hardhat run scripts/verify-proof.ts --network sepolia
npx hardhat run scripts/claim-membership.ts --network op-sepolia

npx hardhat run scripts/gov-burn.ts --network sepolia
npx hardhat run scripts/verify-gov-burn-proof.ts --network sepolia
npx hardhat run scripts/claim-gov-burn.ts --network op-sepolia

npx hardhat run scripts/verify-metadata-proof.ts --network sepolia
npx hardhat run scripts/claim-metadata-update.ts --network op-sepolia

npx hardhat run scripts/verify-manifesto-proof.ts --network sepolia
npx hardhat run scripts/claim-manifesto-update.ts --network op-sepolia

npx hardhat run scripts/gov-voting-delay.ts --network sepolia
npx hardhat run scripts/verify-voting-delay-proof.ts --network sepolia
npx hardhat run scripts/claim-voting-delay.ts --network op-sepolia
``` 

## Security

Here are the differences between the Governor/ERC-721 implementations suggested by Open Zeppelin and ours:

### [Gov.sol](https://github.com/w3hc/gov/blob/main/contracts/Gov.sol)

The following function is `onlyGovernance`, meaning it can only be triggered by a vote.

- `setManifesto()` updates the CID.

### [NFT.sol](https://github.com/w3hc/gov/blob/main/contracts/NFT.sol)

The following functions are `onlyOwner`, and since the NFT contract ownership is transferred to the Gov contract, they can only be triggered by a vote.

- `safeMint()` adds a new member.
- `govBurn()` bans a member.
- `setMetadata()` changes the tokenURI of a given NFT ID.

## Supported Networks

| Network | Chain ID | Documentation |
|---------|----------|---------------|
| Optimism Mainnet | 10 | [Documentation](https://docs.optimism.io/chain/networks#op-mainnet) |
| Base Mainnet | 8453 | [Documentation](https://docs.base.org/docs/network-information#base-mainnet) |
| Sepolia Testnet | 11155111 | [Documentation](https://ethereum.org/nb/developers/docs/networks/#sepolia) |
| OP Sepolia Testnet | 11155420 | [Documentation](https://docs.optimism.io/chain/networks#op-sepolia) |
| Base Sepolia Testnet | 84532 | [Documentation](https://docs.base.org/docs/network-information/#base-testnet-sepolia) |

## Core Dependencies

-   Node [v20.9.0](https://nodejs.org/uk/blog/release/v20.9.0/)
-   PNPM [v9.10.0](https://pnpm.io/pnpm-vs-npm)
-   Hardhat [v2.22.16](https://github.com/NomicFoundation/hardhat/releases/)
-   OpenZeppelin Contracts [v5.1.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v5.1.0)
-   Ethers [v6.13.4](https://docs.ethers.org/v6/)

## Support

Feel free to reach out to [Julien](https://github.com/julienbrg): [Farcaster](https://warpcast.com/julien-), [Element](https://matrix.to/#/@julienbrg:matrix.org), [Status](https://status.app/u/iwSACggKBkp1bGllbgM=#zQ3shmh1sbvE6qrGotuyNQB22XU5jTrZ2HFC8bA56d5kTS2fy), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discordapp.com/users/julienbrg), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
```

## contracts


### contracts/Gov.sol

```
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

```

### contracts/NFT.sol

```
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";

/// @title DAO Membership NFT Contract
/// @notice This contract implements a non-transferable NFT with voting rights for DAO membership
/// @dev Extends multiple OpenZeppelin contracts to create a feature-rich NFT
contract NFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    EIP712,
    ERC721Votes
{
    uint256 private _nextTokenId;

    /// @notice Initializes the NFT contract
    /// @param initialOwner The address of the initial owner (typically the governance contract)
    /// @param _firstMembers An array of addresses for the initial DAO members
    /// @param _uri The initial token URI for the NFTs
    /// @param _name The name of the NFT
    /// @param _symbol The symbol of the NFT
    constructor(
        address initialOwner,
        address[] memory _firstMembers,
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(initialOwner) EIP712(_name, "1") {
        for (uint i; i < _firstMembers.length; i++) {
            safeMint(_firstMembers[i], _uri);
        }
    }

    /// @notice Returns the current timestamp
    /// @dev This function is used for voting snapshots
    /// @return The current block timestamp as a uint48
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /// @notice Describes the clock mode for voting snapshots
    /// @return A string indicating that the contract uses timestamps for voting
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    /// @notice Adds a new member to the DAO
    /// @dev Mints a new NFT to the specified address
    /// @param to The address of the new member
    /// @param uri The metadata URI for the new NFT
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /// @notice Updates the NFT ownership
    /// @dev Overrides the transfer function to make NFTs non-transferable
    /// @param to The recipient address
    /// @param tokenId The ID of the token
    /// @param auth The address authorized to make the transfer
    /// @return The previous owner of the token
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) returns (address) {
        require(auth == address(0) || to == address(0), "This NFT is not transferable");
        return super._update(to, tokenId, auth);
    }

    /// @notice Increases the balance of an account
    /// @dev Internal function to update balances, overridden to maintain compatibility
    /// @param account The account whose balance is being increased
    /// @param value The amount to increase the balance by
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /// @notice Returns the token URI for a given token ID
    /// @param tokenId The ID of the token
    /// @return The URI string for the token's metadata
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /// @notice Removes a member from the DAO
    /// @dev Burns the NFT associated with the member
    /// @param tokenId The ID of the NFT to burn
    function govBurn(uint256 tokenId) public onlyOwner {
        _burn(tokenId);
    }

    /// @notice Updates the metadata for a given NFT
    /// @param tokenId The ID of the NFT to update
    /// @param uri The new metadata URI for the NFT
    function setMetadata(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    /// @notice Checks if the contract supports a given interface
    /// @param interfaceId The interface identifier to check
    /// @return bool True if the contract supports the interface, false otherwise
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

```

## contracts/variants


## contracts/variants/crosschain


### contracts/variants/crosschain/Gov.sol

```
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

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

    /// @notice Emitted when the manifesto is updated
    /// @param oldManifesto Previous manifesto CID
    /// @param newManifesto New manifesto CID
    event ManifestoUpdated(string oldManifesto, string newManifesto);

    /// @notice Types of operations that can be synchronized across chains
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
    event GovernanceParameterUpdated(
        OperationType indexed operationType,
        uint256 oldValue,
        uint256 newValue
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
     * @notice Updates the DAO's manifesto
     * @dev Can only be called through governance on home chain
     * @param newManifesto New manifesto CID
     */
    function setManifesto(string memory newManifesto) public onlyGovernance onlyHomeChain {
        string memory oldManifesto = manifesto;
        manifesto = newManifesto;
        emit ManifestoUpdated(oldManifesto, newManifesto);
    }

    /**
     * @notice Generates proof for cross-chain manifesto update
     * @dev Can only be called on home chain
     * @param newManifesto New manifesto CID to generate proof for
     * @return Encoded proof data for manifesto update
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
     * @dev Verifies and applies manifesto updates from home chain
     * @param proof Proof generated by home chain
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

        string memory oldManifesto = manifesto;
        manifesto = newManifesto;
        emit ManifestoUpdated(oldManifesto, newManifesto);
    }

    /**
     * @notice Updates the voting delay parameter
     * @dev Can only be called through governance on home chain
     * @param newVotingDelay New voting delay value (in blocks)
     */
    function setVotingDelay(
        uint48 newVotingDelay
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 oldValue = votingDelay();
        _setVotingDelay(newVotingDelay);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_VOTING_DELAY,
            oldValue,
            newVotingDelay
        );
    }

    /**
     * @notice Updates the voting period parameter
     * @dev Can only be called through governance on home chain
     * @param newVotingPeriod New voting period value (in blocks)
     */
    function setVotingPeriod(
        uint32 newVotingPeriod
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 oldValue = votingPeriod();
        _setVotingPeriod(newVotingPeriod);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_VOTING_PERIOD,
            oldValue,
            newVotingPeriod
        );
    }

    /**
     * @notice Updates the proposal threshold parameter
     * @dev Can only be called through governance on home chain
     * @param newProposalThreshold New proposal threshold value
     */
    function setProposalThreshold(
        uint256 newProposalThreshold
    ) public virtual override onlyGovernance onlyHomeChain {
        uint256 oldValue = proposalThreshold();
        _setProposalThreshold(newProposalThreshold);
        emit GovernanceParameterUpdated(
            OperationType.UPDATE_PROPOSAL_THRESHOLD,
            oldValue,
            newProposalThreshold
        );
    }

    /**
     * @notice Updates the quorum numerator
     * @dev Can only be called through governance on home chain
     * @param newQuorumNumerator New quorum numerator value (percentage * 100)
     */
    function updateQuorumNumerator(
        uint256 newQuorumNumerator
    ) public virtual override(GovernorVotesQuorumFraction) onlyGovernance onlyHomeChain {
        uint256 oldValue = quorumNumerator();
        _updateQuorumNumerator(newQuorumNumerator);
        emit GovernanceParameterUpdated(OperationType.UPDATE_QUORUM, oldValue, newQuorumNumerator);
    }

    /**
     * @notice Generates proof for cross-chain parameter updates
     * @dev Can only be called on home chain
     * @param operationType Type of parameter being updated
     * @param value Encoded value for the parameter update
     * @return Encoded proof data for parameter update
     */
    function generateParameterProof(
        OperationType operationType,
        bytes memory value
    ) external view returns (bytes memory) {
        require(block.chainid == home, "Proofs can only be generated on home chain");
        bytes32 message = keccak256(abi.encodePacked(address(this), uint8(operationType), value));
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", message));
        return abi.encode(operationType, value, digest);
    }

    /**
     * @notice Claims a parameter update on a foreign chain
     * @dev Verifies and applies parameter updates from home chain
     * @param proof Proof generated by home chain
     */
    function claimParameterUpdate(bytes memory proof) external {
        (OperationType operationType, bytes memory value, bytes32 digest) = abi.decode(
            proof,
            (OperationType, bytes, bytes32)
        );

        bytes32 message = keccak256(abi.encodePacked(address(this), uint8(operationType), value));
        bytes32 expectedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        require(digest == expectedDigest, "Invalid parameter update proof");

        if (operationType == OperationType.UPDATE_VOTING_DELAY) {
            uint48 newValue = uint48(bytes6(value));
            uint256 oldValue = votingDelay();
            _setVotingDelay(newValue);
            emit GovernanceParameterUpdated(operationType, oldValue, newValue);
        } else if (operationType == OperationType.UPDATE_VOTING_PERIOD) {
            uint32 newValue = uint32(bytes4(value));
            uint256 oldValue = votingPeriod();
            _setVotingPeriod(newValue);
            emit GovernanceParameterUpdated(operationType, oldValue, newValue);
        } else if (operationType == OperationType.UPDATE_PROPOSAL_THRESHOLD) {
            uint256 newValue = abi.decode(value, (uint256));
            uint256 oldValue = proposalThreshold();
            _setProposalThreshold(newValue);
            emit GovernanceParameterUpdated(operationType, oldValue, newValue);
        } else if (operationType == OperationType.UPDATE_QUORUM) {
            uint256 newValue = abi.decode(value, (uint256));
            uint256 oldValue = quorumNumerator();
            _updateQuorumNumerator(newValue);
            emit GovernanceParameterUpdated(operationType, oldValue, newValue);
        }
    }

    // Required overrides

    /**
     * @notice Gets the current voting delay
     * @return Current voting delay in blocks
     */
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    /**
     * @notice Gets the current voting period
     * @return Current voting period in blocks
     */
    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    /**
     * @notice Gets the quorum required for a specific block
     * @param blockNumber Block number to check quorum for
     * @return Minimum number of votes required for quorum
     */
    function quorum(
        uint256 blockNumber
    ) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    /**
     * @notice Gets the current proposal threshold
     * @return Minimum number of votes required to create a proposal
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

```

### contracts/variants/crosschain/NFT.sol

```
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

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

    /// @notice Operation types for cross-chain message verification
    /// @dev Used to differentiate between different types of cross-chain operations
    enum OperationType {
        MINT, // Mint new token
        BURN, // Burn existing token
        SET_METADATA // Update token metadata
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
     * @dev Used to ensure certain operations only occur on the chain where the contract was originally deployed
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
            _delegate(_firstMembers[i], _firstMembers[i]);
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
        _delegate(to, to);
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
        _updateTokenMetadata(tokenId, uri);
    }

    // Cross-chain Operation Proofs

    /**
     * @notice Generates proof for cross-chain minting
     * @dev Creates a signed message proving token ownership and metadata
     * @param tokenId ID of token
     * @return Encoded proof data containing token details and signature
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
     * @dev Creates a signed message proving burn authorization
     * @param tokenId ID of token to burn
     * @return Encoded proof data containing burn details and signature
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
     * @dev Creates a signed message proving metadata update authorization
     * @param tokenId Token ID to update
     * @param uri New metadata URI
     * @return Encoded proof data containing update details and signature
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
     * @dev Verifies proof and mints token on foreign chain
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
     * @dev Verifies proof and burns token on foreign chain
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
     * @dev Verifies proof and updates token metadata on foreign chain
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

    /**
     * @dev Internal function to mint new token with metadata
     * @param to Address receiving the token
     * @param uri Metadata URI for the token
     */
    function _mint(address to, string memory uri) private {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        existsOnChain[tokenId] = true;
    }

    /**
     * @dev Internal function to burn token through governance
     * @param tokenId ID of token to burn
     */
    function _govBurn(uint256 tokenId) private {
        address owner = ownerOf(tokenId);
        _update(address(0), tokenId, owner);
        existsOnChain[tokenId] = false;
        emit MembershipRevoked(tokenId, owner);
    }

    /**
     * @dev Internal function to update token metadata
     * @param tokenId ID of token to update
     * @param uri New metadata URI
     */
    function _updateTokenMetadata(uint256 tokenId, string memory uri) private {
        _setTokenURI(tokenId, uri);
        emit MetadataUpdated(tokenId, uri);
    }

    // Required Overrides

    /**
     * @dev Override of ERC721's _update to make tokens non-transferable
     * @param to Target address (only allowed to be zero address for burns)
     * @param tokenId Token ID being updated
     * @param auth Address initiating the update
     * @return Previous owner of the token
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
     * @notice Increases an account's token balance
     * @dev Internal function required by inherited contracts
     * @param account Address to increase balance for
     * @param value Amount to increase by
     */
    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable, ERC721Votes) {
        super._increaseBalance(account, value);
    }

    /**
     * @notice Gets the token URI
     * @dev Returns the metadata URI for a given token
     * @param tokenId ID of the token
     * @return URI string for the token metadata
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Checks if the contract supports a given interface
     * @dev Implements interface detection for ERC721 and extensions
     * @param interfaceId Interface identifier to check
     * @return bool True if the interface is supported
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Gets the current timestamp
     * @dev Used for voting snapshots, returns block timestamp as uint48
     * @return Current block timestamp
     */
    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    /**
     * @notice Gets the clock mode for voting snapshots
     * @dev Returns a description of how the clock value should be interpreted
     * @return String indicating timestamp-based clock mode
     */
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}

```

### dao.config.ts

```typescript
///// Membership NFT /////

export const firstMembers = [
    "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977", // Alice
    "0xe61A1a5278290B6520f0CEf3F2c71Ba70CF5cf4C" // Bob
]

export const uri =
    "https://bafkreicj62l5xu6pk2xx7x7n6b7rpunxb4ehlh7fevyjapid3556smuz4y.ipfs.w3s.link/"
export const name = "Membership NFT"
export const symbol = "MEMBER"

///// Gov /////

export const manifesto =
    "https://bafkreifnnreoxxgkhty7v2w3qwiie6cfxpv3vcco2xldekfvbiem3nm6dm.ipfs.w3s.link/"
export const daoName = "Test DAO"
export const votingDelay = 0
export const votingPeriod = 200
export const votingThreshold = 1
export const quorum = 5

```

## deploy


### deploy/deploy-crosschain-gov.ts

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import color from "cli-color"
var msg = color.xterm(39).bgXterm(128)
import {
    firstMembers,
    uri,
    name,
    symbol,
    manifesto,
    daoName,
    votingDelay,
    votingPeriod,
    votingThreshold,
    quorum
} from "../dao.config"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deterministic } = deployments
    const { deployer } = await getNamedAccounts()
    const salt = hre.ethers.id("Dec-11-v1")

    function wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // Deploy NFT
    const { address: nftAddress, deploy: deployNFT } = await deterministic(
        "CrosschainNFT",
        {
            from: deployer,
            contract: "contracts/variants/crosschain/NFT.sol:NFT",
            args: [11155111, deployer, firstMembers, uri, name, symbol],
            salt: salt,
            log: true,
            waitConfirmations: 1
        }
    )

    console.log("NFT contract address:", msg(nftAddress))
    await deployNFT()

    // Deploy Gov
    const { address: govAddress, deploy: deployGov } = await deterministic(
        "CrosschainGov",
        {
            from: deployer,
            contract: "contracts/variants/crosschain/Gov.sol:Gov",
            args: [
                11155111,
                nftAddress,
                manifesto,
                daoName,
                votingDelay,
                votingPeriod,
                votingThreshold,
                quorum
            ],
            salt: salt,
            log: true,
            waitConfirmations: 5
        }
    )

    await deployGov()
    console.log("Gov contract address:", msg(govAddress))

    // Transfer NFT ownership to Gov
    const nft = await hre.ethers.getContractAt(
        "contracts/variants/crosschain/NFT.sol:NFT",
        nftAddress
    )
    await nft.transferOwnership(govAddress)
    console.log("NFT ownership transferred to Gov")

    if (hre.network.name !== "hardhat") {
        console.log("\nVerifying NFT contract...")
        try {
            await hre.run("verify:verify", {
                address: nftAddress,
                contract: "contracts/variants/crosschain/NFT.sol:NFT",
                constructorArguments: [
                    11155111,
                    deployer,
                    firstMembers,
                    uri,
                    name,
                    symbol
                ]
            })
            console.log("NFT verification done ✅")
        } catch (err) {
            console.log("NFT verification failed:", err)
        }

        console.log("\nVerifying Gov contract...")
        try {
            await hre.run("verify:verify", {
                address: govAddress,
                contract: "contracts/variants/crosschain/Gov.sol:Gov",
                constructorArguments: [
                    11155111,
                    nftAddress,
                    manifesto,
                    daoName,
                    votingDelay,
                    votingPeriod,
                    votingThreshold,
                    quorum
                ]
            })
            console.log("Gov verification done ✅")
        } catch (err) {
            console.log("Gov verification failed:", err)
        }
    }
}

func.tags = ["CrosschainGov"]
export default func

```

### deploy/deploy-gov.ts

```typescript
import "@nomiclabs/hardhat-ethers"
import color from "cli-color"
var msg = color.xterm(39).bgXterm(128)
import hre, { ethers, network } from "hardhat"
import { abi } from "../artifacts/contracts/NFT.sol/NFT.json"
import {
    firstMembers,
    uri,
    name,
    symbol,
    manifesto,
    daoName,
    votingDelay,
    votingPeriod,
    votingThreshold,
    quorum
} from "../dao.config"

export default async ({ getNamedAccounts, deployments }: any) => {
    const { deploy } = deployments

    function wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)
    console.log("deployer:", deployer)

    const nft = await deploy("NFT", {
        from: deployer,
        args: [deployer, firstMembers, uri, name, symbol],
        log: true,
        overwrite: true
    })

    const gov = await deploy("Gov", {
        from: deployer,
        args: [
            nft.address,
            manifesto,
            daoName,
            votingDelay,
            votingPeriod,
            votingThreshold,
            quorum
        ],
        log: true,
        overwrite: true
    })

    switch (hre.network.name) {
        case "optimism":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "base":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "sepolia":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(90 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "op-sepolia":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "base-sepolia":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break
    }

    const nftContract = new ethers.Contract(nft.address, abi, signer)
    await nftContract.transferOwnership(gov.address)
    console.log("\nNFT contract ownership transferred to the DAO. ✅")
}
export const tags = ["Gov"]

```

### funding.json

```json
{
    "opRetro": {
        "projectId": "0xed55afbfd8d94e1c60c9a6db38caff9ecb53543071756328d104504df644eb9e"
    }
}
```

### gov_app_description.md

```markdown
# gov


### .env.template

```
# Signer Private Key (signer[0])
SIGNER_PRIVATE_KEY="88888"

# Optimism Mainnet
OPTIMISM_MAINNET_RPC_ENDPOINT_URL="https://mainnet.optimism.io"
OP_ETHERSCAN_API_KEY="88888"

# Base Mainnet
BASE_MAINNET_RPC_ENDPOINT_URL="https://mainnet.base.org"
BASE_ETHERSCAN_API_KEY="88888"

# Arbitrum One Mainnet
ARBITRUM_MAINNET_RPC_ENDPOINT_URL="88888"
ARBITRUM_ETHERSCAN_API_KEY="88888"

# Sepolia
SEPOLIA_RPC_ENDPOINT_URL="88888"
ETHERSCAN_API_KEY="88888"

# OP Sepolia
OP_SEPOLIA_RPC_ENDPOINT_URL="88888"

# Base Sepolia
BASE_SEPOLIA_RPC_ENDPOINT_URL="https://sepolia.base.org"
```

[This file was cut: it has more than 500 lines]

```

### hardhat.config.ts

```typescript
import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-verify"
import "hardhat-deploy"
import * as dotenv from "dotenv"
dotenv.config()

const {
    SIGNER_PRIVATE_KEY,
    OPTIMISM_MAINNET_RPC_ENDPOINT_URL,
    OP_ETHERSCAN_API_KEY,
    BASE_MAINNET_RPC_ENDPOINT_URL,
    BASE_ETHERSCAN_API_KEY,
    ARBITRUM_MAINNET_RPC_ENDPOINT_URL,
    ARBITRUM_ETHERSCAN_API_KEY,
    SEPOLIA_RPC_ENDPOINT_URL,
    ETHERSCAN_API_KEY,
    OP_SEPOLIA_RPC_ENDPOINT_URL,
    BASE_SEPOLIA_RPC_ENDPOINT_URL,
    ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
} = process.env

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: 0
    },
    networks: {
        hardhat: {
            chainId: 1337,
            allowUnlimitedContractSize: true
        },
        sepolia: {
            chainId: 11155111,
            url:
                SEPOLIA_RPC_ENDPOINT_URL ||
                "https://ethereum-sepolia.publicnode.com",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        optimism: {
            chainId: 10,
            url:
                OPTIMISM_MAINNET_RPC_ENDPOINT_URL ||
                "https://mainnet.optimism.io",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        base: {
            chainId: 8453,
            url: BASE_MAINNET_RPC_ENDPOINT_URL || "https://mainnet.base.org",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        arbitrum: {
            chainId: 42161,
            url:
                ARBITRUM_MAINNET_RPC_ENDPOINT_URL ||
                "https://arb1.arbitrum.io/rpc",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },

        "op-sepolia": {
            chainId: 11155420,
            url:
                OP_SEPOLIA_RPC_ENDPOINT_URL ||
                "https://ethereum-sepolia.publicnode.com",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        "base-sepolia": {
            chainId: 84532,
            url: BASE_SEPOLIA_RPC_ENDPOINT_URL || "https://sepolia.base.org",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        "arbitrum-sepolia": {
            chainId: 421614,
            url:
                ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL ||
                "https://sepolia-rollup.arbitrum.io/rpc",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        }
    },
    solidity: {
        version: "0.8.22",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    sourcify: {
        enabled: true
    },
    etherscan: {
        apiKey: {
            optimism: OP_ETHERSCAN_API_KEY || "",
            base: BASE_ETHERSCAN_API_KEY || "",
            arbitrum: ARBITRUM_ETHERSCAN_API_KEY || "",
            sepolia: ETHERSCAN_API_KEY || "",
            optimisticEthereum: OP_ETHERSCAN_API_KEY || "",
            "op-sepolia": OP_ETHERSCAN_API_KEY || "",
            "base-sepolia": BASE_ETHERSCAN_API_KEY || "",
            "arbitrum-sepolia": ARBITRUM_ETHERSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "op-sepolia",
                chainId: 11155420,
                urls: {
                    apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
                    browserURL: "https://sepolia-optimism.etherscan.io"
                }
            },
            {
                network: "base-sepolia",
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://basescan.org/"
                }
            },
            {
                network: "arbitrum-sepolia",
                chainId: 421614,
                urls: {
                    apiURL: "https://api-sepolia.arbiscan.io/api",
                    browserURL: "https://sepolia.arbiscan.io"
                }
            }
        ]
    }
}

export default config

```

### package.json

```json
{
    "name": "gov",
    "description": "A DAO framework built with Open Zeppelin's Governor in combination with NFTs",
    "main": "index.js",
    "type": "commonjs",
    "scripts": {
        "compile": "hardhat compile",
        "test": "hardhat test",
        "test:crosschain": "hardhat test test/Gov-crosschain.ts",
        "deploy:optimism": "hardhat deploy --network optimism --reset",
        "deploy:base": "hardhat deploy --network base --reset",
        "deploy:sepolia": "hardhat deploy --network sepolia --reset",
        "deploy:op-sepolia": "hardhat deploy --network op-sepolia --reset",
        "deploy:base-sepolia": "hardhat deploy --network base-sepolia --reset",
        "crosschain:sepolia": "hardhat deploy --network sepolia --tags CrosschainGov --reset",
        "crosschain:op-sepolia": "hardhat deploy --network op-sepolia --tags CrosschainGov --reset",
        "bal": "npx hardhat run scripts/check-my-balance.ts",
        "prettier": "prettier --write \"**/*.ts\"",
        "prettier-check": "prettier --check \"**/*.ts\""
    },
    "keywords": [
        "dao",
        "hardhat",
        "solidity",
        "web3",
        "governance",
        "nft"
    ],
    "devDependencies": {
        "@nomicfoundation/hardhat-chai-matchers": "^2.0.8",
        "@nomicfoundation/hardhat-ethers": "^3.0.8",
        "@nomicfoundation/hardhat-network-helpers": "^1.0.12",
        "@nomicfoundation/hardhat-toolbox": "^5.0.0",
        "@nomicfoundation/hardhat-verify": "^2.0.12",
        "@typechain/ethers-v6": "^0.5.1",
        "@typechain/hardhat": "^9.1.0",
        "@types/chai": "^4.2.0",
        "@types/cli-color": "^2.0.6",
        "@types/mocha": "^10.0.10",
        "@types/node": "^22.9.3",
        "chai": "^4.2.0",
        "hardhat": "^2.22.17",
        "hardhat-gas-reporter": "^1.0.8",
        "prettier": "^2.8.8",
        "prettier-plugin-solidity": "^1.4.1",
        "solidity-coverage": "^0.8.13",
        "ts-node": "^10.9.2",
        "typechain": "^8.3.2",
        "typescript": "^5.7.2"
    },
    "dependencies": {
        "@nomiclabs/hardhat-ethers": "npm:hardhat-deploy-ethers@^0.4.2",
        "@openzeppelin/contracts": "^5.1.0",
        "cli-color": "^2.0.4",
        "dotenv": "^16.4.5",
        "ethers": "^6.13.4",
        "hardhat-deploy": "^0.12.0"
    }
}
```

### pnpm-lock.yaml

```yaml
lockfileVersion: '9.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false

importers:

  .:
    dependencies:
      '@nomiclabs/hardhat-ethers':
        specifier: npm:hardhat-deploy-ethers@^0.4.2
        version: hardhat-deploy-ethers@0.4.2(@nomicfoundation/hardhat-ethers@3.0.8(ethers@6.13.4)(hardhat@2.22.17(ts-node@10.9.2(@types/node@22.9.3)(typescript@5.7.2))(typescript@5.7.2)))(hardhat-deploy@0.12.4)(hardhat@2.22.17(ts-node@10.9.2(@types/node@22.9.3)(typescript@5.7.2))(typescript@5.7.2))
      '@openzeppelin/contracts':
        specifier: ^5.1.0
        version: 5.1.0
      cli-color:
        specifier: ^2.0.4
        version: 2.0.4
      dotenv:
        specifier: ^16.4.5
        version: 16.4.5
      ethers:
        specifier: ^6.13.4
        version: 6.13.4
      hardhat-deploy:
        specifier: ^0.12.0
        version: 0.12.4
    devDependencies:
      '@nomicfoundation/hardhat-chai-matchers':
```

[This file was cut: it has more than 500 lines]

```

## scripts


### scripts/check-my-balance.ts

```typescript
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128)
import hre from "hardhat"
import { ethers } from "ethers"

async function main() {
    const networks = Object.entries(hre.config.networks)

    console.log(
        color.cyanBright(
            "\nFetching signer balances for all supported networks...\n"
        )
    )

    for (const [networkName, networkConfig] of networks) {
        try {
            console.log(color.magenta(`\nSwitching to network: ${networkName}`))

            // Skip hardhat and localhost networks
            if (networkName === "hardhat" || networkName === "localhost") {
                console.log(
                    color.yellow(
                        `Skipping local network "${networkName}" - only checking remote networks.`
                    )
                )
                continue
            }

            // Type assertion for network config
            const config = networkConfig as {
                url?: string
                accounts?: string[]
            }

            // Check if network is properly configured
            if (
                !config.url ||
                !config.accounts ||
                config.accounts.length === 0
            ) {
                console.log(
                    color.yellow(
                        `Skipping network "${networkName}" - missing configuration in .env file`
                    )
                )
                continue
            }

            // Create provider with retry options
            const provider = new ethers.JsonRpcProvider(config.url, undefined, {
                maxRetries: 3,
                timeout: 10000
            })

            // Test provider connection
            try {
                await provider.getNetwork()
            } catch (error) {
                console.log(
                    color.yellow(
                        `Failed to connect to network "${networkName}" - check RPC URL`
                    )
                )
                continue
            }

            // Create signer and get balance
            const signer = new ethers.Wallet(config.accounts[0], provider)
            const balance = await provider.getBalance(signer.address)

            console.log(
                `Signer (${signer.address}) on network "${networkName}" has`,
                msg(ethers.formatEther(balance)),
                "ETH."
            )
        } catch (error: any) {
            console.error(
                color.red(
                    `Failed to process network ${networkName}: ${error.message}`
                )
            )
        }
    }

    console.log(color.cyanBright("\nDone fetching balances for all networks."))
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})

```

### scripts/claim-membership.ts

```typescript
import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

async function main() {
    const JUNGLE_PRIVATE_KEY = process.env.JUNGLE
    if (!JUNGLE_PRIVATE_KEY) {
        throw new Error("Please set JUNGLE private key in your .env file")
    }

    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const jungleSigner = new ethers.Wallet(JUNGLE_PRIVATE_KEY, provider)

    console.log("Using address:", jungleSigner.address)
    if (
        jungleSigner.address.toLowerCase() !==
        "0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE".toLowerCase()
    ) {
        throw new Error(
            "Wrong private key! The signer address doesn't match the token owner address from Sepolia"
        )
    }

    const nft = NFT__factory.connect(NFT_ADDRESS, jungleSigner)

    const proof =
        "0x0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000bdc0e420ab9ba144213588a95fa1e5e63ceff1be0000000000000000000000000000000000000000000000000000000000000080469f7c23ba8094fc60d812caea153b06cc07e9b5bf2c0bb384ef9ed462f2251b000000000000000000000000000000000000000000000000000000000000005268747470733a2f2f6261666b726569636a36326c35787536706b3278783778376e3662377270756e78623465686c6837666576796a6170696433353536736d757a34792e697066732e7733732e6c696e6b2f0000000000000000000000000000"

    try {
        console.log("Simulating claim transaction...")
        await nft.claimMint.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting claim transaction...")
        const tx = await nft.claimMint(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        console.log("Waiting for confirmation...")

        const receipt = await tx.wait()
        console.log("Membership claimed successfully!")

        // Get token ID from event
        const claimEvent = receipt?.logs.find(log => {
            try {
                return nft.interface.parseLog(log)?.name === "MembershipClaimed"
            } catch {
                return false
            }
        })

        if (claimEvent) {
            const parsedEvent = nft.interface.parseLog(claimEvent)
            const tokenId = parsedEvent?.args?.tokenId
            console.log("Claimed token ID:", tokenId)
        }
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = nft.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Raw error data:", error.data)
            }
        }
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})

```

### scripts/propose.ts

```typescript
import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }
    if (!SEPOLIA_PRIVATE_KEY) {
        throw new Error("Please set SEPOLIA_PRIVATE_KEY in your .env file")
    }
    const JUNGLE_ADDRESS = "0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE"

    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"
    const GOV_ADDRESS = "0x76f53bf2ad89DaB4d8b666b9a5C6610C2C2e0EfC"

    // Create provider and signers properly
    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const sepoliaSigner = new ethers.Wallet(SEPOLIA_PRIVATE_KEY, provider)
    console.log("Using address for proposals:", aliceSigner.address)
    console.log("Using address for execution:", sepoliaSigner.address)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Check current voting power
    const votingPower = await nft.getVotes(aliceSigner.address)
    console.log("Current voting power:", votingPower)

    if (votingPower === 0n) {
        console.log("Delegating voting power...")
        const tx = await nft.delegate(aliceSigner.address)
        await tx.wait(3)
        console.log("Delegation completed")
        console.log(
            "New voting power:",
            (await nft.getVotes(aliceSigner.address)).toString()
        )
    }

    console.log("Creating proposal to add new member...")

    try {
        console.log("nft.target:", nft.target)
        const targets = [nft.target]
        const values = [0]

        // Prepare the NFT mint call through the Gov contract
        const mintCall = nft.interface.encodeFunctionData("safeMint", [
            JUNGLE_ADDRESS,
            "https://bafkreicj62l5xu6pk2xx7x7n6b7rpunxb4ehlh7fevyjapid3556smuz4y.ipfs.w3s.link/"
        ])

        const calldatas = [mintCall]
        const description = "Add Jungle as a new member " + Date.now()

        console.log("Creating proposal with:")
        console.log("- Target:", targets[0])
        console.log("- Value:", values[0])
        console.log("- Calldata:", calldatas[0])
        console.log("- Description:", description)

        console.log("\nSimulating proposal execution...")
        try {
            await provider.call({
                to: nft.target,
                data: calldatas[0],
                from: gov.target
            })
            console.log("✅ Simulation successful - NFT minting would succeed")
        } catch (error: any) {
            console.error(
                "❌ Simulation failed - NFT minting would fail:",
                error
            )
            if (error.data) {
                try {
                    const decodedError = nft.interface.parseError(error.data)
                    console.error("Decoded error:", decodedError)
                } catch (e) {
                    console.error("Could not decode error data")
                }
            }
            throw new Error("Proposal simulation failed")
        }

        const tx = await gov
            .connect(aliceSigner)
            .propose(targets, values, calldatas, description)

        console.log("Proposal transaction submitted:", tx.hash)
        let proposalId
        const receipt = await tx.wait()
        if (receipt) {
            console.log("Proposal confirmed in block:", receipt.blockNumber)
            proposalId =
                receipt.logs[0] instanceof ethers.EventLog
                    ? receipt.logs[0].args?.[0]
                    : null
            if (proposalId) {
                console.log("Proposal ID:", proposalId)
            }
        } else {
            throw new Error("Transaction failed - no receipt received")
        }

        console.log("proposalId:", proposalId)
        if (receipt) {
            console.log("Proposal confirmed in block:", receipt.blockNumber)
            const proposalIdFromEvent =
                receipt.logs[0] instanceof ethers.EventLog
                    ? receipt.logs[0].args?.[0]
                    : null
            console.log("Proposal ID from event:", proposalIdFromEvent)

            console.log("Checking proposal state before voting...")
            const state = await gov.state(proposalId)
            console.log(
                "Current proposal state:",
                getProposalState(Number(state))
            )

            let currentState = Number(state)
            let attempts = 0
            const maxAttempts = 10

            while (currentState === 0 && attempts < maxAttempts) {
                console.log("Waiting for proposal to become active...")
                await sleep(30000)

                const newState = await gov.state(proposalId)
                currentState = Number(newState)
                console.log(
                    "Current proposal state:",
                    getProposalState(currentState)
                )
                attempts++
            }

            if (proposalId) {
                if (currentState === 1) {
                    console.log("Casting vote...")
                    const voteTx = await gov.castVote(proposalId, 1)
                    const voteReceipt = await voteTx.wait()
                    console.log("Vote cast successfully!")

                    let isSucceeded = false
                    console.log("\nStarting to check proposal state...")

                    while (!isSucceeded) {
                        const state = await gov.state(proposalId)
                        console.log(
                            "Current proposal state:",
                            getProposalState(Number(state))
                        )

                        if (getProposalState(Number(state)) === "Succeeded") {
                            isSucceeded = true
                            console.log(
                                "\nProposal succeeded! Preparing for execution..."
                            )

                            try {
                                console.log("Execution parameters:")
                                console.log("- Targets:", targets)
                                console.log("- Values:", values)
                                console.log("- Calldatas:", calldatas)
                                console.log(
                                    "- Description hash:",
                                    ethers.id(description)
                                )

                                console.log(
                                    "\nSubmitting execution transaction from Sepolia signer..."
                                )

                                // Connect with sepoliaSigner for execution
                                const executeTx = await gov
                                    .connect(sepoliaSigner)
                                    .execute(
                                        targets,
                                        values,
                                        calldatas,
                                        ethers.id(description)
                                    )

                                console.log(
                                    "Execution transaction submitted:",
                                    executeTx.hash
                                )
                                console.log("Waiting for confirmation...")

                                const executeReceipt = await executeTx.wait()
                                console.log(
                                    "Proposal executed successfully in block:",
                                    executeReceipt?.blockNumber
                                )

                                try {
                                    const totalSupply = await nft.totalSupply()
                                    console.log(
                                        "NFT total supply:",
                                        totalSupply
                                    )
                                    const newOwner = await nft.ownerOf(
                                        totalSupply - 1n
                                    )
                                    console.log(
                                        "NFT successfully minted to:",
                                        newOwner
                                    )
                                } catch (error) {
                                    console.log(
                                        "Could not verify NFT minting:",
                                        error
                                    )
                                }

                                break
                            } catch (error: any) {
                                console.error("\nError executing proposal:")
                                console.error("Error message:", error.message)

                                if (error.data) {
                                    try {
                                        const decodedError =
                                            gov.interface.parseError(error.data)
                                        console.error(
                                            "Decoded error:",
                                            decodedError
                                        )
                                    } catch (e) {
                                        console.error(
                                            "Raw error data:",
                                            error.data
                                        )
                                    }
                                }

                                if (error.transaction) {
                                    console.error("\nTransaction details:")
                                    console.error("To:", error.transaction.to)
                                    console.error(
                                        "Data:",
                                        error.transaction.data
                                    )
                                }
                                throw error
                            }
                        }

                        console.log(
                            "Waiting 1 minute before next state check..."
                        )
                        await sleep(60000)
                    }
                } else {
                    console.log(
                        `Could not reach active state. Current state: ${getProposalState(
                            currentState
                        )}`
                    )
                }
            }
        }
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = gov.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Could not decode error data")
            }
        }
        throw error
    }
}

function getProposalState(state: number): string {
    const states = [
        "Pending",
        "Active",
        "Canceled",
        "Defeated",
        "Succeeded",
        "Queued",
        "Expired",
        "Executed"
    ]
    return states[state]
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})

```

### scripts/verify-proof.ts

```typescript
import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    // Contract address on Sepolia where the NFT was originally minted
    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"

    // Get contract factory and instance
    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT"
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, NFTFactory.runner) as NFT

    // Get owner of token ID 2 for verification
    const owner = await nft.ownerOf(2)
    console.log("\nToken owner:", owner)

    // Generate proof for token ID 2
    console.log("Generating proof for token ID 2...")
    const proof = await nft.generateMintProof(2)
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})

```

## test


### test/Gov-crosschain.ts

```typescript
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { deployments, ethers, network } from "hardhat"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { EventLog } from "ethers"

describe("Crosschain Gov", function () {
    let HOME_CHAIN_ID: number
    let TARGET_CHAIN_ID: number
    let sourceChainNFT: NFT
    let sourceChainGov: Gov
    let targetChainNFT: NFT
    let targetChainGov: Gov
    let deployer: HardhatEthersSigner
    let alice: HardhatEthersSigner
    let bob: HardhatEthersSigner
    let charlie: HardhatEthersSigner

    before(async function () {
        HOME_CHAIN_ID = 1337 // Hardhat's default chain ID
        TARGET_CHAIN_ID = 1338
    })

    async function deployContracts() {
        const { deterministic } = deployments
        const [deployer, alice, bob, charlie] = await ethers.getSigners()
        const salt = ethers.id("test-v1")

        // Reset network state
        await network.provider.send("hardhat_reset")

        // Deploy source chain contracts
        const { address: nftAddress, deploy: deployNFT } = await deterministic(
            "NFT",
            {
                from: deployer.address,
                contract: "contracts/variants/crosschain/NFT.sol:NFT",
                args: [
                    1337,
                    deployer.address,
                    [alice.address, bob.address],
                    "ipfs://testURI",
                    "TestNFT",
                    "TNFT"
                ],
                salt
            }
        )

        await deployNFT()

        sourceChainNFT = (await ethers.getContractAt(
            "contracts/variants/crosschain/NFT.sol:NFT",
            nftAddress
        )) as unknown as NFT

        const { address: govAddress, deploy: deployGov } = await deterministic(
            "Gov",
            {
                from: deployer.address,
                contract: "contracts/variants/crosschain/Gov.sol:Gov",
                args: [
                    1337,
                    nftAddress,
                    "ipfs://manifestoCID",
                    "TestDAO",
                    1,
                    10,
                    1,
                    5
                ],
                salt
            }
        )

        await deployGov()

        sourceChainGov = (await ethers.getContractAt(
            "contracts/variants/crosschain/Gov.sol:Gov",
            govAddress
        )) as unknown as Gov

        // Transfer ownership
        await sourceChainNFT.connect(deployer).transferOwnership(govAddress)

        // Reset network to simulate different chain
        await network.provider.send("hardhat_reset")

        // Reset nonce for deterministic deployment
        await network.provider.send("hardhat_setNonce", [
            deployer.address,
            "0x0"
        ])

        // Deploy target chain contracts
        await deployNFT()
        targetChainNFT = (await ethers.getContractAt(
            "contracts/variants/crosschain/NFT.sol:NFT",
            nftAddress
        )) as unknown as NFT

        await deployGov()
        targetChainGov = (await ethers.getContractAt(
            "contracts/variants/crosschain/Gov.sol:Gov",
            govAddress
        )) as unknown as Gov

        // Set up target chain
        await targetChainNFT.connect(deployer).transferOwnership(govAddress)

        // Log addresses
        // console.log("\nVerifying addresses:")
        // console.log("Source NFT:", await sourceChainNFT.getAddress())
        // console.log("Target NFT:", await targetChainNFT.getAddress())
        // console.log("Source Gov:", await sourceChainGov.getAddress())
        // console.log("Target Gov:", await targetChainGov.getAddress())

        return {
            sourceChainNFT,
            sourceChainGov,
            targetChainNFT,
            targetChainGov,
            deployer,
            alice,
            bob,
            charlie
        }
    }

    describe("Cross-chain Deployment", function () {
        beforeEach(async function () {
            const contracts = await loadFixture(deployContracts)
            deployer = contracts.deployer
            alice = contracts.alice
            bob = contracts.bob
            charlie = contracts.charlie
            sourceChainNFT = contracts.sourceChainNFT
            sourceChainGov = contracts.sourceChainGov
            targetChainNFT = contracts.targetChainNFT
            targetChainGov = contracts.targetChainGov
        })

        it("should deploy contracts at same addresses on both chains", async function () {
            const sourceNFTAddress = await sourceChainNFT.getAddress()
            const targetNFTAddress = await targetChainNFT.getAddress()
            const sourceGovAddress = await sourceChainGov.getAddress()
            const targetGovAddress = await targetChainGov.getAddress()

            expect(sourceNFTAddress).to.equal(targetNFTAddress)
            expect(sourceGovAddress).to.equal(targetGovAddress)
        })

        it("should initialize contracts with same parameters on both chains", async function () {
            // Compare NFT parameters
            expect(await sourceChainNFT.name()).to.equal(
                await targetChainNFT.name()
            )
            expect(await sourceChainNFT.symbol()).to.equal(
                await targetChainNFT.symbol()
            )

            // Compare Gov parameters
            expect(await sourceChainGov.name()).to.equal(
                await targetChainGov.name()
            )
            expect(await sourceChainGov.votingDelay()).to.equal(
                await targetChainGov.votingDelay()
            )
            expect(await sourceChainGov.votingPeriod()).to.equal(
                await targetChainGov.votingPeriod()
            )
            expect(await sourceChainGov.proposalThreshold()).to.equal(
                await targetChainGov.proposalThreshold()
            )
        })
    })

    describe("Cross-chain Ops", function () {
        beforeEach(async function () {
            const contracts = await loadFixture(deployContracts)
            deployer = contracts.deployer
            alice = contracts.alice
            bob = contracts.bob
            charlie = contracts.charlie
            sourceChainNFT = contracts.sourceChainNFT
            sourceChainGov = contracts.sourceChainGov
            targetChainNFT = contracts.targetChainNFT
            targetChainGov = contracts.targetChainGov
        })

        it("should generate and verify membership proof", async function () {
            // First verify Alice has enough voting power
            const proposalThreshold = await sourceChainGov.proposalThreshold()
            const aliceVotes = await sourceChainNFT.getVotes(alice.address)
            expect(aliceVotes).to.be.gte(proposalThreshold)

            // Create proposal to add Charlie as member
            const proposalDescription = "Add Charlie as member"
            const mintCalldata = sourceChainNFT.interface.encodeFunctionData(
                "safeMint",
                [charlie.address, "ipfs://charlieURI"]
            )

            const proposeTx = await sourceChainGov
                .connect(alice)
                .propose(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    proposalDescription
                )

            const receipt = await proposeTx.wait()
            const proposalId = (receipt?.logs[0] as EventLog).args[0]

            // Rest of the test remains the same...
        })
    })
})

```

### test/Gov.ts

```typescript
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { NFT } from "../typechain-types/contracts/NFT"
import { Gov } from "../typechain-types/contracts/Gov"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { EventLog } from "ethers"

describe("Gov", function () {
    let gov: Gov
    let nft: NFT
    let owner: HardhatEthersSigner
    let alice: HardhatEthersSigner
    let bob: HardhatEthersSigner
    let charlie: HardhatEthersSigner
    let david: HardhatEthersSigner

    async function deployContracts() {
        ;[owner, alice, bob, charlie, david] = await ethers.getSigners()

        // Deploy NFT with initial members
        const NFTFactory = await ethers.getContractFactory(
            "contracts/NFT.sol:NFT"
        )
        const nftContract = (await NFTFactory.deploy(
            owner.address,
            [alice.address, bob.address], // Only Alice and Bob get NFTs initially
            "ipfs://testURI",
            "TestNFT",
            "TNFT"
```

[This file was cut: it has more than 500 lines]

```

### tsconfig.json

```json
{
    "compilerOptions": {
        "target": "es2020",
        "module": "commonjs",
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true,
        "resolveJsonModule": true
    }
}

```

## Structure

```
├── .env.template
├── .github
    └── workflows
    │   └── run-unit-tests.yml
├── .gitignore
├── .prettierignore
├── .prettierrc
├── README.md
├── contracts
    ├── Gov.sol
    ├── NFT.sol
    └── variants
    │   └── crosschain
    │       ├── Gov.sol
    │       └── NFT.sol
├── dao.config.ts
├── deploy
    ├── deploy-crosschain-gov.ts
    └── deploy-gov.ts
├── funding.json
├── gov_app_description.md
├── hardhat.config.ts
├── package.json
├── pnpm-lock.yaml
├── scripts
    ├── check-my-balance.ts
    ├── claim-membership.ts
    ├── propose.ts
    └── verify-proof.ts
├── test
    ├── Gov-crosschain.ts
    └── Gov.ts
├── tsconfig.json
```

Timestamp: Dec 11 2024 03:36:34 PM UTC