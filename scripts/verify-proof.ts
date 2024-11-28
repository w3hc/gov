import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    // Contract address on Sepolia where the NFT was originally minted
    const NFT_ADDRESS = "0x5BD1DB53D8edF68fb6b1002a07119a3160CdEBF7"

    // Get contract factory and instance
    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT"
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, NFTFactory.runner) as NFT

    // Generate proof for token ID 2
    console.log("Generating proof for token ID 2...")
    const proof = await nft.generateMembershipProof(2)
    console.log("\nProof:", proof)

    // Get owner of token ID 2 for verification
    const owner = await nft.ownerOf(2)
    console.log("\nToken owner:", owner)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
