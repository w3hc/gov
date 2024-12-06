import hre, { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"

async function main() {
    if (!process.env.SIGNER_PRIVATE_KEY) {
        throw new Error("Please set SIGNER_PRIVATE_KEY in your .env file")
    }

    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address
    const network = hre.network.name

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(getRpcUrl(network))
    const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider)

    console.log("Network:", network)
    console.log("Signer address:", signer.address)

    const nft = NFT__factory.connect(NFT_ADDRESS, signer)

    // Load proof from file
    const proofsPath = path.resolve(__dirname, "../proofs.json")
    if (!fs.existsSync(proofsPath)) {
        throw new Error(
            "proofs.json not found. Please run verify-proof.ts first"
        )
    }
    const proofs = JSON.parse(fs.readFileSync(proofsPath, "utf8"))

    // Try to claim each proof
    for (const proof of proofs) {
        console.log(`\nClaiming token ${proof.tokenId}...`)
        try {
            // Simulate first
            await nft.claimOperation.staticCall(proof.proof)
            console.log("✅ Simulation successful")

            // Submit transaction
            const tx = await nft.claimOperation(proof.proof, {
                gasLimit: 500000
            })
            console.log("Transaction submitted:", tx.hash)

            const receipt = await tx.wait()
            if (receipt?.status === 1) {
                console.log(`Token ${proof.tokenId} claimed successfully!`)

                // Verify the new owner
                const newOwner = await nft.ownerOf(proof.tokenId)
                console.log(`New owner: ${newOwner}`)
                if (newOwner.toLowerCase() !== proof.owner.toLowerCase()) {
                    console.warn(
                        "⚠️ Warning: New owner doesn't match expected owner"
                    )
                }
            }
        } catch (error: any) {
            console.error(`\nFailed to claim token ${proof.tokenId}:`)
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
