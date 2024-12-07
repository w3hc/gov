#!/bin/bash

# pnpm test

# pnpm crosschain:sepolia

# pnpm crosschain:opSepolia

npx hardhat run scripts/check-token-existence.ts

npx hardhat run scripts/propose.ts --network sepolia

# Load the TOKENID from .env
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

npx hardhat run scripts/verify-proof.ts --network sepolia

source .env

if [ -z "$PROOF" ]; then
    echo "Error: No proof generated"
    exit 1
fi

npx hardhat run scripts/claim-membership.ts --network opSepolia

npx hardhat run scripts/check-token-existence.ts --network sepolia

# sed -i.bak '/^TOKENID=/d' .env
# echo "TOKENID=0" >> .env
# source .env

# npx hardhat run scripts/verify-metadata-proof.ts --network sepolia

# npx hardhat run scripts/claim-metadata-update.ts --network opSepolia