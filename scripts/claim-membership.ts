import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

async function main() {
    const JUNGLE_PRIVATE_KEY = process.env.JUNGLE
    if (!JUNGLE_PRIVATE_KEY) {
        throw new Error("Please set JUNGLE private key in your .env file")
    }

    const NFT_ADDRESS = "0xcd4e16B3d3b7f1f13124B650Fb633782009B249F"
    const provider = ethers.provider
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

    // Get contract instance using the factory
    const nft = NFT__factory.connect(NFT_ADDRESS, jungleSigner)

    console.log("Checking if membership exists on OP Sepolia...")
    const exists = await nft.membershipExistsHere(2)
    if (exists) {
        console.log("Membership already exists on this chain!")
        return
    }

    // Define the proof and metadata
    const proof =
        "0x0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000bdc0e420ab9ba144213588a95fa1e5e63ceff1be6fe9bdb2e5334af23a74801d92d931a3e1917421104a6ed2861f79aa06de9a09"
    const metadataUri =
        "https://bafkreicj62l5xu6pk2xx7x7n6b7rpunxb4ehlh7fevyjapid3556smuz4y.ipfs.w3s.link/"

    try {
        console.log("Submitting claim transaction...")

        // Direct contract call
        const tx = await nft.claimMembership(proof, metadataUri, {
            gasLimit: 300000
        })

        console.log("Transaction submitted:", tx.hash)
        console.log("Waiting for confirmation...")

        const receipt = await tx.wait()
        console.log("Membership claimed successfully!")

        // Verify the ownership
        const owner = await nft.ownerOf(2)
        console.log("Token ID 2 is now owned by:", owner)
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            // Get the revert reason
            const reason = error.data.toString()
            console.error("Revert reason:", reason)
        }
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
