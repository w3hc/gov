#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting cross-chain deployment process...${NC}\n"

# Deploy to OP Sepolia
echo -e "${BLUE}Deploying to OP Sepolia...${NC}"
if pnpm crosschain:op-sepolia; then
    echo -e "${GREEN}✓ OP Sepolia deployment successful${NC}"
else
    echo -e "${RED}✗ OP Sepolia deployment failed${NC}"
    exit 1
fi

# Wait a bit to ensure deployment is fully confirmed
echo -e "\n${BLUE}Waiting 30 seconds before proceeding to Arbitrum deployment...${NC}"
sleep 30

# Deploy to Arbitrum Sepolia
echo -e "\n${BLUE}Deploying to Arbitrum Sepolia...${NC}"
if pnpm crosschain:arbitrum-sepolia; then
    echo -e "${GREEN}✓ Arbitrum Sepolia deployment successful${NC}"
else
    echo -e "${RED}✗ Arbitrum Sepolia deployment failed${NC}"
    exit 1
fi

# Run verification script
echo -e "\n${BLUE}Running cross-chain setup verification...${NC}"
if pnpm verify:setup; then
    echo -e "${GREEN}✓ Cross-chain setup verification successful${NC}"
    echo -e "\n${GREEN}✓ Deployment and verification completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Cross-chain setup verification failed${NC}"
    exit 1
fi