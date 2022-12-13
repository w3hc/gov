# Signed Sealed Delivered

Exploring Open Zeppelin's [Governor contract](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/docs/modules/ROOT/pages/governance.adoc) in combination with NFTs.

I used [https://wizard.openzeppelin.com/](https://wizard.openzeppelin.com/) to write 2 contracts:

- `SSD.sol` is the Governor contract
- `Sugar.sol` is the NFT contract

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

Then deploy your Governor contract:

```shell
npx hardhat run scripts/deployGovernor.ts --network goerli
```

## Resources

- [Introducing OpenZeppelin Governor](https://blog.openzeppelin.com/governor-smart-contract/)
- [How to set up on-chain governance](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/docs/modules/ROOT/pages/governance.adoc)
- [Governance section in OpenZeppelin docs](https://docs.openzeppelin.com/contracts/4.x/api/governance)
- [Build Your DAO with OpenZeppelin Governor ft. ENS](https://www.youtube.com/watch?v=Lltt6j6Hmww) (Dec 2021 video)
- [Build your governance easily with OpenZeppelin Contracts]() (Nov 2021 video)
- [Tally Wiki](https://wiki.tally.xyz/docs)
- [A Pocket Guide to DAO Frameworks](https://blog.tally.xyz/a-pocket-guide-to-dao-frameworks-8d7ad5af3a1b) (Oct 2022 post)
- [Build an NFT DAO from Scratch || Tally Tutorial](https://www.youtube.com/watch?v=cAbHwCWJAG4)

## Support

You can contact me via [Element](https://matrix.to/#/@julienbrg:matrix.org), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discord.gg/xw9dCeQ94Y), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).
