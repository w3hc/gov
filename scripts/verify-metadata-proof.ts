import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"
import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

async function main() {
    // Ensure environment variables are loaded
    dotenv.config()

    // Load contract addresses from deployment files
    const deploymentsGov = require("../deployments/sepolia/CrosschainGov.json")
    const GOV_ADDRESS = deploymentsGov.address
    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address
    const PROOF_HANDLER_ADDRESS = deploymentsGov.libraries.ProofHandler

    // Get token info
    if (!process.env.TOKENID && process.env.TOKENID !== "0") {
        throw new Error("No token ID specified in .env")
    }
    const TOKEN_ID = parseInt(process.env.TOKENID)

    // Log the environment variable for debugging
    console.log("TOKENID environment variable:", process.env.TOKENID)

    const NEW_URI =
        "https://bafkreifnnreoxxgkhty7v2w3qwiie6cfxpv3vcco2xldekfvbiem3nm6dm.ipfs.w3s.link/"

    console.log("Generating metadata update proof...")
    console.log("Gov Address:", GOV_ADDRESS)
    console.log("NFT Address:", NFT_ADDRESS)
    console.log("ProofHandler Address:", PROOF_HANDLER_ADDRESS)
    console.log("Token ID:", TOKEN_ID)
    console.log("New URI:", NEW_URI)

    // Get contract factory with library linking
    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT",
        {
            libraries: {
                ProofHandler: PROOF_HANDLER_ADDRESS
            }
        }
    )

    // Connect to the contract
    const nft = NFT__factory.connect(NFT_ADDRESS, NFTFactory.runner) as NFT

    try {
        // Encode parameters for the metadata update
        const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "string"],
            [TOKEN_ID, NEW_URI]
        )

        // Generate the operation proof
        // Operation type 2 is SET_METADATA
        const proof = await nft.generateOperationProof(2, encodedParams)

        console.log("\nProof generated successfully!")
        console.log("\nProof:", proof)

        // Create the proof object in the expected format
        const proofData = {
            tokenId: TOKEN_ID,
            proof: proof,
            owner: undefined, // Not needed for metadata update
            nonce: 1 // Start with nonce 1 for metadata updates
        }

        // Add the new token ID to .env file
        const envPath = path.resolve(__dirname, "../.env")
        let envContent = ""
        try {
            // Read existing .env content if file exists
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, "utf8")
            }

            // Remove existing TOKENID line if it exists
            envContent = envContent.replace(/^TOKENID=.*$/m, "")

            // Add new line if content doesn't end with one
            if (envContent.length > 0 && !envContent.endsWith("\n")) {
                envContent += "\n"
            }

            // Add the new TOKENID
            envContent += `TOKENID=${TOKEN_ID}\n`

            // Write back to .env file
            fs.writeFileSync(envPath, envContent)
            console.log("\nToken ID has been written to .env file")
        } catch (error) {
            console.error("Error updating .env file:", error)
        }
    } catch (error: any) {
        console.error("\nError generating proof:", error)
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
