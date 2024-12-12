#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting cross-chain voting delay update process...${NC}\n"

# Create proposal on OP Sepolia
echo -e "\n${BLUE}Creating voting delay update proposal on OP Sepolia...${NC}"
if npx hardhat run scripts/propose-voting-delay.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Voting delay update proposal creation successful${NC}"
else
    echo -e "${RED}✗ Voting delay update proposal creation failed${NC}"
    exit 1
fi

# Generate voting delay proof from OP Sepolia
echo -e "\n${BLUE}Generating voting delay proof from OP Sepolia...${NC}"
if npx hardhat run scripts/verify-voting-delay-proof.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Voting delay proof generation successful${NC}"
else
    echo -e "${RED}✗ Voting delay proof generation failed${NC}"
    exit 1
fi

# Claim voting delay update on Arbitrum Sepolia
echo -e "\n${BLUE}Claiming voting delay update on Arbitrum Sepolia...${NC}"
if npx hardhat run scripts/claim-voting-delay.ts --network arbitrum-sepolia; then
    echo -e "${GREEN}✓ Voting delay update claim successful${NC}"
    echo -e "\n${GREEN}✓ All voting delay update steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Voting delay update claim failed${NC}"
    exit 1
fi