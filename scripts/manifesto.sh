#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting cross-chain manifesto update process...${NC}\n"

# Create proposal on OP Sepolia
echo -e "\n${BLUE}Creating manifesto update proposal on OP Sepolia...${NC}"
if npx hardhat run scripts/propose-manifesto.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Manifesto update proposal creation successful${NC}"
else
    echo -e "${RED}✗ Manifesto update proposal creation failed${NC}"
    exit 1
fi

# Generate manifesto proof from OP Sepolia
echo -e "\n${BLUE}Generating manifesto proof from OP Sepolia...${NC}"
if npx hardhat run scripts/verify-manifesto-proof.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Manifesto proof generation successful${NC}"
else
    echo -e "${RED}✗ Manifesto proof generation failed${NC}"
    exit 1
fi

# Claim manifesto update on Arbitrum Sepolia
echo -e "\n${BLUE}Claiming manifesto update on Arbitrum Sepolia...${NC}"
if npx hardhat run scripts/claim-manifesto.ts --network arbitrum-sepolia; then
    echo -e "${GREEN}✓ Manifesto update claim successful${NC}"
    echo -e "\n${GREEN}✓ All manifesto update steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Manifesto update claim failed${NC}"
    exit 1
fi
