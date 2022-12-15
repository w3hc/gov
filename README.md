# Signed Sealed Delivered

Exploring Open Zeppelin's [Governor contract](https://docs.openzeppelin.com/contracts/4.x/governance#governor) in combination with NFTs.

- `SSD.sol` is the **Governor** contract
- `Sugar.sol` is the **NFT** contract

## Features

- DAO membership NFTS (ERC-721)
- On-chain voting system (Governor)
- Members vote to add or ban a member
- Easy to config, deploy and run
- Fully compatible with [Tally](https://www.tally.xyz/), [Safe](https://gnosis-safe.io/) and [Hypercerts](https://hypercerts.xyz/)
- Extreme composability/modularity
- Upgradeable/evolutive (UUPS)
- Upgradeable governance settings
- 24/7 tech support

## Install

```shell
npm i
```

## Test

```shell
npx hardhat test
```

## Deploy

Create a `.env` on the model of `.env.example` and add your own keys.

Deploy your NFT contract:

```shell
npx hardhat run scripts/deployNFT.ts --network goerli
```

It will create a `store.json` file in your root directory.

Deploy your Governor contract:

```shell
npx hardhat run scripts/deployGovernor.ts --network goerli
```

Then, transfer the ownership of the NFT contract to the Governor contract:

```shell
npx hardhat run scripts/transferOwnership.ts --network goerli
```

## Deployments

#### Goerli // Dec 13, 2022 // 8am

- NFT contract (unverified): https://goerli.etherscan.io/address/0x1a2c4c1f092d02c7683e54fc3c2b1e2f9a64b0c2
- Gov contract: https://goerli.etherscan.io/address/0x21d19998062af0de5183963ff3adc1437b3f570a
- On Tally: https://www.tally.xyz/gov/eip155:5:0x21d19998062AF0dE5183963ff3aDc1437B3F570a
- A proposal: https://www.tally.xyz/gov/eip155:5:0x21d19998062AF0dE5183963ff3aDc1437B3F570a/proposal/83119082379285251585647399325637927665704855498295070431660405074826084622923

#### Goerli // Dec 13, 2022 // 3pm

- NFT contract: https://goerli.etherscan.io/address/0x38D7C280212CCd69BC52B615aA1f297aD3251e6e#code
- Gov contract: https://goerli.etherscan.io/address/0x046206f6371DfEa5be8AB2aC212f029576220e4F#code
- On Tally: https://www.tally.xyz/gov/eip155:5:0x046206f6371DfEa5be8AB2aC212f029576220e4F

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
