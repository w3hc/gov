import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

async function checkNonceAndTokens(
    chainName: string,
    provider: ethers.JsonRpcProvider,
    nftAddress: string
) {
    const OPERATION_TYPE = 0 // MINT operation

    // Calculate storage slot for nonce
    const proofSlot = ethers.keccak256(
        ethers.solidityPacked(
            ["uint8", "uint256"],
            [OPERATION_TYPE, 0] // mapping key and base slot
        )
    )
    const nonceData = await provider.getStorage(nftAddress, proofSlot)
    const currentNonce = parseInt(nonceData, 16)

    console.log(`\n${chainName}:`)
    console.log(`Current nonce: ${currentNonce}`)

    // Get NFT contract instance
    const nft = NFT__factory.connect(nftAddress, provider)

    // Check tokens
    try {
        const totalSupply = await nft.totalSupply()
        console.log(`Total supply: ${totalSupply}`)

        for (let i = 0; i < Number(totalSupply); i++) {
            try {
                const owner = await nft.ownerOf(i)
                console.log(`Token ${i} owner: ${owner}`)
            } catch (e) {
                console.log(`Token ${i} doesn't exist or is burned`)
            }
        }
    } catch (e) {
        console.log("Error getting token details:", e)
    }
}

async function main() {
    const NFT_ADDRESS = "0xfFCB28995DFAC5a90bf52195B6570DFF7e3e8dBD"

    // Check Sepolia
    const sepoliaProvider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    await checkNonceAndTokens(
        "Sepolia (Home Chain)",
        sepoliaProvider,
        NFT_ADDRESS
    )

    // Check OP Sepolia
    const opSepoliaProvider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    await checkNonceAndTokens("OP Sepolia", opSepoliaProvider, NFT_ADDRESS)

    // Check stored proofs
    console.log("\nChecking stored proofs:")
    const fs = require("fs")
    const proofs = JSON.parse(fs.readFileSync("./proofs.json", "utf8"))
    for (const p of proofs) {
        console.log(`\nToken ${p.tokenId}:`)
        // Parse the proof to get embedded nonce
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["uint8", "bytes", "uint256", "bytes32"],
            p.proof
        )
        console.log(`Nonce in proof: ${decoded[2]}`)
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
