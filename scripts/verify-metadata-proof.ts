import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"
    const TOKEN_ID = 2
    const URI =
        "https://bafkreifnnreoxxgkhty7v2w3qwiie6cfxpv3vcco2xldekfvbiem3nm6dm.ipfs.w3s.link/"

    // Add the ProofHandler library address
    const PROOF_HANDLER_ADDRESS = "0x0152ee45780385dACCCCB128D816031CfFe5F36B"

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

    const validParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "string"],
        ["0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE", URI]
    )

    console.log("Generating metadata update proof...")
    const proof = await nft.generateOperationProof(TOKEN_ID, validParams)
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
