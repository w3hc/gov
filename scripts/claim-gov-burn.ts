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

    // Replace with actual proof from verify-gov-burn-proof.ts
    const proof =
        "0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100e58a7fb38517994680fd6b4d390074ae500a12d3e0fcc0b0843e260ff6c80e00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000bdc0e420ab9ba144213588a95fa1e5e63ceff1be0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000005268747470733a2f2f6261666b726569636a36326c35787536706b3278783778376e3662377270756e78623465686c6837666576796a6170696433353536736d757a34792e697066732e7733732e6c696e6b2f0000000000000000000000000000"

    try {
        console.log("Simulating burn claim...")
        await nft.claimOperation.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting burn claim...")
        const tx = await nft.claimOperation(proof, {
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
