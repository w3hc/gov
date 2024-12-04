import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"

async function main() {
    const GOV_ADDRESS = "0x87b094e13DDe7e8d7F2793bD2Ac8636C7C0EcFD7"
    const NEW_MANIFESTO = "ipfs://newManifestoCID"

    const PROOF_HANDLER_ADDRESS = "0x7342BA0E0C855B403287A2EB00d48257b85496a8"

    const GovFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/Gov.sol:Gov",
        {
            libraries: {
                ProofHandler: PROOF_HANDLER_ADDRESS
            }
        }
    )
    const gov = Gov__factory.connect(GOV_ADDRESS, GovFactory.runner) as Gov

    const validParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string"],
        [NEW_MANIFESTO]
    )

    console.log("Generating manifesto update proof...")
    const proof = await gov.generateParameterProof(0, validParams)
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
