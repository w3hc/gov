#!/bin/bash

pnpm test

pnpm crosschain:sepolia

pnpm crosschain:opSepolia

echo "Checking token existence..."
npx hardhat run scripts/check-token-existence.ts

echo "Creating proposal..."
npx hardhat run scripts/propose.ts --network sepolia

# export TOKENID=2

npx hardhat run scripts/check-token-existence.ts

Load the TOKENID from .env
if [ -f .env ]; then
    source .env
    if [ -z "$TOKENID" ]; then
        echo "Error: TOKENID not found in .env file"
        exit 1
    fi
    echo "Using Token ID: $TOKENID"
else
    echo "Error: .env file not found"
    exit 1
fi

# Verify proof
echo "Verifying proof..."
npx hardhat run scripts/verify-proof.ts --network sepolia

# Load and display the proof from .env file
if [ -f .env ]; then
    source .env
fi

echo "Claiming proof..."
npx hardhat run scripts/claim-membership.ts --network opSepolia

# Check token existence
npx hardhat run scripts/check-token-existence.ts --network sepolia

sed -i.bak '/^TOKENID=/d' .env
echo "TOKENID=0" >> .env
source .env

echo "Using Token ID: $TOKENID"

npx hardhat run scripts/verify-metadata-proof.ts --network sepolia

npx hardhat run scripts/claim-metadata-update.ts --network opSepolia