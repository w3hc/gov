import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)

    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Replace with actual proof from verify-metadata-proof.ts
    const proof =
        "0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000600f002a14cdfd971ea21d2bc78be96580ca4abae526da8bd39b594367c772034a000000000000000000000000000000000000000000000000000000000000005268747470733a2f2f6261666b726569666e6e72656f7878676b68747937763277337177696965366366787076337663636f32786c64656b66766269656d336e6d36646d2e697066732e7733732e6c696e6b2f0000000000000000000000000000"

    try {
        console.log("Simulating metadata update claim...")
        await nft.claimMetadataUpdate.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting metadata update claim...")
        const tx = await nft.claimMetadataUpdate(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        await tx.wait()
        console.log("Metadata updated successfully!")
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
