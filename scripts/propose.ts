import { ethers } from "hardhat"
const color = require("cli-color")
import govContract from "../deployments/sepolia/Gov.json"
var msg = color.xterm(39).bgXterm(128)

async function main() {
    console.log("\nSubmitting proposal...")

    const [signer] = await ethers.getSigners()

    try {
        const Gov = await ethers.getContractFactory("Gov")
        const gov = new ethers.Contract(
            govContract.address,
            Gov.interface,
            signer
        )

        const x = (await gov.getProposalCreatedBlocks()).length

        const targets = [await gov.getAddress()]
        const values = [0]
        const calldatas = [
            gov.interface.encodeFunctionData("setManifesto", ["New Manifesto"])
        ]
        const description =
            "# Manifesto update #" +
            String(x + 1) +
            "\n desc desc desc desc desc desc desc desc desc desc desc desc desc desc desc desc desc "
        const propose = await gov.propose(
            targets,
            values,
            calldatas,
            description
        )
        await propose.wait(1)

        const proposalCreatedBlocks = await gov.getProposalCreatedBlocks()

        console.log(await gov.getProposalCreatedBlocks())

        for (let i = 0; i < proposalCreatedBlocks.length; i++) {
            const proposals = (await gov.queryFilter(
                "ProposalCreated",
                proposalCreatedBlocks[i]
            )) as any

            if (proposals.length > 0) {
                console.log(
                    "\n",
                    Number(proposalCreatedBlocks[i]),
                    msg(proposals[0].args[0])
                )
            } else {
                console.log(
                    "\nNo proposals found for block number",
                    proposalCreatedBlocks[i]
                )
            }
        }
    } catch (e) {
        console.log("error:", e)
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
