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

Make sure that the deployer wallet address is funded on each notwork you want to deploy to: 

```
pnpm bal
```

Then, you can go ahead and deploy: 

```bash
pnpm crosschain:sepolia
pnpm crosschain:opSepolia
pnpm crosschain:baseSepolia
pnpm crosschain:arbitrumSepolia
```

Your DAO will be deployed on every networks at the same address (watch the [Asciinema video](https://asciinema.org/a/rc8bTqbBiW7e0xevewxCwCP7C)).

Then you can follow these steps to verify that proofs can be generated on home chain and claimed on foreign chain: 

```bash

# Watch the [Asciinema video](https://asciinema.org/a/1iZZQVKU51U86hzYYLfjSVtw6)
npx hardhat run scripts/propose.ts --network sepolia
npx hardhat run scripts/verify-proof.ts --network sepolia
npx hardhat run scripts/claim-membership.ts --network opSepolia
npx hardhat run scripts/claim-membership.ts --network baseSepolia
npx hardhat run scripts/claim-membership.ts --network arbitrumSepolia

npx hardhat run scripts/gov-burn.ts --network sepolia
npx hardhat run scripts/verify-gov-burn-proof.ts --network sepolia
npx hardhat run scripts/claim-gov-burn.ts --network opSepolia

npx hardhat run scripts/verify-metadata-proof.ts --network sepolia
npx hardhat run scripts/claim-metadata-update.ts --network opSepolia

npx hardhat run scripts/verify-manifesto-proof.ts --network sepolia
npx hardhat run scripts/claim-manifesto-update.ts --network opSepolia

npx hardhat run scripts/gov-voting-delay.ts --network sepolia
npx hardhat run scripts/verify-voting-delay-proof.ts --network sepolia
npx hardhat run scripts/claim-voting-delay.ts --network opSepolia

npx hardhat run scripts/verify-delegation-proof.ts --network sepolia
npx hardhat run scripts/claim-delegation.ts --network opSepolia
``` 

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
| Sepolia Testnet | 11155111 | [Documentation](https://ethereum.org/nb/developers/docs/networks/#sepolia) |
| OP Sepolia Testnet | 11155420 | [Documentation](https://docs.optimism.io/chain/networks#opSepolia) |
| Base Sepolia Testnet | 84532 | [Documentation](https://docs.base.org/docs/network-information/#base-testnet-sepolia) |

## Core Dependencies

-   Node [v20.9.0](https://nodejs.org/uk/blog/release/v20.9.0/)
-   PNPM [v9.10.0](https://pnpm.io/pnpm-vs-npm)
-   Hardhat [v2.22.16](https://github.com/NomicFoundation/hardhat/releases/)
-   OpenZeppelin Contracts [v5.1.0](https://github.com/OpenZeppelin/openzeppelin-contracts/releases/tag/v5.1.0)
-   Ethers [v6.13.4](https://docs.ethers.org/v6/)

## Support

Feel free to reach out to [Julien](https://github.com/julienbrg): [Farcaster](https://warpcast.com/julien-), [Element](https://matrix.to/#/@julienbrg:matrix.org), [Status](https://status.app/u/iwSACggKBkp1bGllbgM=#zQ3shmh1sbvE6qrGotuyNQB22XU5jTrZ2HFC8bA56d5kTS2fy), [Telegram](https://t.me/julienbrg), [Twitter](https://twitter.com/julienbrg), [Discord](https://discordapp.com/users/julienbrg), or [LinkedIn](https://www.linkedin.com/in/julienberanger/).