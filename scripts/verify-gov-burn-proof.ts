import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    const NFT_ADDRESS = "0x147613E970bbA94e19a70A8b0f9106a13B4d7cbE"
    const TOKEN_ID = 2 // Token ID that was burned

    // Add the ProofHandler library address
    const PROOF_HANDLER_ADDRESS = "0x7342BA0E0C855B403287A2EB00d48257b85496a8"

    // Get contract factory with library linking
    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT",
        {
            libraries: {
                ProofHandler: PROOF_HANDLER_ADDRESS
            }
        }
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

        const validParams = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "string"],
            [
                "0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE",
                "https://bafkreicj62l5xu6pk2xx7x7n6b7rpunxb4ehlh7fevyjapid3556smuz4y.ipfs.w3s.link/"
            ]
        )

        const proof = await nft.generateOperationProof(TOKEN_ID, validParams)
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
