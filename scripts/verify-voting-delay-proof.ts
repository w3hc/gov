import hre, { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import * as fs from "fs"
import * as path from "path"

function getDeployedAddress(network: string, contractName: string): string {
    try {
        const deploymentPath = path.join(
            __dirname,
            "..",
            "deployments",
            network,
            `${contractName}.json`
        )
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"))
        return deployment.address
    } catch (error) {
        throw new Error(
            `Failed to read deployment for ${contractName} on ${network}: ${error}`
        )
    }
}

async function main() {
    const networkName = hre.network.name
    const GOV_ADDRESS = getDeployedAddress(networkName, "CrosschainGov")
    console.log("Using Gov contract address:", GOV_ADDRESS)

    const GovFactory = await ethers.getContractFactory(
        "contracts/variants/crosschain/Gov.sol:Gov"
    )
    const gov = Gov__factory.connect(GOV_ADDRESS, GovFactory.runner)

    const newVotingDelay = 42n // Must match propose-voting-delay.ts
    const value = ethers.toBeArray(newVotingDelay)
    const proof = await gov.generateParameterProof(0, value) // 0 is UPDATE_VOTING_DELAY
    console.log("\nVoting delay proof:", proof)

    const data = { proof }
    fs.writeFileSync(
        path.join(__dirname, "..", "data.json"),
        JSON.stringify(data, null, 2)
    )
    console.log("\nVoting delay proof written to data.json")
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
