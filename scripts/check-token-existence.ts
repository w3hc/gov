import { ethers } from "hardhat"
import { JsonRpcProvider } from "ethers"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

function getRpcUrl(network: string): string {
    switch (network) {
        case "opSepolia":
            if (!process.env.OP_SEPOLIA_RPC_ENDPOINT_URL) {
                throw new Error("OP_SEPOLIA_RPC_ENDPOINT_URL not set in .env")
            }
            return process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
        case "baseSepolia":
            if (!process.env.BASE_SEPOLIA_RPC_ENDPOINT_URL) {
                throw new Error("BASE_SEPOLIA_RPC_ENDPOINT_URL not set in .env")
            }
            return process.env.BASE_SEPOLIA_RPC_ENDPOINT_URL
        case "arbitrumSepolia":
            if (!process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL) {
                throw new Error(
                    "ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL not set in .env"
                )
            }
            return process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
        case "sepolia":
            if (!process.env.SEPOLIA_RPC_ENDPOINT_URL) {
                throw new Error("SEPOLIA_RPC_ENDPOINT_URL not set in .env")
            }
            return process.env.SEPOLIA_RPC_ENDPOINT_URL
        default:
            throw new Error(`Unsupported network: ${network}`)
    }
}

async function checkToken(nft: NFT, tokenId: number): Promise<string | null> {
    try {
        const owner = await nft.ownerOf(tokenId)
        return owner
    } catch (error) {
        return null
    }
}

async function main() {
    // Get deployment information
    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address
    const networks = ["sepolia", "opSepolia", "baseSepolia", "arbitrumSepolia"]
    const tokenIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    console.log("\nNFT contract address:", NFT_ADDRESS)
    console.log("\nChecking token existence across networks...\n")

    // Create a map of networks to their contract instances
    const contracts = new Map<string, NFT>()
    for (const network of networks) {
        const provider = new ethers.JsonRpcProvider(getRpcUrl(network))
        const nft = NFT__factory.connect(NFT_ADDRESS, provider)
        contracts.set(network, nft)
    }

    // Print header
    console.log("Token ID | " + networks.map(n => n.padEnd(20)).join(" | "))
    console.log("-".repeat(120))

    // Check each token ID
    for (const tokenId of tokenIds) {
        const results = await Promise.all(
            networks.map(async network => {
                const nft = contracts.get(network)!
                const owner = await checkToken(nft, tokenId)
                return owner ? owner.slice(0, 8) + "..." : "Not Found"
            })
        )
        console.log(
            `Token ${tokenId.toString().padEnd(7)} | ${results
                .map(r => r.padEnd(20))
                .join(" | ")}`
        )
    }
}

main().catch(error => {
    console.error("\nError:", error)
    process.exitCode = 1
})
