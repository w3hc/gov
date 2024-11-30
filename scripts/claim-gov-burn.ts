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

    // Replace with actual proof from verify-gov-burn-proof.ts
    const proof =
        "0x0000000000000000000000000000000000000000000000000000000000000002de6aafe21f591779535648a574883650845ec20558d2d4192a586959f15310dd"

    try {
        console.log("Simulating burn claim...")
        await nft.claimBurn.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting burn claim...")
        const tx = await nft.claimBurn(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        await tx.wait()
        console.log("Token burned successfully!")
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
