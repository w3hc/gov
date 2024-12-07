import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as dotenv from "dotenv"

async function main() {
    console.log("\nVerifying and generating proof...")

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

    try {
        const sepoliaProvider = new ethers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_ENDPOINT_URL
        )
        const nft = NFT__factory.connect(NFT_ADDRESS, sepoliaProvider)

        // Get owner and URI from chain A
        const owner = await nft.ownerOf(tokenId)
        const uri = await nft.tokenURI(tokenId)
        console.log(`\nToken ${tokenId} on chain A:`)
        console.log(`Owner: ${owner}`)
        console.log(`URI: ${uri}`)

        // Package all token data in params
        const params = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "address", "string"],
            [tokenId, owner, uri]
        )

        const message = ethers.keccak256(
            ethers.solidityPacked(
                ["address", "uint8", "bytes", "uint256"],
                [NFT_ADDRESS, 0, params, 0] // operationType = 0 (MINT), nonce = 0
            )
        )

        const digest = ethers.keccak256(
            ethers.solidityPacked(
                ["string", "bytes32"],
                ["\x19Ethereum Signed Message:\n32", message]
            )
        )

        const proof = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint8", "bytes", "uint256", "bytes32"],
            [0, params, 0, digest]
        )

        // Update .env file with the proof
        const envPath = ".env"
        let envContent = ""

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8")
        }

        // Remove existing PROOF line if it exists
        envContent = envContent.replace(/^PROOF=.*$/m, "")

        // Add new line if content doesn't end with one
        if (envContent.length > 0 && !envContent.endsWith("\n")) {
            envContent += "\n"
        }

        // Add the new PROOF
        envContent += `PROOF=${proof}\n`

        fs.writeFileSync(envPath, envContent)
        console.log("\nProof generated and saved to .env:")
        console.log(proof)
    } catch (error) {
        console.error("Error:", error)
        process.exitCode = 1
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
