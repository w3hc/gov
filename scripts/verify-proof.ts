import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"

async function main() {
    const deploymentsNFT = require("../deployments/sepolia/CrosschainNFT.json")
    const NFT_ADDRESS = deploymentsNFT.address
    console.log("\nNFT Address:", NFT_ADDRESS)

    // Connect to Sepolia (home chain)
    const sepoliaProvider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    const signer = new ethers.Wallet(
        process.env.SIGNER_PRIVATE_KEY!,
        sepoliaProvider
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, signer)

    // Connect to OP Sepolia to check existing tokens
    const opSepoliaProvider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const opNft = NFT__factory.connect(NFT_ADDRESS, opSepoliaProvider)

    // Get current nonce state on both chains
    const OPERATION_TYPE = 0 // MINT operation
    const proofSlot = ethers.keccak256(
        ethers.solidityPacked(["uint8", "uint256"], [OPERATION_TYPE, 0])
    )

    const sepoliaNonce = parseInt(
        await sepoliaProvider.getStorage(NFT_ADDRESS, proofSlot),
        16
    )
    const opSepoliaNonce = parseInt(
        await opSepoliaProvider.getStorage(NFT_ADDRESS, proofSlot),
        16
    )

    console.log("\nNonce state:")
    console.log("Sepolia nonce:", sepoliaNonce)
    console.log("OP Sepolia nonce:", opSepoliaNonce)

    // Get all tokens that exist on Sepolia but not on OP Sepolia
    const sepoliaTotalSupply = await nft.totalSupply()
    console.log("\nTotal supply on Sepolia:", sepoliaTotalSupply)

    const tokens = []
    for (let i = 0; i < sepoliaTotalSupply; i++) {
        try {
            // Check if token exists on Sepolia
            const owner = await nft.ownerOf(i)
            const uri = await nft.tokenURI(i)

            // Check if token exists on OP Sepolia
            try {
                await opNft.ownerOf(i)
                console.log(`Token ${i} already exists on OP Sepolia`)
            } catch {
                tokens.push({ id: i, owner, uri })
                console.log(`\nFound unclaimed token ${i}:`)
                console.log(`Owner: ${owner}`)
                console.log(`URI: ${uri}`)
            }
        } catch (e) {
            console.log(`Token ${i} doesn't exist or is burned on Sepolia`)
        }
    }

    // Generate proofs only for tokens that don't exist on OP Sepolia
    const proofs = []
    let nextNonce = opSepoliaNonce + 1 // Start with next nonce after OP Sepolia's current nonce

    for (const token of tokens) {
        const params = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "string"],
            [token.owner, token.uri]
        )

        try {
            // Generate proof with correct nonce
            const message = ethers.keccak256(
                ethers.solidityPacked(
                    ["address", "uint8", "bytes", "uint256"],
                    [nft.target, OPERATION_TYPE, params, nextNonce]
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
                [OPERATION_TYPE, params, nextNonce, digest]
            )

            proofs.push({
                tokenId: token.id,
                proof,
                owner: token.owner,
                nonce: nextNonce
            })
            console.log(`\nGenerated proof for token ${token.id}:`)
            console.log(`Owner: ${token.owner}`)
            console.log(`Nonce: ${nextNonce}`)
            console.log(`Proof: ${proof}`)

            nextNonce++ // Increment for next proof
        } catch (error) {
            console.error(
                `Failed to generate proof for token ${token.id}:`,
                error
            )
        }
    }

    // Save proofs to a JSON file
    if (proofs.length > 0) {
        const proofsPath = path.resolve(__dirname, "../proofs.json")
        fs.writeFileSync(proofsPath, JSON.stringify(proofs, null, 2))
        console.log(`\nProofs saved to proofs.json`)
    } else {
        console.log("\nNo new proofs were generated")
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
