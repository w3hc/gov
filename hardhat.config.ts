import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-celo";

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

  CELO_TESTNET_ENDPOINT_URL, 
  CELO_TESTNET_PRIVATE_KEY, 
  CELO_ETHERSCAN_API_KEY, 

  CELO_MAINNET_ENDPOINT_URL, 
  CELO_MAINNET_PRIVATE_KEY, 

  GNOSIS_MAINNET_ENDPOINT_URL,
  GNOSIS_MAINNET_PRIVATE_KEY,
  GNOSIS_ETHERSCAN_API_KEY,

  CHIADO_TESTNET_ENDPOINT_URL,
  CHIADO_TESTNET_PRIVATE_KEY,

  BASE_TESTNET_PRIVATE_KEY,
  
  MANTLE_TESTNET_PRIVATE_KEY, 

  ARTHERA_TESTNET_PRIVATE_KEY,

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
  mocha: {
    timeout: 100000
  },
  networks: {
    'hardhat': {
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    'goerli': {
      url: GOERLI_TESTNET_ENDPOINT_URL as string,
      accounts: GOERLI_TESTNET_PRIVATE_KEY !== undefined ? [GOERLI_TESTNET_PRIVATE_KEY] : [],
    },
    'optimism-goerli': {
      url: OPTIMISM_TESTNET_ENDPOINT_URL as string,
      accounts: OPTIMISM_TESTNET_PRIVATE_KEY !== undefined ? [OPTIMISM_TESTNET_PRIVATE_KEY] : [],
      // gasPrice: 35000000000,
    },
    'optimism': {
      url: OPTIMISM_MAINNET_ENDPOINT_URL as string,
      accounts: OPTIMISM_MAINNET_PRIVATE_KEY !== undefined ? [OPTIMISM_MAINNET_PRIVATE_KEY] : [],
    },
    'arbitrum-goerli': {
      url: ARBITRUM_TESTNET_ENDPOINT_URL as string,
      accounts: ARBITRUM_TESTNET_PRIVATE_KEY !== undefined ? [ARBITRUM_TESTNET_PRIVATE_KEY] : [],
    },
    'alfajores': {
      url: CELO_TESTNET_ENDPOINT_URL as string,
      accounts: CELO_TESTNET_PRIVATE_KEY !== undefined ? [CELO_TESTNET_PRIVATE_KEY] : [],
      chainId: 44787
    },
    'celo': {
      url: CELO_MAINNET_ENDPOINT_URL as string,
      accounts: CELO_MAINNET_PRIVATE_KEY !== undefined ? [CELO_MAINNET_PRIVATE_KEY] : [],
    },
    'gnosis': {
      url: GNOSIS_MAINNET_ENDPOINT_URL as string,
      accounts: GNOSIS_MAINNET_PRIVATE_KEY !== undefined ? [GNOSIS_MAINNET_PRIVATE_KEY] : [],
      // gasPrice: 1000000000,
    },
    'chiado': {
      url: CHIADO_TESTNET_ENDPOINT_URL as string,
      accounts: CHIADO_TESTNET_PRIVATE_KEY !== undefined ? [CHIADO_TESTNET_PRIVATE_KEY] : [],
      gasPrice: 1000000000,
    },
    'base-goerli': {
      url: 'https://goerli.base.org',
      accounts: [process.env.BASE_TESTNET_PRIVATE_KEY as string],
    },
    "mantle-testnet": {
      url: "https://rpc.testnet.mantle.xyz/",
      accounts: MANTLE_TESTNET_PRIVATE_KEY !== undefined ? [MANTLE_TESTNET_PRIVATE_KEY] : [],
    },
    'arthera-testnet': {
      url: 'https://rpc-test.arthera.net',
      chainId: 10243,
      accounts: ARTHERA_TESTNET_PRIVATE_KEY !== undefined ? [ARTHERA_TESTNET_PRIVATE_KEY] : []
    },
  }, 
  etherscan: {
    apiKey: {
      goerli: GOERLI_ETHERSCAN_API_KEY || "",
      optimisticGoerli: OPTIMISM_ETHERSCAN_API_KEY || "",
      optimisticEthereum: OPTIMISM_ETHERSCAN_API_KEY || "",
      arbitrumGoerli: ARBITRUM_ETHERSCAN_API_KEY || "",
      alfajores: CELO_ETHERSCAN_API_KEY || "",
      celo: CELO_ETHERSCAN_API_KEY || "",
      gnosis: GNOSIS_ETHERSCAN_API_KEY || "",
      chiado: GNOSIS_ETHERSCAN_API_KEY || "",
      "base-goerli": "PLACEHOLDER_STRING" || "",
    },
    customChains: [
      {
        network: "base-goerli",
        chainId: 84531,
        urls: {
         apiURL: "https://api-goerli.basescan.org/api",
         browserURL: "https://goerli.basescan.org"
        }
      }
    ]
  },
};

export default config;
