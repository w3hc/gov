import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

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
    if (!ALICE_PRIVATE_KEY || !SIGNER_PRIVATE_KEY) {
        throw new Error("Please set required private keys in your .env file")
    }

    const NFT_ADDRESS = "0x147613E970bbA94e19a70A8b0f9106a13B4d7cbE"
    const GOV_ADDRESS = "0x87b094e13DDe7e8d7F2793bD2Ac8636C7C0EcFD7"
    const TOKEN_ID = 2 // Token ID to burn

    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )
    const aliceSigner = new ethers.Wallet(ALICE_PRIVATE_KEY, provider)
    const sepoliaSigner = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)

    console.log("Connected with address:", aliceSigner.address)

    const gov = Gov__factory.connect(GOV_ADDRESS, aliceSigner)
    const nft = NFT__factory.connect(NFT_ADDRESS, aliceSigner)

    // Check voting power and delegate if needed
    const votingPower = await nft.getVotes(aliceSigner.address)
    console.log("Current voting power:", votingPower.toString())

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

    const burnCall = nft.interface.encodeFunctionData("govBurn", [TOKEN_ID])
    const description = `Burn token ${TOKEN_ID} ${Date.now()}`

    try {
        console.log("\nCreating proposal to burn token", TOKEN_ID)
        const tx = await gov.propose([nft.target], [0], [burnCall], description)

        console.log("Proposal transaction submitted:", tx.hash)
        const receipt = await tx.wait()
        if (!receipt) throw new Error("No receipt received")

        const proposalId =
            receipt.logs[0] instanceof ethers.EventLog
                ? receipt.logs[0].args?.[0]
                : null

        console.log("Proposal ID:", proposalId)
        if (!proposalId) throw new Error("No proposal ID found")

        // Wait for proposal to become active
        console.log("\nWaiting for proposal to become active...")
        let state = await gov.state(proposalId)
        let currentState = getProposalState(Number(state))
        console.log("Current state:", currentState)

        while (currentState === "Pending") {
            await new Promise(r => setTimeout(r, 5000))
            state = await gov.state(proposalId)
            currentState = getProposalState(Number(state))
            process.stdout.write(`Current state: ${currentState}\r`)
        }
        console.log("\nProposal is now", currentState)

        if (currentState === "Active") {
            console.log("\nCasting vote...")
            const voteTx = await gov.castVote(proposalId, 1)
            console.log("Vote transaction submitted:", voteTx.hash)
            await voteTx.wait()
            console.log("Vote cast successfully")

            // Wait for proposal to succeed
            console.log("\nWaiting for proposal to succeed...")
            let successCounter = 0
            const maxAttempts = 60 // 5 minutes with 5s intervals

            while (successCounter < maxAttempts) {
                state = await gov.state(proposalId)
                currentState = getProposalState(Number(state))
                process.stdout.write(
                    `Current state: ${currentState} (Attempt ${
                        successCounter + 1
                    }/${maxAttempts})\r`
                )

                if (currentState === "Succeeded") {
                    console.log("\nProposal has succeeded!")
                    break
                } else if (
                    currentState === "Defeated" ||
                    currentState === "Expired"
                ) {
                    throw new Error(`Proposal ${currentState.toLowerCase()}`)
                }

                successCounter++
                await new Promise(r => setTimeout(r, 5000))
            }

            if (successCounter >= maxAttempts) {
                throw new Error("Timeout waiting for proposal to succeed")
            }

            // Execute proposal
            console.log("\nExecuting proposal...")
            const executeTx = await gov
                .connect(sepoliaSigner)
                .execute([nft.target], [0], [burnCall], ethers.id(description))

            console.log("Execution transaction submitted:", executeTx.hash)
            await executeTx.wait()
            console.log("\nToken burned successfully! 🎉")
        } else {
            throw new Error(`Unexpected proposal state: ${currentState}`)
        }
    } catch (error: any) {
        console.error("\nError details:", error)
        if (error.data) {
            try {
                const decodedError = gov.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Raw error data:", error.data)
            }
        }
        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
