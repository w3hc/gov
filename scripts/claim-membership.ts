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

    // Setup provider and signer for target chain
    const provider = new ethers.JsonRpcProvider(getRpcUrl(network))
    const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider)

    console.log("Network:", network)
    console.log("Signer address:", signer.address)

    const nft = NFT__factory.connect(NFT_ADDRESS, signer)

    // Get current nonce state on target chain
    const OPERATION_TYPE = 0 // MINT operation
    const proofSlot = ethers.keccak256(
        ethers.solidityPacked(
            ["uint8", "uint256"],
            [OPERATION_TYPE, 0] // mapping key and base slot
        )
    )
    const nonceData = await provider.getStorage(nft.target, proofSlot)
    const currentNonce = parseInt(nonceData, 16)
    console.log("\nCurrent nonce on target chain:", currentNonce)
    const nextNonce = currentNonce + 1

    // Load proofs from file
    const proofsPath = path.resolve(__dirname, "../proofs.json")
    if (!fs.existsSync(proofsPath)) {
        throw new Error(
            "proofs.json not found. Please run verify-proof.ts first"
        )
    }
    const proofs = JSON.parse(fs.readFileSync(proofsPath, "utf8"))

    // Check which tokens already exist on target chain
    const existingTokens = new Set()
    for (const proof of proofs) {
        try {
            const owner = await nft.ownerOf(proof.tokenId)
            existingTokens.add(proof.tokenId)
            console.log(
                `Token ${proof.tokenId} already exists, owned by ${owner}`
            )
        } catch (e) {
            // Token doesn't exist
        }
    }

    // Claim tokens that don't exist yet
    for (const proof of proofs) {
        if (existingTokens.has(proof.tokenId)) continue

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
                const decodedError = nft.interface.parseError(error.data)
                console.error("Error reason:", decodedError?.args[0])
            } else {
                console.error(error)
            }
        }
    }
}

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

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
