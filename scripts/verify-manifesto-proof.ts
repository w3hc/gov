import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"

async function main() {
    const GOV_ADDRESS = "0x76f53bf2ad89DaB4d8b666b9a5C6610C2C2e0EfC"
    const NEW_MANIFESTO = "ipfs://newManifestoCID"

    const GovFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/Gov.sol:Gov"
    )
    const gov = Gov__factory.connect(GOV_ADDRESS, GovFactory.runner) as Gov

    console.log("Generating manifesto update proof...")
    const proof = await gov.generateManifestoProof(NEW_MANIFESTO)
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
