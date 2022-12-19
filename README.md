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
2. In the `/metadata` directory, edit the `MANIFESTO.md` file and replace `image.png`

Then:

```shell
npx hardhat deploy
```

## Latest deployment

Deployed to Goerli on Dec 19, 2022 at 1.50pm UTC:

- Gov: [0xF2E65cb449b75b8DF34F24AEDD1f4Ef4b4339597](https://goerli.etherscan.io/address/0xF2E65cb449b75b8DF34F24AEDD1f4Ef4b4339597#code)
- NFT: [0x0B87DFd4B39F19912De22100e2c65FB01ed331A9](https://goerli.etherscan.io/address/0x0B87DFd4B39F19912De22100e2c65FB01ed331A9#code)
- Manifesto: [0x57e0Fd5a712930Fc45346e6999c58D89be07768D](https://goerli.etherscan.io/address/0x57e0Fd5a712930Fc45346e6999c58D89be07768D#code)

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
