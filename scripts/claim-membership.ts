import hre, { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as dotenv from "dotenv"

async function main() {
    dotenv.config()

    console.log("\nClaiming proof...")

    if (!process.env.SIGNER_PRIVATE_KEY) {
        throw new Error("Please set SIGNER_PRIVATE_KEY in your .env file")
    }

    if (!process.env.PROOF) {
        throw new Error(
            "No proof found in .env file. Please run verify-proof.ts first"
        )
    }

    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address
    const network = hre.network.name

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(getRpcUrl(network))
    const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider)

    console.log("\nNetwork:", network)
    console.log("Signer address:", signer.address)

    const nft = NFT__factory.connect(NFT_ADDRESS, signer)

    try {
        console.log("\nClaiming token...")
        // Simulate first
        await nft.claimOperation.staticCall(process.env.PROOF)
        console.log("✅ Simulation successful")

        // Submit transaction
        const tx = await nft.claimOperation(process.env.PROOF, {
            gasLimit: 500000
        })
        console.log("Transaction submitted:", tx.hash)

        const receipt = await tx.wait()
        if (receipt?.status === 1) {
            console.log("Token claimed successfully!")

            // Verify the new owner from the Transfer event
            const transferEvent = receipt?.logs.find(log => {
                try {
                    const parsed = nft.interface.parseLog(log as any)
                    return parsed?.name === "Transfer"
                } catch {
                    return false
                }
            })

            if (transferEvent) {
                const parsedEvent = nft.interface.parseLog(transferEvent as any)
                console.log(`New owner: ${parsedEvent?.args?.to}`)
            }
        }
    } catch (error: any) {
        console.error(`\nFailed to claim token:`)
        if (error.data) {
            try {
                const decodedError = nft.interface.parseError(error.data)
                console.error("Error reason:", decodedError)
            } catch (e) {
                console.error(error)
            }
        }
    }
}

// Helper to get RPC URL
function getRpcUrl(network: string): string {
    switch (network) {
        case "opSepolia":
            return process.env.OP_SEPOLIA_RPC_ENDPOINT_URL || ""
        case "baseSepolia":
            return process.env.BASE_SEPOLIA_RPC_ENDPOINT_URL || ""
        case "arbitrumSepolia":
            return process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL || ""
        case "sepolia":
            return process.env.SEPOLIA_RPC_ENDPOINT_URL || ""
        default:
            throw new Error(`Unsupported network: ${network}`)
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
