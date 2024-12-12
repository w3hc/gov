import hre, { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"
import * as fs from "fs"
import * as path from "path"

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
    const networkName = hre.network.name
    const NFT_ADDRESS = getDeployedAddress(networkName, "CrosschainNFT")

    console.log("Using NFT contract address:", NFT_ADDRESS)

    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address
    console.log("\nNFT Address:", NFT_ADDRESS)

    // Get token info
    const tokenId = process.env.TOKENID
        ? parseInt(process.env.TOKENID)
        : undefined
    if (!tokenId) {
        throw new Error("No token ID specified in .env")
    }

    // Generate proof for token ID 2
    console.log("Generating proof for token ID 2...")
    const proof = await nft.generateMintProof(2)
    console.log("\nProof:", proof)

    // Write proof to data.json
    const data = {
        proof: proof
    }
    fs.writeFileSync(
        path.join(__dirname, "..", "data.json"),
        JSON.stringify(data, null, 2)
    )
    console.log("\nProof written to data.json")
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
