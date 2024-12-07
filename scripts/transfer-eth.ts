import { ethers } from "hardhat"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY

    if (!ALICE_PRIVATE_KEY || !SIGNER_PRIVATE_KEY) {
        throw new Error("Missing required private keys in .env file")
    }

    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const recipientAddress = new ethers.Wallet(SIGNER_PRIVATE_KEY).address

    const amount = ethers.parseEther("0.0001")

    console.log("Transferring 0.0001 ETH...")
    console.log("From:", aliceSigner.address)
    console.log("To:", recipientAddress)

    try {
        const tx = await aliceSigner.sendTransaction({
            to: recipientAddress,
            value: amount,
            gasLimit: 21000
        })

        console.log("Transaction submitted:", tx.hash)
        const receipt = await tx.wait()
        console.log("Transfer successful!")
        console.log("Block number:", receipt?.blockNumber)
        console.log("Gas used:", receipt?.gasUsed.toString())
    } catch (error: any) {
        console.error("Transfer failed:", error.message)
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
