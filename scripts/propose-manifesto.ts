import hre, { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

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

function getProposalState(state: number): string {
    const states = [
        "Pending",
        "Active",
        "Canceled",
        "Defeated",
        "Succeeded",
        "Queued",
        "Expired",
        "Executed"
    ]
    return states[state]
}

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }
    if (!SIGNER_PRIVATE_KEY) {
        throw new Error("Please set SIGNER_PRIVATE_KEY in your .env file")
    }

    const networkName = hre.network.name

    const NFT_ADDRESS = getDeployedAddress(networkName, "CrosschainNFT")
    const GOV_ADDRESS = getDeployedAddress(networkName, "CrosschainGov")

    console.log("Using contract addresses:")
    console.log("NFT:", NFT_ADDRESS)
    console.log("Gov:", GOV_ADDRESS)

    const provider = new ethers.JsonRpcProvider(
        networkName === "op-sepolia"
            ? process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
            : process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
    )

    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const signerZero = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)
    console.log("Using address for proposals:", aliceSigner.address)
    console.log("Using address for execution:", signerZero.address)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Check current voting power
    const votingPower = await nft.getVotes(aliceSigner.address)
    console.log("Current voting power:", votingPower)

    if (votingPower === 0n) {
        console.log("Delegating voting power...")
        const tx = await nft.delegate(aliceSigner.address)
        await tx.wait(3)
        console.log("Delegation completed")
        console.log(
            "New voting power:",
            (await nft.getVotes(aliceSigner.address)).toString()
        )
    }

    console.log("Creating proposal to update manifesto...")

    try {
        const newManifesto = "ipfs://newManifestoCID" // Replace with actual CID
        const targets = [gov.target]
        const values = [0]
        const calldatas = [
            gov.interface.encodeFunctionData("setManifesto", [newManifesto])
        ]
        const description = "Update manifesto CID " + Date.now()

        console.log("Creating proposal with:")
        console.log("- Target:", targets[0])
        console.log("- Value:", values[0])
        console.log("- Calldata:", calldatas[0])
        console.log("- Description:", description)

        const tx = await gov.propose(targets, values, calldatas, description)
        console.log("Proposal transaction submitted:", tx.hash)

        const receipt = await tx.wait()
        let proposalId = null
        if (receipt) {
            console.log("Proposal confirmed in block:", receipt.blockNumber)
            proposalId =
                receipt.logs[0] instanceof ethers.EventLog
                    ? receipt.logs[0].args?.[0]
                    : null
            if (proposalId) {
                console.log("Proposal ID:", proposalId)
            }
        }

        if (proposalId) {
            console.log("Checking proposal state before voting...")
            const state = await gov.state(proposalId)
            console.log(
                "Current proposal state:",
                getProposalState(Number(state))
            )

            let currentState = Number(state)
            let attempts = 0
            const maxAttempts = 10

            while (currentState === 0 && attempts < maxAttempts) {
                console.log("Waiting for proposal to become active...")
                await sleep(30000)
                const newState = await gov.state(proposalId)
                currentState = Number(newState)
                console.log(
                    "Current proposal state:",
                    getProposalState(currentState)
                )
                attempts++
            }

            if (currentState === 1) {
                console.log("Casting vote...")
                const voteTx = await gov.castVote(proposalId, 1)
                await voteTx.wait()
                console.log("Vote cast successfully!")

                let isSucceeded = false
                console.log("\nStarting to check proposal state...")

                while (!isSucceeded) {
                    const state = await gov.state(proposalId)
                    console.log(
                        "Current proposal state:",
                        getProposalState(Number(state))
                    )

                    if (getProposalState(Number(state)) === "Succeeded") {
                        isSucceeded = true
                        console.log(
                            "\nProposal succeeded! Preparing for execution..."
                        )

                        try {
                            console.log("\nSubmitting execution transaction...")
                            const executeTx = await gov
                                .connect(signerZero)
                                .execute(
                                    targets,
                                    values,
                                    calldatas,
                                    ethers.id(description)
                                )

                            console.log(
                                "Execution transaction submitted:",
                                executeTx.hash
                            )
                            const executeReceipt = await executeTx.wait()
                            console.log(
                                "Proposal executed successfully in block:",
                                executeReceipt?.blockNumber
                            )

                            // Verify the manifesto was updated
                            try {
                                const newManifestoCid = await gov.manifesto()
                                console.log(
                                    "New manifesto CID:",
                                    newManifestoCid
                                )
                            } catch (error) {
                                console.log(
                                    "Could not verify manifesto update:",
                                    error
                                )
                            }

                            break
                        } catch (error: any) {
                            console.error("\nError executing proposal:", error)
                            throw error
                        }
                    }

                    console.log("Waiting 1 minute before next state check...")
                    await sleep(60000)
                }
            } else {
                console.log(
                    `Could not reach active state. Current state: ${getProposalState(
                        currentState
                    )}`
                )
            }
        }
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = gov.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Could not decode error data")
            }
        }
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
