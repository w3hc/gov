import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    const NFT_ADDRESS = "0xe74bC6A3Ee4ED824708DD88465BD2CdD6b869620"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Replace with actual proof from verify script
    const proof =
        "0x000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001105ba21c724f00f5f34580504d14bfc47bd93927bcf076081ff7652e1a1b77d80000000000000000000000000000000000000000000000000000000000000040000000000000000000000000d8a394e7d7894bdf2c57139ff17e5cbaa29dd977000000000000000000000000d8a394e7d7894bdf2c57139ff17e5cbaa29dd977"

    try {
        console.log("Simulating delegation claim...")
        await nft.claimOperation.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting delegation claim...")
        const tx = await nft.claimOperation(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        const receipt = await tx.wait()

        if (receipt?.status === 1) {
            console.log("Delegation claimed successfully! 🎉")

            const delegationEvent = receipt?.logs.find(log => {
                try {
                    return (
                        nft.interface.parseLog(log)?.name === "DelegationSynced"
                    )
                } catch {
                    return false
                }
            })

            if (delegationEvent) {
                const parsedEvent = nft.interface.parseLog(delegationEvent)
                console.log("\nDelegation details:")
                console.log("Delegator:", parsedEvent?.args?.delegator)
                console.log("Delegatee:", parsedEvent?.args?.delegatee)
                console.log("Nonce:", parsedEvent?.args?.nonce.toString())
            }
        }
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
