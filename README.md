# Gov

A minimalist onchain voting system built on [OpenZeppelin Governor contracts](https://docs.openzeppelin.com/contracts/5.x/api/governance).

## Motivation

Provide a coordination tool that fits the needs of everyday people. 

## Features

### Membership & Voting
- **One member, one vote**: Each NFT grants exactly one vote in governance
- **Non-transferable membership**: NFTs cannot be transferred between addresses
- **Self-delegation by default**: Members automatically delegate voting power to themselves upon receiving membership
- **Vote delegation**: Members can delegate their voting power to other addresses
- **Membership enumeration**: Track all current members via ERC721Enumerable

### Governance
- **Proposal creation & tracking**: Submit and track governance proposals with full history
- **Simple majority voting**: For/Against/Abstain voting with GovernorCountingSimple
- **Proposal execution**: Automatic execution of passed proposals with arbitrary contract calls
- **Configurable parameters**: Adjust voting delay, voting period, proposal threshold, and quorum
- **Parameter updates via governance**: All governance parameters can be updated through governance votes
- **Manifesto management**: Store and update DAO manifesto (IPFS CID) via governance

### Access Control
- **Operator role**: Designated address can onboard new members without governance approval
- **Operator expiration**: Configurable time parameter for operator actions
- **Operator management**: Change or revoke operator through governance vote
- **Governance-controlled minting**: Owner (governance) can mint new memberships
- **Membership revocation**: Burn member NFTs through governance vote
- **Metadata updates**: Update member NFT metadata via governance

> ⚠️ WARNING: The **`operator`** is a significant trust assumption. Until expiry, the operator can mint arbitrarily many memberships — effectively manufacturing votes for future proposals. It is designed to allow a third-party app to easily add new members. If you don't need that, you can disable the operator entirely or set a very short expiration period.

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Deploy

The deployment script reads configuration from [config/dao.config.json](config/dao.config.json). Edit this file to customize:

- **NFT parameters**: `nftName`, `nftSymbol`, `tokenURI`
- **Governance parameters**: `govName`, `manifestoCid`, `votingDelay`, `votingPeriod`, `proposalThreshold`, `quorum`
- **Initial members**: Array of addresses to receive membership NFTs

Launch Anvil local network: 

```shell
anvil
```

Then in a new terminal: 

```shell
forge script script/Deploy.s.sol --rpc-url local --broadcast
```

## Crosschain Gov

[Crosschain Gov](https://github.com/w3hc/gov-crosschain) allows you to deploy your DAO to any EVM network. 

## License

GPL-3.0

## Contact

https://julienberanger.com/contact