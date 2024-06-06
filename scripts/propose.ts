import { ethers } from "hardhat"
const color = require("cli-color")
import govContract from "../deployments/sepolia/Gov.json"
import nftContract from "../deployments/sepolia/NFT.json"
var msg = color.xterm(39).bgXterm(128)

async function main() {
    console.log("\nSubmitting proposal...")

    const [signer] = await ethers.getSigners()

    try {
        const Gov = await ethers.getContractFactory("Gov")
        console.log("govContract.address:", govContract.address)
        console.log("signer.address:", signer.address)

        const gov = new ethers.Contract(
            govContract.address,
            Gov.interface,
            signer
        )

        const NFT = await ethers.getContractFactory("NFT")

        const nft = new ethers.Contract(
            nftContract.address,
            NFT.interface,
            signer
        )

        // const delegate = await nft.delegate(signer.address)
        // const delegateReceipt = await delegate.wait(1)
        // console.log("delegateReceipt:", delegateReceipt)

        const targets = [govContract.address]
        const values = ["0"]
        const calldatas = [
            gov.interface.encodeFunctionData("setManifesto", ["New Manifesto"])
        ]
        const description =
            "# Manifesto update \n Manifesto update! New CID: " +
            Math.random() +
            ")"

        console.log("targets:", targets)
        console.log("values:", values)
        console.log("calldatas:", calldatas)
        console.log("description:", description)

        console.log("name:", await gov.name())

        const propose = await gov.propose(
            targets,
            values,
            calldatas,
            description
        )
        const receipt = await propose.wait(1)
        console.log("receipt:", receipt)
        const block: any = receipt?.blockNumber
        const proposals: any = await gov.queryFilter(
            "ProposalCreated" as any,
            block,
            block
        )
        const proposalId = proposals[0].args[0]
        console.log("proposalId:", msg(Number(proposalId)))
    } catch (e) {
        console.log("error:", e)
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
