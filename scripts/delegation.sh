#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting cross-chain delegation process...${NC}\n"

# Create delegation on OP Sepolia (home chain)
echo -e "\n${BLUE}Creating delegation on OP Sepolia...${NC}"
if npx hardhat run scripts/propose-delegation.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Delegation creation successful${NC}"
else
    echo -e "${RED}✗ Delegation creation failed${NC}"
    exit 1
fi

# Generate delegation proof from OP Sepolia
echo -e "\n${BLUE}Generating delegation proof from OP Sepolia...${NC}"
if npx hardhat run scripts/verify-delegation-proof.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Delegation proof generation successful${NC}"
else
    echo -e "${RED}✗ Delegation proof generation failed${NC}"
    exit 1
fi

# Claim delegation on Arbitrum Sepolia
echo -e "\n${BLUE}Claiming delegation on Arbitrum Sepolia...${NC}"
if npx hardhat run scripts/claim-delegation.ts --network arbitrum-sepolia; then
    echo -e "${GREEN}✓ Delegation claim successful${NC}"
    echo -e "\n${GREEN}✓ All delegation steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Delegation claim failed${NC}"
    exit 1
fi