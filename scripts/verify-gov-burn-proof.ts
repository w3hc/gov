import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"
    const TOKEN_ID = 2 // Token ID that was burned

    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT"
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, NFTFactory.runner) as NFT

    // First confirm the token is burned
    try {
        await nft.ownerOf(TOKEN_ID)
        console.log(
            "\n⚠️ Warning: Token",
            TOKEN_ID,
            "still has an owner - it may not be burned"
        )
        return
    } catch (error) {
        console.log("\n✅ Confirmed token", TOKEN_ID, "is burned")
    }

    try {
        console.log("\nGenerating burn proof...")
        const proof = await nft.generateBurnProof(TOKEN_ID)
        console.log("\nProof for claiming burn on other chains:", proof)

        // Log instructions for next steps
        console.log("\nTo claim this burn on another chain:")
        console.log("1. Save this proof")
        console.log(
            "2. Run claim-gov-burn.ts with this proof on the target chain"
        )
        console.log("3. Use that script to submit the burn claim")
    } catch (error: any) {
        console.error("\nError generating proof:", error)
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
