import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    // Load contract addresses from deployment files
    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address

    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Load proofs from file
    const proofsPath = path.resolve(__dirname, "../proofs.json")
    if (!fs.existsSync(proofsPath)) {
        throw new Error(
            "proofs.json not found. Please run verify-metadata-proof.ts first"
        )
    }
    const proofs = JSON.parse(fs.readFileSync(proofsPath, "utf8"))

    if (!Array.isArray(proofs) || proofs.length === 0) {
        throw new Error("No proofs found in proofs.json")
    }

    // Use the proof from the first entry
    const proofData = proofs[0]

    try {
        console.log("\nSimulating metadata update claim...")
        console.log("Using proof for token:", proofData.tokenId)
        await nft.claimOperation.staticCall(proofData.proof)
        console.log("✅ Simulation successful")

        console.log("\nSubmitting metadata update claim...")
        const tx = await nft.claimOperation(proofData.proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        const receipt = await tx.wait()

        if (receipt?.status === 1) {
            console.log("\nMetadata updated successfully! 🎉")
            try {
                const tokenURI = await nft.tokenURI(proofData.tokenId)
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
