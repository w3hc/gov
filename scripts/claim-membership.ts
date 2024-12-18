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

    function getRpcUrl(networkName: string): string {
        switch (networkName) {
            case "sepolia":
                return process.env.SEPOLIA_RPC_ENDPOINT_URL || ""
            case "op-sepolia":
                return process.env.OP_SEPOLIA_RPC_ENDPOINT_URL || ""
            case "base-sepolia":
                return process.env.BASE_SEPOLIA_RPC_ENDPOINT_URL || ""
            case "arbitrum-sepolia":
                return process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL || ""
            default:
                throw new Error(`Unsupported network: ${networkName}`)
        }
    }
    const rpcUrl = getRpcUrl(networkName)
    if (!rpcUrl) {
        throw new Error(`RPC URL is not configured for network: ${networkName}`)
    }
    console.log(`Using RPC URL: ${rpcUrl}`)
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    const signerZero = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)

    console.log("Using address:", signerZero.address)

    const nft = NFT__factory.connect(NFT_ADDRESS, signerZero)

    // Get proof from data.json
    const proof = getProofFromData()
    console.log("\nUsing proof:", proof)

    try {
        console.log("Simulating claim transaction...")
        await nft.claimMint.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting claim transaction...")
        const tx = await nft.claimMint(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", msg(tx.hash))
        console.log("Waiting for confirmation...")

        const receipt = await tx.wait()
        console.log("Membership claimed successfully!")

        // Get token ID from event
        const claimEvent = receipt?.logs.find(log => {
            try {
                return nft.interface.parseLog(log)?.name === "MembershipClaimed"
            } catch {
                return false
            }
        })

        if (claimEvent) {
            const parsedEvent = nft.interface.parseLog(claimEvent)
            const tokenId = parsedEvent?.args?.tokenId
            console.log("Claimed token ID:", tokenId)
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
