#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting cross-chain metadata update process...${NC}\n"

# Create proposal on OP Sepolia
echo -e "\n${BLUE}Creating metadata update proposal on OP Sepolia...${NC}"
if npx hardhat run scripts/propose-metadata.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Metadata update proposal creation successful${NC}"
else
    echo -e "${RED}✗ Metadata update proposal creation failed${NC}"
    exit 1
fi

# Generate metadata proof from OP Sepolia
echo -e "\n${BLUE}Generating metadata proof from OP Sepolia...${NC}"
if npx hardhat run scripts/verify-metadata-proof.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Metadata proof generation successful${NC}"
else
    echo -e "${RED}✗ Metadata proof generation failed${NC}"
    exit 1
fi

# Claim metadata update on Arbitrum Sepolia
echo -e "\n${BLUE}Claiming metadata update on Arbitrum Sepolia...${NC}"
if npx hardhat run scripts/claim-metadata.ts --network arbitrum-sepolia; then
    echo -e "${GREEN}✓ Metadata update claim successful${NC}"
    echo -e "\n${GREEN}✓ All metadata update steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Metadata update claim failed${NC}"
    exit 1
fi