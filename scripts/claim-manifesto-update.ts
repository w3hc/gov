import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    const GOV_ADDRESS = "0x76f53bf2ad89DaB4d8b666b9a5C6610C2C2e0EfC"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)

    // Replace with actual proof from verify-manifesto-proof.ts
    const proof =
        "0x000000000000000000000000000000000000000000000000000000000000004018e746020e5834ecf7dcfd11bbe9c45a0509c89fd4665ab566e51dd443afc82a0000000000000000000000000000000000000000000000000000000000000016697066733a2f2f6e65774d616e69666573746f43494400000000000000000000"

    try {
        console.log("Submitting manifesto update claim...")
        const tx = await gov.claimManifestoUpdate(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        await tx.wait()
        console.log("Manifesto updated successfully!")
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
