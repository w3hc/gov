import hre, { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"
import color from "cli-color"
var msg = color.xterm(39).bgXterm(128)

function getDeployedAddress(network: string, contractName: string): string {
    try {
        const deploymentPath = path.join(
            __dirname,
            "..",
            "deployments",
            network,
            `${contractName}.json`
        )
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"))
        return deployment.address
    } catch (error) {
        throw new Error(
            `Failed to read deployment for ${contractName} on ${network}: ${error}`
        )
    }
}

function getProofFromData(): string {
    try {
        const dataPath = path.join(__dirname, "..", "data.json")
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"))
        return data.proof
    } catch (error) {
        throw new Error(`Failed to read proof from data.json: ${error}`)
    }
}

async function main() {
    const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY
    if (!SIGNER_PRIVATE_KEY) {
        throw new Error("Please set SIGNER_PRIVATE_KEY in your .env file")
    }

    // Get the network from hardhat config
    const networkName = hre.network.name

    // Get deployed address from deployment files
    const NFT_ADDRESS = getDeployedAddress(networkName, "CrosschainNFT")
    console.log("Using NFT contract address:", NFT_ADDRESS)

    // Get RPC URL based on network
    let provider = new ethers.JsonRpcProvider(
        networkName === "op-sepolia"
            ? process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
            : process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
    )
    const signerZero = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)

    console.log("Using address:", signerZero.address)

    const nft = NFT__factory.connect(NFT_ADDRESS, signerZero)

    // Get proof from data.json
    const proof = getProofFromData()
    console.log("\nUsing proof:", proof)

    try {
        console.log("\nClaiming token...")
        // Simulate first
        await nft.claimOperation.staticCall(process.env.PROOF)
        console.log("✅ Simulation successful")

        // Submit transaction
        const tx = await nft.claimOperation(process.env.PROOF, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", msg(tx.hash))
        console.log("Waiting for confirmation...")

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
