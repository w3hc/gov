#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting cross-chain burn process...${NC}\n"

# Create proposal on OP Sepolia
echo -e "\n${BLUE}Creating burn proposal on OP Sepolia...${NC}"
if npx hardhat run scripts/propose-burn.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Burn proposal creation successful${NC}"
else
    echo -e "${RED}✗ Burn proposal creation failed${NC}"
    exit 1
fi

# Generate burn proof from OP Sepolia
echo -e "\n${BLUE}Generating burn proof from OP Sepolia...${NC}"
if npx hardhat run scripts/verify-burn-proof.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Burn proof generation successful${NC}"
else
    echo -e "${RED}✗ Burn proof generation failed${NC}"
    exit 1
fi

# Claim burn on Arbitrum Sepolia
echo -e "\n${BLUE}Claiming burn on Arbitrum Sepolia...${NC}"
if npx hardhat run scripts/claim-burn.ts --network arbitrum-sepolia; then
    echo -e "${GREEN}✓ Burn claim successful${NC}"
    echo -e "\n${GREEN}✓ All burn steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Burn claim failed${NC}"
    exit 1
fi