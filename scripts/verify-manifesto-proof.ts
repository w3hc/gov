import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"

async function main() {
    const GOV_ADDRESS = "0xB8de4177BAf7365DFc7E6ad860E4B223b40f91A0"
    const NEW_MANIFESTO = "ipfs://newManifestoCID"

    const PROOF_HANDLER_ADDRESS = "0x0152ee45780385dACCCCB128D816031CfFe5F36B"

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
