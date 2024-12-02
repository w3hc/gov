import { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }

    const NFT_ADDRESS = "0xe74bC6A3Ee4ED824708DD88465BD2CdD6b869620"
    const DELEGATOR = "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"
    const DELEGATEE = "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"
    const PROOF_HANDLER_ADDRESS = "0x0152ee45780385dACCCCB128D816031CfFe5F36B"

    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)

    const NFTFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/NFT.sol:NFT",
        {
            libraries: {
                ProofHandler: PROOF_HANDLER_ADDRESS
            }
        }
    )
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    console.log("Generating delegation proof...")
    console.log("Delegator:", DELEGATOR)
    console.log("Delegatee:", DELEGATEE)

    const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [DELEGATOR, DELEGATEE]
    )

    const proof = await nft.generateOperationProof(3, encodedParams) // 3 is DELEGATE operation type
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
