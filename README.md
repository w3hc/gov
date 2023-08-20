# Gov

A DAO framework built with Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- [`Gov.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/Gov.sol) is the **Governor** contract
- [`NFT.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/NFT.sol) is the **NFT** contract (ERC-721)

Gov is maintained by the [Web3 Hackers Collective](https://www.tally.xyz/gov/web3-hackers-collective).

The ultimate goal is to allow users to deploy their DAO contract and the interface that goes with it in one click.

## Motivation

Provide a coordination tool that fits the needs of everyday people. Orgs, federations of orgs, activists, neighborhoods, stewards of the commons, collectives, and other communities are invited to [deploy their own DAO](https://w3hc.github.io/gov-docs/deployment.html). 

- [Documentation](https://w3hc.github.io/gov-docs/)
- [Gov UI](https://gov-ui.netlify.app/) (WIP)
- [Example DAO on Tally](https://www.tally.xyz/gov/web3-hackers-collective)

## Install

```js
npm i
```

## Test

```js
npx hardhat test
```

## Deploy

Create a `.env` on the model of `.env.template`:

```js
cp .env.template .env
```

Add your own keys in your `.env` file. 

Then deploy to Goerli:

```js
npm run deploy
```

or

```
npx hardhat run scripts/clear.ts
npx hardhat run scripts/deploy-nft.ts --network goerli
npx hardhat run scripts/deploy-gov.ts --network goerli
```

Then you can interact with your DAO using [Tally](https://www.tally.xyz/).

To deploy to other networks, please read the [deployment section in the docs](https://w3hc.github.io/gov-docs/deployment.html).

To upload the membership NFT metadata, upload the manifesto, or submit a proposal using the CLI, please check [this section of the docs](https://w3hc.github.io/gov-docs/deployment.html#use).

## Supported networks

- Optimism Mainnet
- Goerli Testnet
- Optimism Goerli Testnet
- Arbitrum Goerli Testnet
- Celo Alfajores Testnet
- Celo Mainnet
- Gnosis Chiado Testnet
- Gnosis Mainnet 
- Mantle Testnet
- Arthera Testnet

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

## Versions

- Node [v18.15.0](https://nodejs.org/uk/blog/release/v18.15.0/)
- NPM [v9.5.0](https://github.com/npm/cli/releases/tag/v9.5.0)
- OpenZeppelin Contracts [v4.8.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v4.8.0)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.com/invite/uSxzJp3J76), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
