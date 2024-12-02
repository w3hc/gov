import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    // Contract address on Sepolia where the NFT was originally minted
    const NFT_ADDRESS = "0xe74bC6A3Ee4ED824708DD88465BD2CdD6b869620"

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

    // Rest of your code remains the same
    const owner = await nft.ownerOf(2)
    console.log("\nToken owner:", owner)

    const validParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "string"],
        [
            "0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE",
            "https://bafkreicj62l5xu6pk2xx7x7n6b7rpunxb4ehlh7fevyjapid3556smuz4y.ipfs.w3s.link/"
        ]
    )

    console.log("Generating proof for token ID 2...")
    const proof = await nft.generateOperationProof(2, validParams)
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
