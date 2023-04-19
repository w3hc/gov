# Plugins

## Motivation

Take advantage of the modularity of Gov.

## Deployment

- Deploy the one of the plugins (there's no deployment script available yet)
- Transfer the ownership of the contract to Gov

Once you've done that, any function marked `onlyOwner` is only accessible by Gov, meaning **it can only be triggered by a vote**.

## Contracts

### [HypercertsMock.sol](https://github.com/w3hc/gov/blob/main/contracts/mocks/ERC1155Mock.sol)

For now, I'm using an ERC-721 to mimick the behavior of [Hypercerts](https://network-goods.github.io/hypercerts-docs/), which is using [ERC-3525](https://eips.ethereum.org/EIPS/eip-3525). A future integration of Hypercerts is being considered.

A hypercert represents the contribution verified and voted by the DAO members. Fractions are automatically put for sale.

### [Shop.sol](https://github.com/w3hc/gov/blob/main/contracts/plugins/Shop.sol)

Allows to buy a fraction of a hypercert. The proceeds are automatically transferred to the the vault, meaning they can be withdrawn by the donors.

### [Vault.sol](https://github.com/w3hc/gov/blob/main/contracts/plugins/Vault.sol)

Supports USDC only.

Allow donors to take back their donation when they want to. If the DAO spent some funds in the meantime, they can withdraw USDC proportionally to what's left in the vault.

Those who donated to the vault can either withdraw the proceeds (USDC) or withdraw a fraction of the hypercert.

Please note that Gov is already fully compatible with [Gnosis Safe](https://help.tally.xyz/article/42-what-is-a-gnosis-safe).

### [Vault2](https://github.com/w3hc/gov/blob/main/contracts/plugins/Vault2.sol)

A vault that's using [ERC-4626](https://eips.ethereum.org/EIPS/eip-4626) (tokenized vaults standard).