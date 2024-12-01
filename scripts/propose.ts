import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    const ALICE_PRIVATE_KEY = process.env.ALICE
    const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY
    if (!ALICE_PRIVATE_KEY) {
        throw new Error("Please set ALICE private key in your .env file")
    }
    if (!SEPOLIA_PRIVATE_KEY) {
        throw new Error("Please set SEPOLIA_PRIVATE_KEY in your .env file")
    }
    const JUNGLE_ADDRESS = "0xBDC0E420aB9ba144213588A95fa1E5e63CEFf1bE"

    const NFT_ADDRESS = "0x3618A08C0f73625140C6C749F91F7f51e769AdBe"
    const GOV_ADDRESS = "0x76f53bf2ad89DaB4d8b666b9a5C6610C2C2e0EfC"

    // Create provider and signers properly
    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const sepoliaSigner = new ethers.Wallet(SEPOLIA_PRIVATE_KEY, provider)
    console.log("Using address for proposals:", aliceSigner.address)
    console.log("Using address for execution:", sepoliaSigner.address)

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

    console.log("Creating proposal to add new member...")

    try {
        console.log("nft.target:", nft.target)
        const targets = [nft.target]
        const values = [0]

        // Prepare the NFT mint call through the Gov contract
        const mintCall = nft.interface.encodeFunctionData("safeMint", [
            JUNGLE_ADDRESS,
            "https://bafkreicj62l5xu6pk2xx7x7n6b7rpunxb4ehlh7fevyjapid3556smuz4y.ipfs.w3s.link/"
        ])

        const calldatas = [mintCall]
        const description = "Add Jungle as a new member " + Date.now()

        console.log("Creating proposal with:")
        console.log("- Target:", targets[0])
        console.log("- Value:", values[0])
        console.log("- Calldata:", calldatas[0])
        console.log("- Description:", description)

        console.log("\nSimulating proposal execution...")
        try {
            await provider.call({
                to: nft.target,
                data: calldatas[0],
                from: gov.target
            })
            console.log("✅ Simulation successful - NFT minting would succeed")
        } catch (error: any) {
            console.error(
                "❌ Simulation failed - NFT minting would fail:",
                error
            )
            if (error.data) {
                try {
                    const decodedError = nft.interface.parseError(error.data)
                    console.error("Decoded error:", decodedError)
                } catch (e) {
                    console.error("Could not decode error data")
                }
            }
            throw new Error("Proposal simulation failed")
        }

        const tx = await gov
            .connect(aliceSigner)
            .propose(targets, values, calldatas, description)

        console.log("Proposal transaction submitted:", tx.hash)
        let proposalId
        const receipt = await tx.wait()
        if (receipt) {
            console.log("Proposal confirmed in block:", receipt.blockNumber)
            proposalId =
                receipt.logs[0] instanceof ethers.EventLog
                    ? receipt.logs[0].args?.[0]
                    : null
            if (proposalId) {
                console.log("Proposal ID:", proposalId)
            }
        } else {
            throw new Error("Transaction failed - no receipt received")
        }

        console.log("proposalId:", proposalId)
        if (receipt) {
            console.log("Proposal confirmed in block:", receipt.blockNumber)
            const proposalIdFromEvent =
                receipt.logs[0] instanceof ethers.EventLog
                    ? receipt.logs[0].args?.[0]
                    : null
            console.log("Proposal ID from event:", proposalIdFromEvent)

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

            if (proposalId) {
                if (currentState === 1) {
                    console.log("Casting vote...")
                    const voteTx = await gov.castVote(proposalId, 1)
                    const voteReceipt = await voteTx.wait()
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
                                console.log("Execution parameters:")
                                console.log("- Targets:", targets)
                                console.log("- Values:", values)
                                console.log("- Calldatas:", calldatas)
                                console.log(
                                    "- Description hash:",
                                    ethers.id(description)
                                )

                                console.log(
                                    "\nSubmitting execution transaction from Sepolia signer..."
                                )

                                // Connect with sepoliaSigner for execution
                                const executeTx = await gov
                                    .connect(sepoliaSigner)
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
                                console.log("Waiting for confirmation...")

                                const executeReceipt = await executeTx.wait()
                                console.log(
                                    "Proposal executed successfully in block:",
                                    executeReceipt?.blockNumber
                                )

                                try {
                                    const totalSupply = await nft.totalSupply()
                                    console.log(
                                        "NFT total supply:",
                                        totalSupply
                                    )
                                    const newOwner = await nft.ownerOf(
                                        totalSupply - 1n
                                    )
                                    console.log(
                                        "NFT successfully minted to:",
                                        newOwner
                                    )
                                } catch (error) {
                                    console.log(
                                        "Could not verify NFT minting:",
                                        error
                                    )
                                }

                                break
                            } catch (error: any) {
                                console.error("\nError executing proposal:")
                                console.error("Error message:", error.message)

                                if (error.data) {
                                    try {
                                        const decodedError =
                                            gov.interface.parseError(error.data)
                                        console.error(
                                            "Decoded error:",
                                            decodedError
                                        )
                                    } catch (e) {
                                        console.error(
                                            "Raw error data:",
                                            error.data
                                        )
                                    }
                                }

                                if (error.transaction) {
                                    console.error("\nTransaction details:")
                                    console.error("To:", error.transaction.to)
                                    console.error(
                                        "Data:",
                                        error.transaction.data
                                    )
                                }
                                throw error
                            }
                        }

                        console.log(
                            "Waiting 1 minute before next state check..."
                        )
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

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
