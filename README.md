# Signed Sealed Delivered

Exploring Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- `Gov.sol` is the **Governor** contract
- `NFT.sol` is the **NFT** contract

## Features

- DAO membership NFTS (ERC-721)
- On-chain voting system (Governor)
- Members vote to add or ban a member
- Easy to config, deploy and run
- Fully compatible with [Tally](https://www.tally.xyz/)
- Extreme composability/modularity
- Upgradeable/evolutive (UUPS)
- Upgradeable governance settings

## Install

```shell
npm i
```

## Test

```shell
npx hardhat test
```

## Deploy

1. Create a `.env` on the model of `.env.example` and add your own keys
2. In the `/metadata` directory, edit the `MANIFESTO.md` file and replace the `lode-runner-lightblue.png` image

Then:

```shell
npx hardhat deploy
```

## Latest deployment

_Goerli // Dec 16, 2022 // 11am_

- [NFT contract](https://goerli.etherscan.io/address/0x8B47B6f462B66b62E22243A6CefEbb5281894F0e#code)
- [Gov contract](https://goerli.etherscan.io/address/0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8#code)
- [Vault contract](https://goerli.etherscan.io/address/0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8#code) ([Github repo](https://github.com/julienbrg/vman/tree/vault))
- [On Tally](https://www.tally.xyz/gov/eip155:5:0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8)
- [Added a new member](https://www.tally.xyz/gov/eip155:5:0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8/proposal/74737614524205492522872223477272223259832790928180497603067039466740454929975) (view [`execute` tx](https://goerli.etherscan.io/tx/0x448090a1894ae462286d16936dea31568bdcb8e2419163847abba05fe504d372) on Etherscan)
- [Voted a new 'constitution'](https://www.tally.xyz/gov/eip155:5:0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8/draft/86d3f17c-95d3-45cd-9f70-37a038deb787) (view [`execute` tx](https://goerli.etherscan.io/tx/0x706a688f90f15ca87489ab7fe9c7f43a262528e080f5f91f8d052551b651c11b) on Etherscan)
- [Banned a member](https://www.tally.xyz/gov/eip155:5:0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8/proposal/96099062218160360479194831606171326344070977529876809123195778620797177507210) (view [`execute` tx](https://goerli.etherscan.io/tx/0x94b985740bbf2c2df7dba547058a968ad72647e88e4d9b6571a91dce9a1e220d) on Etherscan)
- [Simple payment](https://www.tally.xyz/gov/eip155:5:0xdA29B7D299e3a6A77f1ceB2fABC83399ABFc14B8/proposal/71480291215620329031097614919392162006618096196398581448882068916682628149737) (view [`execute` tx](https://goerli.etherscan.io/tx/0x70c2ab2fcccc9e001cf820bd29b37cedae7e7884f55988c0c211b7a24e4143ad) on Etherscan)

## Resources

- [Introducing OpenZeppelin Governor](https://blog.openzeppelin.com/governor-smart-contract/)
- [How to set up on-chain governance](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/docs/modules/ROOT/pages/governance.adoc)
- [Governance section in OpenZeppelin docs](https://docs.openzeppelin.com/contracts/4.x/api/governance)
- [Build Your DAO with OpenZeppelin Governor ft. ENS](https://www.youtube.com/watch?v=Lltt6j6Hmww) (Dec 2021 video)
- [Build your governance easily with OpenZeppelin Contracts]() (Nov 2021 video)
- [Tally Wiki](https://wiki.tally.xyz/docs)
- [A Pocket Guide to DAO Frameworks](https://blog.tally.xyz/a-pocket-guide-to-dao-frameworks-8d7ad5af3a1b) (Oct 2022 post)
- [Build an NFT DAO from Scratch || Tally Tutorial](https://www.youtube.com/watch?v=cAbHwCWJAG4)
- [How to Code an On-Chain DAO](https://betterprogramming.pub/how-to-code-an-on-chain-dao-e525e13a57be) (Feb 2022)

## Versions

- Node [v18.12.1](https://nodejs.org/uk/blog/release/v18.12.1/)
- NPM [v8.19.2](https://github.com/npm/cli/releases/tag/v8.19.2)
- OpenZeppelin Contracts [v4.8.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v4.8.0)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.gg/xw9dCeQ94Y), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
