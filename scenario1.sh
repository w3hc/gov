#!/bin/bash

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# echo -e "${BLUE}Starting cross-chain deployment process...${NC}\n"

# # Deploy to OP Sepolia
# echo -e "${BLUE}Deploying to OP Sepolia...${NC}"
# if pnpm crosschain:op-sepolia; then
#     echo -e "${GREEN}✓ OP Sepolia deployment successful${NC}"
# else
#     echo -e "${RED}✗ OP Sepolia deployment failed${NC}"
#     exit 1
# fi

# # Wait a bit to ensure deployment is fully confirmed
# echo -e "\n${BLUE}Waiting 30 seconds before proceeding to Arbitrum deployment...${NC}"
# sleep 30

# # Deploy to Arbitrum Sepolia
# echo -e "\n${BLUE}Deploying to Arbitrum Sepolia...${NC}"
# if pnpm crosschain:arbitrum-sepolia; then
#     echo -e "${GREEN}✓ Arbitrum Sepolia deployment successful${NC}"
# else
#     echo -e "${RED}✗ Arbitrum Sepolia deployment failed${NC}"
#     exit 1
# fi

# # Wait for deployment to be fully confirmed
# echo -e "\n${BLUE}Waiting 30 seconds before running verification...${NC}"
# sleep 30

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

# Create proposal on OP Sepolia
echo -e "\n${BLUE}Creating proposal on OP Sepolia...${NC}"
if npx hardhat run scripts/propose.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Proposal creation successful${NC}"
    echo -e "\n${GREEN}✓ Deployment, verification, and proposal creation completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Proposal creation failed${NC}"
    exit 1
fi

# Generate proof from OP Sepolia
echo -e "\n${BLUE}Generating proof from OP Sepolia...${NC}"
if npx hardhat run scripts/verify-proof.ts --network op-sepolia; then
    echo -e "${GREEN}✓ Proof generation successful${NC}"
else
    echo -e "${RED}✗ Proof generation failed${NC}"
    exit 1
fi

# Claim membership on Arbitrum Sepolia
echo -e "\n${BLUE}Claiming membership on Arbitrum Sepolia...${NC}"
if npx hardhat run scripts/claim-membership.ts --network arbitrum-sepolia; then
    echo -e "${GREEN}✓ Membership claim successful${NC}"
    echo -e "\n${GREEN}✓ All steps completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Membership claim failed${NC}"
    exit 1
fi