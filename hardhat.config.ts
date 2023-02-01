import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";

dotenv.config();

const { 

  GOERLI_TESTNET_ENDPOINT_URL, 
  GOERLI_TESTNET_PRIVATE_KEY, 
  GOERLI_ETHERSCAN_API_KEY, 

  OPTIMISM_TESTNET_ENDPOINT_URL,
  OPTIMISM_TESTNET_PRIVATE_KEY,
  OPTIMISM_ETHERSCAN_API_KEY, 

  OPTIMISM_MAINNET_ENDPOINT_URL,
  OPTIMISM_MAINNET_PRIVATE_KEY,

  ARBITRUM_TESTNET_ENDPOINT_URL,
  ARBITRUM_TESTNET_PRIVATE_KEY,
  ARBITRUM_ETHERSCAN_API_KEY,

} = process.env;

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
      url: GOERLI_TESTNET_ENDPOINT_URL || "",
      accounts: GOERLI_TESTNET_PRIVATE_KEY !== undefined ? [GOERLI_TESTNET_PRIVATE_KEY] : [],
    },
    'optimism-goerli': {
      url: OPTIMISM_TESTNET_ENDPOINT_URL || "",
      accounts: OPTIMISM_TESTNET_PRIVATE_KEY !== undefined ? [OPTIMISM_TESTNET_PRIVATE_KEY] : [],
    },
    'optimism': {
      url: OPTIMISM_MAINNET_ENDPOINT_URL || "",
      accounts: OPTIMISM_MAINNET_PRIVATE_KEY !== undefined ? [OPTIMISM_MAINNET_PRIVATE_KEY] : [],
    },
    'arbitrum-goerli': {
      url: ARBITRUM_TESTNET_ENDPOINT_URL || "",
      accounts: ARBITRUM_TESTNET_PRIVATE_KEY !== undefined ? [ARBITRUM_TESTNET_PRIVATE_KEY] : [],
    },
  }, 
  etherscan: {
    apiKey: {
      goerli: GOERLI_ETHERSCAN_API_KEY || "",
      optimismGoerli: OPTIMISM_ETHERSCAN_API_KEY || "",
      optimism: OPTIMISM_ETHERSCAN_API_KEY || "",
      arbitrumGoerli: ARBITRUM_ETHERSCAN_API_KEY || "",
    }
  },
};

export default config;
