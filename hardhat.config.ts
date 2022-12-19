import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";
import '@openzeppelin/hardhat-upgrades';

dotenv.config();

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
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    goerli: {
      url: process.env.GOERLI_TESTNET_RPC_URL || "",
      accounts:
        process.env.DEPLOYER_DAO_TESTER_PRIVATE_KEY !== undefined ? [process.env.DEPLOYER_DAO_TESTER_PRIVATE_KEY] : [],
    },
  }, 
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
