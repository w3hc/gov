import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"

async function main() {
    const GOV_ADDRESS = "0x66ae98E83247C450919acA3B2DE80D8E655B9478"
    const NEW_VOTING_DELAY = 48n
    const value = ethers.solidityPacked(["uint48"], [NEW_VOTING_DELAY])

    const GovFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/Gov.sol:Gov"
    )
    const gov = Gov__factory.connect(GOV_ADDRESS, GovFactory.runner) as Gov

    console.log("Generating voting delay update proof...")
    const proof = await gov.generateParameterProof(1, value) // 1 = UPDATE_VOTING_DELAY
    console.log("\nProof:", proof)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
