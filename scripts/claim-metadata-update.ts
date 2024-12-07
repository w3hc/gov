import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as dotenv from "dotenv"

async function main() {
    // Load environment variables
    dotenv.config()

    if (!process.env.ALICE) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    if (!process.env.PROOF) {
        throw new Error(
            "No proof found in .env file. Please run verify-metadata-proof.ts first"
        )
    }

    if (!process.env.TOKENID && process.env.TOKENID !== "0") {
        throw new Error("No token ID specified in .env file")
    }

    // Load contract addresses from deployment files
    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address

    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(process.env.ALICE, provider)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    const TOKEN_ID = parseInt(process.env.TOKENID)

    try {
        console.log("\nSimulating metadata update claim...")
        console.log("Using proof for token:", TOKEN_ID)
        await nft.claimOperation.staticCall(process.env.PROOF)
        console.log("✅ Simulation successful")

        console.log("\nSubmitting metadata update claim...")
        const tx = await nft.claimOperation(process.env.PROOF, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        const receipt = await tx.wait()

        if (receipt?.status === 1) {
            console.log("\nMetadata updated successfully! 🎉")
            try {
                const tokenURI = await nft.tokenURI(TOKEN_ID)
                console.log("New token URI:", tokenURI)
            } catch (e) {
                console.log("Could not fetch new token URI")
            }
        }
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = nft.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Raw error data:", error.data)
            }
        }
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
