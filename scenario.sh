#!/bin/bash

pnpm test

pnpm crosschain:sepolia
pnpm crosschain:opSepolia
pnpm crosschain:baseSepolia
pnpm crosschain:arbitrumSepolia

npx hardhat run scripts/check-token-existence.ts

npx hardhat run scripts/propose.ts --network sepolia

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
npx hardhat run scripts/claim-membership.ts --network baseSepolia
npx hardhat run scripts/claim-membership.ts --network arbitrumSepolia

npx hardhat run scripts/check-token-existence.ts --network sepolia

sed -i.bak '/^TOKENID=/d' .env
echo "TOKENID=2" >> .env
source .env

npx hardhat run scripts/verify-metadata-proof.ts --network sepolia
source .env
npx hardhat run scripts/claim-metadata-update.ts --network opSepolia