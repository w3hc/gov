#!/bin/bash

# Run unit tests
# echo "Running unit tests..."
# pnpm test

# Run crosschain deployment scripts
# echo "Deploying to Sepolia..."
# pnpm crosschain:sepolia

# echo "Deploying to Optimism Sepolia..."
# pnpm crosschain:opSepolia

# Check token existence
# echo "Checking token existence..."
# npx hardhat run scripts/check-token-existence.ts

# Run proposal script
# echo "Creating proposal..."
# npx hardhat run scripts/propose.ts --network sepolia

# Check token existence
echo "Checking token existence..."
npx hardhat run scripts/check-token-existence.ts

# Set token ID
export TOKENID=5

# Verify proof
echo "Verifying proof..."
npx hardhat run scripts/verify-proof.ts --network sepolia

# Load and display the proof from .env file
if [ -f .env ]; then
    source .env
    echo -e "\nGenerated Proof:"
    echo $PROOF
else
    echo "Error: .env file not found"
fi

echo "Claiming proof..."
npx hardhat run scripts/claim-membership.ts --network opSepolia

# Check token existence
echo "Checking token existence..."
npx hardhat run scripts/check-token-existence.ts --network sepolia