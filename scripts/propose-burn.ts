import hre, { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

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

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }
    if (!SIGNER_PRIVATE_KEY) {
        throw new Error("Please set SIGNER_PRIVATE_KEY in your .env file")
    }

    // Get the network from hardhat config
    const networkName = hre.network.name

    // Get deployed addresses from deployment files
    const NFT_ADDRESS = getDeployedAddress(networkName, "CrosschainNFT")
    const GOV_ADDRESS = getDeployedAddress(networkName, "CrosschainGov")

    console.log("Using contract addresses:")
    console.log("NFT:", NFT_ADDRESS)
    console.log("Gov:", GOV_ADDRESS)

    const provider = new ethers.JsonRpcProvider(
        networkName === "op-sepolia"
            ? process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
            : process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
    )

    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const signerZero = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)
    console.log("Using address for proposals:", aliceSigner.address)
    console.log("Using address for execution:", signerZero.address)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Token ID to burn
    const tokenIdToBurn = 2n // Adjust as needed

    // Check current voting power
    const votingPower = await nft.getVotes(aliceSigner.address)
    console.log("Current voting power:", votingPower)

    if (votingPower === 0n) {
        console.log("Delegating voting power...")
        const tx = await nft.delegate(aliceSigner.address)
        await tx.wait(3)
        console.log("Delegation completed")
        console.log(
            "New voting power:",
            (await nft.getVotes(aliceSigner.address)).toString()
        )
    }

    console.log("Creating proposal to burn member NFT...")

    try {
        const targets = [nft.target]
        const values = [0]

        // Prepare the NFT burn call through the Gov contract
        const burnCall = nft.interface.encodeFunctionData("govBurn", [
            tokenIdToBurn
        ])

        const calldatas = [burnCall]
        const description = "Burn member NFT " + Date.now()

        console.log("Creating proposal with:")
        console.log("- Target:", targets[0])
        console.log("- Value:", values[0])
        console.log("- Calldata:", calldatas[0])
        console.log("- Description:", description)

        // Rest of the proposal creation and execution logic remains the same as in propose.ts
        // ... [Same voting and execution logic as in propose.ts]
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = gov.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Could not decode error data")
            }
        }
        throw error
    }
}
