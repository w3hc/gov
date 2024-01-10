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

Add your own keys in your `.env` file. 

- Configure your DAO in the `dao.config.ts` file, [the docs is here if you need](https://w3hc.github.io/gov-docs/)
- Edit the manifesto in `storage/manifesto/manifesto.md`
- Replace the image (membership NFT image) in `storage/metadata/image.png`

Then deploy to Goerli:

```bash
pnpm deploy:goerli
```

or deploy to Sepolia

```bash
pnpm deploy:sepolia
```

or deploy to Arthera

```bash
pnpm deploy:arthera
```

or deploy to Optimism Goerli:

```bash
pnpm deploy:og
```

Then you can interact with your DAO using [Tally](https://www.tally.xyz/).

To deploy to other networks, please read the [deployment section in the docs](https://w3hc.github.io/gov-docs/deployment.html).

To upload the membership NFT metadata, upload the manifesto, or submit a proposal using the CLI, please check [this section of the docs](https://w3hc.github.io/gov-docs/deployment.html#use).

## Supported networks

- Optimism Mainnet ([view W3HC DAO contract](https://optimistic.etherscan.io/address/0x83e2403a8b94af988b4f4ae9869577783b8cd216#writeContract))
- Goerli Testnet ([view latest deployment](https://goerli.etherscan.io/address/0x4Ab5851BaAA670f93CE5a1B1E4885eBe12FD4f1d#writeContract))
- Optimism Goerli Testnet ([view latest deployment](https://goerli-optimism.etherscan.io/address/0xa2be3b1b4666ceb06c3237078b73089b8b95078c#writeContract))
- Arbitrum Goerli Testnet
- Celo Alfajores Testnet
- Celo Mainnet
- Gnosis Chiado Testnet
- Gnosis Mainnet 
- Mantle Testnet
- Arthera Testnet ([view latest deployment](https://explorer-test.arthera.net/address/0x28F1Ef960E2674cAdf2F4197910e2fcFb4b8BA1C?tab=txs))

## Variants

There are three protected branches, each one of them corresponding to a certain variant. 

### `main`

- Supports SBTs (non-transferable NFTs)
- Block-number-based

### `no-sbt`

- Doesn't support SBTs (membership NFTs are transferable)
- Block-number-based

### `timestamp-based`

- Timestamp-based (ideal for Optimism, Avalanche, Arthera)
- Not supported by Tally

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

- Node [v18.17.1](https://nodejs.org/uk/blog/release/v18.17.1/)
- pnpm [v6.28.0](https://pnpm.io/)
- OpenZeppelin Contracts [v4.9.3](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v4.9.3)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.com/invite/uSxzJp3J76), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
