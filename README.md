# DAO Contracts

A DAO template built using Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- [`Gov.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/Gov.sol) is the **Governor** contract
- [`NFT.sol`](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/NFT.sol) is the **NFT** contract (ERC-721)

## Motivation

See if it can fit the needs of many different communities (activists, local neighborhoods, orgs, ...). We'll start with the [W3HC](https://w3hc.org/) DAO focused on Web3 integrations, mentoring and education.

## Install

```shell
npm i
```

## Test

```shell
npx hardhat test
```

## Deploy

Create a `.env` on the model of `.env.example` and add your own keys, then deploy to Goerli:

```shell
npx hardhat deploy
```

Alternatively, you can run these three commands:

```shell
npx hardhat run scripts/deployNFT.ts --network goerli
npx hardhat run scripts/deployGovernor.ts --network goerli
npx hardhat run scripts/deployManifesto.ts --network goerli
```

## Supported networks

- Goerli Testnet (goerli)
- Optimism Testnet (optimism-goerli)
- Optimism (optimism)

## Latest deployment

Deployed to [Optimism Testnet](https://community.optimism.io/docs/guides/) on Dec 20, 2022 at 7.45pm UTC:

- NFT: [0xe6BCD785b90dc16d667B022cc871c046587d9Ac5](https://goerli-optimism.etherscan.io/address/0xe6BCD785b90dc16d667B022cc871c046587d9Ac5#code)
- Gov: [0x2117bC9657Cb24C2868Bd660557812fEB535F3Bd](https://goerli-optimism.etherscan.io/address/0x2117bC9657Cb24C2868Bd660557812fEB535F3Bd#code)
- Manifesto: [0x1198f6aEe71Cb77f1447721A7A986F0cC2b8eA4C](https://goerli-optimism.etherscan.io/address/0x1198f6aEe71Cb77f1447721A7A986F0cC2b8eA4C#code)

## Roadmap

1. Simplified onboarding ([Onboarding.sol](https://github.com/web3-hackers-collective/dao-contracts/blob/main/contracts/plugins/Onboarding.sol) plugin + UI)
2. Impact evaluation process & [Hypercerts](https://hypercerts.xyz/) integration
3. Vault (in addition to the [Gnosis Safe](https://gnosis-safe.io/))

## Resources

- [Introducing OpenZeppelin Governor](https://blog.openzeppelin.com/governor-smart-contract/)
- [How to set up on-chain governance](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/docs/modules/ROOT/pages/governance.adoc)
- [Governance section in OpenZeppelin docs](https://docs.openzeppelin.com/contracts/4.x/api/governance)
- [Build Your DAO with OpenZeppelin Governor ft. ENS](https://www.youtube.com/watch?v=Lltt6j6Hmww) (Dec 2021 video)
- [Build your governance easily with OpenZeppelin Contracts]() (Nov 2021 video)
- [Tally Wiki](https://wiki.tally.xyz/docs)
- [A Pocket Guide to DAO Frameworks](https://blog.tally.xyz/a-pocket-guide-to-dao-frameworks-8d7ad5af3a1b) (Oct 2022 post)
- [Build an NFT DAO from Scratch - Tally Tutorial](https://www.youtube.com/watch?v=cAbHwCWJAG4)
- [How to Code an On-Chain DAO](https://betterprogramming.pub/how-to-code-an-on-chain-dao-e525e13a57be) (Feb 2022)

## Changelog

#### [v0.8.0-alpha](https://github.com/web3-hackers-collective/dao-contracts/releases/tag/v0.8.0-alpha)

- added Manifesto contract
- added tests for handling ERC-20, ERC-721, ERC-1155
- added Optimism Testnet
- made the NFT contract upgradeable
- made the NFT metadata dynamic (updatable)

#### [v0.1](https://github.com/web3-hackers-collective/dao-contracts/releases/tag/v.0.1.0)

- DAO membership NFTS (ERC-721)
- On-chain voting system (Governor)
- Members vote to add or ban a member
- Easy to config, deploy and run
- Fully compatible with [Tally](https://www.tally.xyz/)
- Extreme composability/modularity
- Upgradeable governance settings

## Versions

- Node [v18.12.1](https://nodejs.org/uk/blog/release/v18.12.1/)
- NPM [v8.19.2](https://github.com/npm/cli/releases/tag/v8.19.2)
- OpenZeppelin Contracts [v4.8.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v4.8.0)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.gg/xw9dCeQ94Y), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
