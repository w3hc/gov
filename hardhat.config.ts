import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@nomicfoundation/hardhat-verify"
import "hardhat-deploy"
import * as dotenv from "dotenv"
dotenv.config()

const {
    SIGNER_PRIVATE_KEY,
    OPTIMISM_MAINNET_RPC_ENDPOINT_URL,
    OP_ETHERSCAN_API_KEY,
    BASE_MAINNET_RPC_ENDPOINT_URL,
    BASE_ETHERSCAN_API_KEY,
    SEPOLIA_RPC_ENDPOINT_URL,
    ETHERSCAN_API_KEY,
    OP_SEPOLIA_RPC_ENDPOINT_URL,
    BASE_SEPOLIA_RPC_ENDPOINT_URL
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
        sepolia: {
            chainId: 11155111,
            url:
                SEPOLIA_RPC_ENDPOINT_URL ||
                "https://ethereum-sepolia.publicnode.com",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        optimism: {
            chainId: 10,
            url:
                OPTIMISM_MAINNET_RPC_ENDPOINT_URL ||
                "https://mainnet.optimism.io",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        base: {
            chainId: 8453,
            url: BASE_MAINNET_RPC_ENDPOINT_URL || "https://mainnet.base.org",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        "op-sepolia": {
            chainId: 11155420,
            url:
                OP_SEPOLIA_RPC_ENDPOINT_URL ||
                "https://ethereum-sepolia.publicnode.com",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
        },
        "base-sepolia": {
            chainId: 84532,
            url: BASE_SEPOLIA_RPC_ENDPOINT_URL || "https://sepolia.base.org",
            accounts:
                SIGNER_PRIVATE_KEY !== undefined ? [SIGNER_PRIVATE_KEY] : []
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
    sourcify: {
        enabled: true
    },
    etherscan: {
        apiKey: {
            optimism: OP_ETHERSCAN_API_KEY || "",
            base: BASE_ETHERSCAN_API_KEY || "",
            sepolia: ETHERSCAN_API_KEY || "",
            optimisticEthereum: OP_ETHERSCAN_API_KEY || "",
            "op-sepolia": OP_ETHERSCAN_API_KEY || "",
            "base-sepolia": BASE_ETHERSCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "op-sepolia",
                chainId: 11155420,
                urls: {
                    apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
                    browserURL: "https://sepolia-optimism.etherscan.io"
                }
            },
            {
                network: "base-sepolia",
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://basescan.org/"
                }
            }
        ]
    }
}

export default config
