# Gov

A DAO template built with Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- [`Gov.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/Gov.sol) is the **Governor** contract
- [`NFT.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/NFT.sol) is the **NFT** contract (ERC-721)

## Motivation

Provide an adapted coordination tool for orgs, federations of orgs, activists, commons stewardship, local neighborhoods, and other communities.

## Install

```shell
npm i
```

## Test

```shell
npx hardhat test
```

## Deploy

Create a `.env` on the model of `.env.example` and add your own keys (the three first are required), then deploy to Goerli:

```shell
npx hardhat deploy
```

Alternatively, you can run these two commands:

```shell
npx hardhat run scripts/deploy-nft.ts --network goerli
npx hardhat run scripts/deploy-gov.ts --network goerli
```

Then you can interact with your DAO using [Tally](https://www.tally.xyz/).

## Use

#### Upload manifesto

Edit the `manifesto.md` file, then:

```shell
npx hardhat run scripts/upload-manifesto.ts
```

Note that you can put a whole website in the manifesto directory, the result will be the same: you'll get the CID of your manifesto.

#### Upload metadata

Edit the metadata in `upload-metadata.ts`, then:

```shell
npx hardhat run scripts/upload-metadata.ts
```

## Supported networks

- Goerli Testnet
- Optimism Testnet
- Optimism

## Security

Here are the differences from the standard implementation suggested by Open Zeppelin:

#### Gov.sol

The following function is `onlyGovernance`, meaning it can only be triggered by a vote.

- `setManifesto()` is a function to update the CID.

#### NFT.sol

The following functions are `onlyOwner`, meaning they can only be triggered by a vote.

- `safeMint()` is used to add a new member.
- `govBurn()` is used to ban a member.
- `setMetadata()` changes the tokenURI of a given ID.

## Docs

- [Get started](https://github.com/w3hc/gov/wiki/Get-started)
- [Submit a proposal](https://github.com/w3hc/gov/wiki/Submit-a-proposal)
- [Voting rules](https://github.com/w3hc/gov/wiki/Voting-rules)
- [Resources](https://github.com/w3hc/gov/wiki/Resources)
- [Latest deployment](https://github.com/w3hc/gov/wiki/Latest-deployment)
- [Changelog](https://github.com/w3hc/gov/wiki/Changelog)

## Versions

- Node [v18.12.1](https://nodejs.org/uk/blog/release/v18.12.1/)
- NPM [v8.19.2](https://github.com/npm/cli/releases/tag/v8.19.2)
- OpenZeppelin Contracts [v4.8.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v4.8.0)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.gg/xw9dCeQ94Y), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
