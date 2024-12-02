import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"

// Utility functions
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

async function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms))
}

async function waitForProposalState(
    gov: any,
    proposalId: bigint,
    targetState: string,
    maxAttempts = 60
) {
    let currentState = ""
    let attempt = 0

    while (attempt < maxAttempts) {
        const state = await gov.state(proposalId)
        currentState = getProposalState(Number(state))

        process.stdout.write(
            `Current state: ${currentState} (Attempt ${
                attempt + 1
            }/${maxAttempts})\r`
        )

        if (currentState === targetState) {
            console.log(`\nReached ${targetState} state!`)
            return true
        }

        if (["Defeated", "Expired", "Canceled"].includes(currentState)) {
            throw new Error(`Proposal ${currentState.toLowerCase()}`)
        }

        attempt++
        await sleep(5000)
    }

    throw new Error(`Timeout waiting for ${targetState} state`)
}

async function main() {
    // Configuration
    const config = {
        nftAddress: "0xe74bC6A3Ee4ED824708DD88465BD2CdD6b869620",
        govAddress: "0xB8de4177BAf7365DFc7E6ad860E4B223b40f91A0",
        newVotingDelay: 250n,
        rpcUrl: process.env.SEPOLIA_RPC_ENDPOINT_URL,
        aliceKey: process.env.ALICE,
        sepoliaKey: process.env.SIGNER_PRIVATE_KEY
    }

    // Validate environment
    if (!config.aliceKey || !config.sepoliaKey) {
        throw new Error("Missing required environment variables")
    }

    // Setup providers and signers
    const provider = new ethers.JsonRpcProvider(config.rpcUrl)
    const aliceSigner = new ethers.Wallet(config.aliceKey, provider)
    const sepoliaSigner = new ethers.Wallet(config.sepoliaKey, provider)

    console.log("Network:", await provider.getNetwork())
    console.log("Connected with address:", aliceSigner.address)
    console.log("Block number:", await provider.getBlockNumber())

    // Contract connections
    const gov = Gov__factory.connect(config.govAddress, aliceSigner)
    const nft = NFT__factory.connect(config.nftAddress, aliceSigner)

    // Check voting power
    const votingPower = await nft.getVotes(aliceSigner.address)
    console.log("Current voting power:", votingPower.toString())

    if (votingPower === 0n) {
        console.log("\nDelegating voting power...")
        const tx = await nft.delegate(aliceSigner.address)
        console.log("Delegation tx:", tx.hash)
        await tx.wait(3)
        const newPower = await nft.getVotes(aliceSigner.address)
        console.log("New voting power:", newPower.toString())
    }

    // Prepare proposal
    const description = `Update voting delay to ${
        config.newVotingDelay
    } blocks [${Date.now()}]`
    const delayCall = gov.interface.encodeFunctionData("setVotingDelay", [
        config.newVotingDelay
    ])

    try {
        // Create proposal
        console.log("\nCreating proposal...")
        console.log("Description:", description)

        const proposeTx = await gov.propose(
            [gov.target],
            [0],
            [delayCall],
            description
        )
        console.log("Proposal tx submitted:", proposeTx.hash)

        const receipt = await proposeTx.wait()
        if (!receipt) throw new Error("No receipt received")

        const proposalId =
            receipt.logs[0] instanceof ethers.EventLog
                ? receipt.logs[0].args?.[0]
                : null

        if (!proposalId) throw new Error("No proposal ID found")
        console.log("Proposal ID:", proposalId)

        // Wait for active state
        console.log("\nWaiting for proposal to become active...")
        await waitForProposalState(gov, proposalId, "Active")

        // Cast vote
        console.log("\nCasting vote...")
        const voteTx = await gov.castVote(proposalId, 1) // 1 = For
        await voteTx.wait()
        console.log("Vote cast successfully:", voteTx.hash)

        // Wait for success
        console.log("\nWaiting for proposal to succeed...")
        await waitForProposalState(gov, proposalId, "Succeeded")

        // Execute proposal
        console.log("\nExecuting proposal...")
        const executeTx = await gov
            .connect(sepoliaSigner)
            .execute([gov.target], [0], [delayCall], ethers.id(description))

        console.log("Execute tx submitted:", executeTx.hash)
        await executeTx.wait()

        // Verify result
        const newDelay = await gov.votingDelay()
        console.log("\nVoting delay updated successfully! 🎉")
        console.log("New voting delay:", newDelay.toString(), "blocks")
    } catch (error: any) {
        console.error("\nError details:")
        console.error("Message:", error.message)

        if (error.data) {
            try {
                const decodedError = gov.interface.parseError(error.data)
                console.error("Decoded error:", decodedError)
            } catch (e) {
                console.error("Raw error data:", error.data)
            }
        }

        if (error.transaction) {
            console.error("\nTransaction details:")
            console.error("To:", error.transaction.to)
            console.error("Data:", error.transaction.data)
        }

        throw error
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
