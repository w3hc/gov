#!/bin/bash
set -e

# Default salt
SALT="Dec-25-v1"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --salt) SALT="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Export salt as an environment variable
export SALT

echo "Deploying with salt: $SALT"

# Deploy to OP Sepolia and Arbitrum Sepolia
pnpm crosschain:op-sepolia
pnpm crosschain:arbitrum-sepolia
pnpm crosschain:base-sepolia

# Verify setup
pnpm verify:setup

# Add a new member 
npx hardhat run scripts/propose.ts --network op-sepolia
npx hardhat run scripts/verify-proof.ts --network op-sepolia
npx hardhat run scripts/claim-membership.ts --network arbitrum-sepolia
npx hardhat run scripts/claim-membership.ts --network base-sepolia

# Ban a member
npx hardhat run scripts/propose-burn.ts --network op-sepolia
npx hardhat run scripts/verify-burn-proof.ts --network op-sepolia
npx hardhat run scripts/claim-burn.ts --network arbitrum-sepolia
npx hardhat run scripts/claim-burn.ts --network base-sepolia

# Edit 1 membership NFT metadata
npx hardhat run scripts/propose-metadata.ts --network op-sepolia
npx hardhat run scripts/verify-metadata-proof.ts --network op-sepolia
npx hardhat run scripts/claim-metadata.ts --network arbitrum-sepolia
npx hardhat run scripts/claim-metadata.ts --network base-sepolia

# Edit the manifesto
npx hardhat run scripts/propose-manifesto.ts --network op-sepolia
npx hardhat run scripts/verify-manifesto-proof.ts --network op-sepolia
npx hardhat run scripts/claim-manifesto.ts --network arbitrum-sepolia
npx hardhat run scripts/claim-manifesto.ts --network base-sepolia

# Change 1 voting parameter
npx hardhat run scripts/propose-voting-delay.ts --network op-sepolia
npx hardhat run scripts/verify-voting-delay-proof.ts --network op-sepolia
npx hardhat run scripts/claim-voting-delay.ts --network arbitrum-sepolia
npx hardhat run scripts/claim-voting-delay.ts --network base-sepolia

# Change delegation
npx hardhat run scripts/propose-delegation.ts --network op-sepolia
npx hardhat run scripts/verify-delegation-proof.ts --network op-sepolia
npx hardhat run scripts/claim-delegation.ts --network arbitrum-sepolia
npx hardhat run scripts/claim-delegation.ts --network base-sepolia
```