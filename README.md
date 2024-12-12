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

Make sure the main account has sufficient balance on OP Sepolia and Arbitrum Sepolia: 

```
pnpm bal
```

Deploy: 

```
pnpm deploy:all
```

It will: 

- Deploy to OP Sepolia
- Deploy to Arbitrum Sepolia

Add a member (mint):

```
./scripts/mint.sh
```

It will: 

- Submit a proposal and add a member on OP Sepolia
- Generate a membership proof on OP Sepolia
- Claim that proof on Arbitrum Sepolia

Ban a member (burn):

```
./scripts/burn.sh
```

It will: 

- Submit a proposal and ban a member on OP Sepolia
- Generate a burn proof on OP Sepolia
- Claim that proof on Arbitrum Sepolia

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
| Arbitrum One | 42161 | [Documentation](https://docs.arbitrum.io/welcome/get-started) |
| Sepolia Testnet | 11155111 | [Documentation](https://ethereum.org/nb/developers/docs/networks/#sepolia) |
| OP Sepolia Testnet | 11155420 | [Documentation](https://docs.optimism.io/chain/networks#op-sepolia) |
| Base Sepolia Testnet | 84532 | [Documentation](https://docs.base.org/docs/network-information/#base-testnet-sepolia) |
| Arbitrum Sepolia | 421614 | [Documentation](https://docs.arbitrum.io/welcome/get-started) |

## Contract Verification

| Network | Explorer URL | API URL | API Key Variable |
|---------|--------------|---------|-----------------|
| Optimism | https://optimistic.etherscan.io | https://api-optimistic.etherscan.io/api | OP_ETHERSCAN_API_KEY |
| Base | https://basescan.org | https://api.basescan.org/api | BASE_ETHERSCAN_API_KEY |
| Arbitrum One | https://arbiscan.io | https://api.arbiscan.io/api | ARBITRUM_ETHERSCAN_API_KEY |
| Sepolia | https://sepolia.etherscan.io | https://api-sepolia.etherscan.io/api | ETHERSCAN_API_KEY |
| OP Sepolia | https://sepolia-optimism.etherscan.io | https://api-sepolia-optimistic.etherscan.io/api | OP_ETHERSCAN_API_KEY |
| Base Sepolia | https://sepolia.basescan.org | https://api-sepolia.basescan.org/api | BASE_ETHERSCAN_API_KEY |
| Arbitrum Sepolia | https://sepolia.arbiscan.io | https://api-sepolia.arbiscan.io/api | ARBITRUM_ETHERSCAN_API_KEY |

## Core Dependencies

-   Node [v20.9.0](https://nodejs.org/uk/blog/release/v20.9.0/)
-   PNPM [v9.10.0](https://pnpm.io/pnpm-vs-npm)
-   Hardhat [v2.22.16](https://github.com/NomicFoundation/hardhat/releases/)
-   OpenZeppelin Contracts [v5.1.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v5.1.0)
-   Ethers [v6.13.4](https://docs.ethers.org/v6/)

## Support

Feel free to reach out to [Julien](https://github.com/julienbrg) on [Farcaster](https://warpcast.com/julien-), [Element](https://matrix.to/#/@julienbrg:matrix.org), [Status](https://status.app/u/iwSACggKBkp1bGllbgM=#zQ3shmh1sbvE6qrGotuyNQB22XU5jTrZ2HFC8bA56d5kTS2fy), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discordapp.com/users/julienbrg), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).