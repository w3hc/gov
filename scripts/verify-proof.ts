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

    // Get contract factory and instance
    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT"
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, NFTFactory.runner) as NFT

    // Get owner of token ID 2 for verification
    const owner = await nft.ownerOf(2)
    console.log("\nToken owner:", owner)

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
