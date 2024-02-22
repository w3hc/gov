import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-verify"
import "hardhat-deploy"
import * as dotenv from "dotenv"
dotenv.config()

const {
    SEPOLIA_RPC_ENDPOINT_URL,
    SEPOLIA_PRIVATE_KEY,
    ETHERSCAN_API_KEY,
    ARTHERA_TESTNET_RPC_ENDPOINT_URL,
    ARTHERA_TESTNET_PRIVATE_KEY,
    OP_SEPOLIA_RPC_ENDPOINT_URL,
    OP_SEPOLIA_PRIVATE_KEY,
    OP_ETHERSCAN_API_KEY,
    ARTHERA_MAINNET_RPC_ENDPOINT_URL,
    ARTHERA_MAINNET_PRIVATE_KEY
} = process.env

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: 0
    },
    networks: {
        hardhat: {
            chainId: 1337,
            allowUnlimitedContractSize: true
        },
        arthera: {
            chainId: 10242,
            url: ARTHERA_MAINNET_RPC_ENDPOINT_URL || "https://rpc.arthera.net",
            accounts:
                ARTHERA_MAINNET_PRIVATE_KEY !== undefined
                    ? [ARTHERA_MAINNET_PRIVATE_KEY]
                    : []
        },
        sepolia: {
            chainId: 11155111,
            url:
                SEPOLIA_RPC_ENDPOINT_URL ||
                "https://ethereum-sepolia.publicnode.com",
            accounts:
                SEPOLIA_PRIVATE_KEY !== undefined ? [SEPOLIA_PRIVATE_KEY] : []
        },
        "op-sepolia": {
            chainId: 11155420,
            url:
                OP_SEPOLIA_RPC_ENDPOINT_URL ||
                "https://ethereum-sepolia.publicnode.com",
            accounts:
                OP_SEPOLIA_PRIVATE_KEY !== undefined
                    ? [OP_SEPOLIA_PRIVATE_KEY]
                    : []
            // gasPrice: 5000000000
        },
        "arthera-testnet": {
            chainId: 10243,
            url:
                ARTHERA_TESTNET_RPC_ENDPOINT_URL ||
                "https://rpc-test.arthera.net",
            accounts:
                ARTHERA_TESTNET_PRIVATE_KEY !== undefined
                    ? [ARTHERA_TESTNET_PRIVATE_KEY]
                    : []
        }
    },
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    etherscan: {
        apiKey: {
            sepolia: ETHERSCAN_API_KEY || "",
            "op-sepolia": OP_ETHERSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "op-sepolia",
                chainId: 11155420,
                urls: {
                    apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
                    browserURL: "https://sepolia-optimism.etherscan.io"
                }
            }
        ]
    }
}

export default config
