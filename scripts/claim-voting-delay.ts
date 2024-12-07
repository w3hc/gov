import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    const GOV_ADDRESS = "0x87b094e13DDe7e8d7F2793bD2Ac8636C7C0EcFD7"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)

    // The proof with nonce 1 we just generated
    const proof =
        "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001d6e24169a86f648dc2eb3d5607c83873e546b036409af044ff2fe5cfcf32e56300000000000000000000000000000000000000000000000000000000000000060000000000fa0000000000000000000000000000000000000000000000000000"

    console.log("Starting claim process...")
    console.log("\nCurrent state:")
    console.log("Address:", aliceSigner.address)
    console.log("Current voting delay:", await gov.votingDelay())

    // Decode proof for logging
    const decodedProof = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint8", "bytes", "uint256", "bytes32"],
        proof
    )
    console.log("\nProof details:")
    console.log("Operation type:", decodedProof[0])
    console.log("Value:", decodedProof[1])
    console.log("Nonce:", decodedProof[2])
    console.log("Digest:", decodedProof[3])

    try {
        console.log("\nSimulating claim...")
        await gov.claimParameterUpdate.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("\nSubmitting claim transaction...")
        const tx = await gov.claimParameterUpdate(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        const receipt = await tx.wait()

        if (receipt?.status === 1) {
            console.log("\n🎉 Claim successful!")
            console.log("New voting delay:", await gov.votingDelay())
        } else {
            throw new Error("Transaction failed")
        }
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
