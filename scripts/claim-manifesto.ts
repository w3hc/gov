import hre, { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
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

    const networkName = hre.network.name
    const GOV_ADDRESS = getDeployedAddress(networkName, "CrosschainGov")
    console.log("Using Gov contract address:", GOV_ADDRESS)

    const provider = new ethers.JsonRpcProvider(
        networkName === "op-sepolia"
            ? process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
            : process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
    )
    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)
    const gov = Gov__factory.connect(GOV_ADDRESS, signer)

    const proof = getProofFromData()
    console.log("\nUsing manifesto proof:", proof)

    try {
        console.log("Simulating manifesto update claim...")
        await gov.claimManifestoUpdate.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting manifesto update claim...")
        const tx = await gov.claimManifestoUpdate(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", msg(tx.hash))
        console.log("Waiting for confirmation...")

        const receipt = await tx.wait()
        console.log("Manifesto update claimed successfully!")

        const updateEvent = receipt?.logs.find(log => {
            try {
                return gov.interface.parseLog(log)?.name === "ManifestoUpdated"
            } catch {
                return false
            }
        })

        if (updateEvent) {
            const parsedEvent = gov.interface.parseLog(updateEvent)
            const oldManifesto = parsedEvent?.args?.oldManifesto
            const newManifesto = parsedEvent?.args?.newManifesto
            console.log("Old manifesto:", oldManifesto)
            console.log("New manifesto:", newManifesto)
        }
    } catch (error: any) {
        console.error("\nError details:", error)
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
