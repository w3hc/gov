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

    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT"
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, NFTFactory.runner) as NFT

    const tokenId = 1n
    const newUri = "ipfs://new-metadata-cid" // Must be the same as the one used in propose-metadata.ts

    console.log("Generating metadata proof for token ID", tokenId)
    const proof = await nft.generateMetadataProof(tokenId, newUri)
    console.log("\nMetadata proof:", proof)

    const data = { proof: proof }
    fs.writeFileSync(
        path.join(__dirname, "..", "data.json"),
        JSON.stringify(data, null, 2)
    )
    console.log("\nMetadata proof written to data.json")
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
