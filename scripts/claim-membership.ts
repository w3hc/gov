import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

async function main() {
    const JUNGLE_PRIVATE_KEY = process.env.JUNGLE
    if (!JUNGLE_PRIVATE_KEY) {
        throw new Error("Please set JUNGLE private key in your .env file")
    }

    const NFT_ADDRESS = "0xe74bC6A3Ee4ED824708DD88465BD2CdD6b869620"
    const provider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const jungleSigner = new ethers.Wallet(JUNGLE_PRIVATE_KEY, provider)

    console.log("Using address:", jungleSigner.address)
    if (
        jungleSigner.address.toLowerCase() !==
        "0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE".toLowerCase()
    ) {
        throw new Error(
            "Wrong private key! The signer address doesn't match the token owner address from Sepolia"
        )
    }

    const nft = NFT__factory.connect(NFT_ADDRESS, jungleSigner)

    const proof =
        "0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000100e58a7fb38517994680fd6b4d390074ae500a12d3e0fcc0b0843e260ff6c80e00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000bdc0e420ab9ba144213588a95fa1e5e63ceff1be0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000005268747470733a2f2f6261666b726569636a36326c35787536706b3278783778376e3662377270756e78623465686c6837666576796a6170696433353536736d757a34792e697066732e7733732e6c696e6b2f0000000000000000000000000000"

    try {
        console.log("Simulating claim transaction...")
        await nft.claimOperation.staticCall(proof)
        console.log("✅ Simulation successful")

        console.log("Submitting claim transaction...")
        const tx = await nft.claimOperation(proof, {
            gasLimit: 500000
        })

        console.log("Transaction submitted:", tx.hash)
        console.log("Waiting for confirmation...")

        const receipt = await tx.wait()
        console.log("Membership claimed successfully!")

        // Get token ID from event
        const claimEvent = receipt?.logs.find(log => {
            try {
                return nft.interface.parseLog(log)?.name === "MembershipClaimed"
            } catch {
                return false
            }
        })

        if (claimEvent) {
            const parsedEvent = nft.interface.parseLog(claimEvent)
            const tokenId = parsedEvent?.args?.tokenId
            console.log("Claimed token ID:", tokenId)
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
