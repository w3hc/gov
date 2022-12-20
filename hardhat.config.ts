import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";

dotenv.config();
const { GOERLI_TESTNET_RPC_URL, DEPLOYER_DAO_TESTER_PRIVATE_KEY, ETHERSCAN_API_KEY, OPTIMISM_TESTNET_RPC_URL, ETHERSCAN_OPTIMISM_API_KEY } =
  process.env;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    'hardhat': {
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    'goerli': {
      url: GOERLI_TESTNET_RPC_URL || "",
      accounts: DEPLOYER_DAO_TESTER_PRIVATE_KEY !== undefined ? [DEPLOYER_DAO_TESTER_PRIVATE_KEY] : [],
    },
    'optimism-goerli': {
      url: OPTIMISM_TESTNET_RPC_URL,
      accounts: DEPLOYER_DAO_TESTER_PRIVATE_KEY !== undefined ? [DEPLOYER_DAO_TESTER_PRIVATE_KEY] : [],
    },
    'optimism': {
      url: "https://mainnet.optimism.io",
      accounts: DEPLOYER_DAO_TESTER_PRIVATE_KEY !== undefined ? [DEPLOYER_DAO_TESTER_PRIVATE_KEY] : [],
    },
  }, 
  etherscan: {
    // apiKey: ETHERSCAN_API_KEY,
    apiKey: ETHERSCAN_OPTIMISM_API_KEY,
  },
};

export default config;
