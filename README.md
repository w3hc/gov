# Gov

A DAO template built with Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- [`Gov.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/Gov.sol) is the **Governor** contract
- [`NFT.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/NFT.sol) is the **NFT** contract (ERC-721)

## Motivation

Provide a coordination tool that fits the needs of everyday people. Orgs, federations of orgs, activists, neighborhoods, stewards of the commons, collectives, and other communities should be able to take advantage of it. We want DAOs to be secure, scalable and easy to use.

- [Documentation](https://w3hc.github.io/gov-docs/)
- [UI](https://github.com/w3hc/gov-ui)
- [Test DAO on Tally](https://www.tally.xyz/gov/girlygov-64)

## Install

```sh
npm i
```

## Test

```sh
npx hardhat test
```

## Deploy

Create a `.env` on the model of `.env.example` and add your own keys (the three first are required), then deploy to Goerli:

```sh
npm run deploy
```

Alternatively, you can run these two commands:

```sh
npx hardhat run scripts/deploy-nft.ts --network goerli
npx hardhat run scripts/deploy-gov.ts --network goerli
```

Then you can interact with your DAO using [Tally](https://www.tally.xyz/).

## Use

#### Upload metadata

Edit the metadata in `upload-metadata.ts`, then:

```sh
npx hardhat run scripts/upload-metadata.ts
```

#### Upload manifesto

Edit the `manifesto.md` file, then:

```sh
npx hardhat run scripts/upload-manifesto.ts
```

Note that you can put a whole website in the manifesto directory, the result will be the same: you'll get the CID of your manifesto.

## Supported networks

- Goerli Testnet
- Optimism Testnet
- Optimism

## Security

Here are the differences from the Governor and ERC-721 implementations [suggested](https://wizard.openzeppelin.com/#governor) by Open Zeppelin:

### [Gov.sol](https://github.com/w3hc/gov/blob/main/contracts/Gov.sol)

The following function is `onlyGovernance`, meaning it can only be triggered by a vote.

- `setManifesto()` updates the CID.

### [NFT.sol](https://github.com/w3hc/gov/blob/main/contracts/NFT.sol)

The following functions are `onlyOwner`, and since the NFT contract ownership is transfered to the Gov contract, they can only be triggered by a vote.

- `safeMint()` adds a new member.
- `govBurn()` adds to ban a member.
- `setMetadata()` changes the tokenURI of a given NFT ID.

## Versions

- Node [v18.12.1](https://nodejs.org/uk/blog/release/v18.12.1/)
- NPM [v8.19.2](https://github.com/npm/cli/releases/tag/v8.19.2)
- OpenZeppelin Contracts [v4.8.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v4.8.0)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.gg/bHKJV3NWUQ), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
