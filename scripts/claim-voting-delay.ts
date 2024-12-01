import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    const GOV_ADDRESS = "0x66ae98E83247C450919acA3B2DE80D8E655B9478"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)

    // Replace with actual proof from verify-voting-delay-proof.ts
    const proof =
        "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000060af755be48da3c6b4e4b637b4bf5df990ea1f0efd338550f5cb38c8e8eb4e89bd00000000000000000000000000000000000000000000000000000000000000060000000000300000000000000000000000000000000000000000000000000000"

    try {
        console.log("Simulating voting delay update claim...")
        await gov.claimParameterUpdate.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting voting delay update claim...")
        const tx = await gov.claimParameterUpdate(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        await tx.wait()
        console.log("Voting delay updated successfully!")
        console.log("New voting delay:", await gov.votingDelay())
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = gov.interface.parseError(error.data)
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
