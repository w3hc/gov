import hre, { ethers } from "hardhat"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"
import color from "cli-color"
var msg = color.xterm(39).bgXterm(128)

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
    const BOB_PRIVATE_KEY = process.env.BOB

    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!BOB_PRIVATE_KEY || !ALICE_PRIVATE_KEY) {
        throw new Error(
            "Please set BOB and ALICE private keys in your .env file"
        )
    }
    const ALICE_ADDRESS = new ethers.Wallet(ALICE_PRIVATE_KEY).address

    if (!BOB_PRIVATE_KEY || !ALICE_ADDRESS) {
        throw new Error(
            "Please set BOB private key and ALICE_ADDRESS in your .env file"
        )
    }

    const networkName = hre.network.name
    const NFT_ADDRESS = getDeployedAddress(networkName, "CrosschainNFT")

    console.log("Using NFT contract address:", msg(NFT_ADDRESS))

    const provider = new ethers.JsonRpcProvider(
        networkName === "op-sepolia"
            ? process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
            : process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
    )
    const bobSigner = new ethers.Wallet(BOB_PRIVATE_KEY, provider)

    const nft = NFT__factory.connect(NFT_ADDRESS, bobSigner)

    console.log("\nBob's address:", msg(bobSigner.address))
    console.log("Alice's address:", msg(ALICE_ADDRESS))

    // Check if we're on home chain
    const homeChain = await nft.home()
    const currentChainId = await provider.getNetwork().then(n => n.chainId)
    if (homeChain !== BigInt(currentChainId)) {
        throw new Error(
            `Must delegate on home chain (${homeChain}). Current chain: ${currentChainId}`
        )
    }

    // Check if Bob owns any NFTs
    const balance = await nft.balanceOf(bobSigner.address)
    if (balance === 0n) {
        throw new Error("Bob does not own any NFTs")
    }

    console.log("\nDelegating Bob's voting power to Alice...")

    // First check if simulation works
    try {
        await nft.delegate.staticCall(ALICE_ADDRESS)
        console.log("✅ Delegation simulation successful")
    } catch (error: any) {
        console.error("Delegation simulation failed:", error.message)
        throw error
    }

    // Execute the actual delegation
    const tx = await nft.delegate(ALICE_ADDRESS, {
        gasLimit: 500000
    })
    console.log("Transaction submitted:", msg(tx.hash))

    const receipt = await tx.wait()

    if (receipt) {
        const event = receipt.logs.find(log => {
            try {
                return nft.interface.parseLog(log)?.name === "DelegateChanged"
            } catch {
                return false
            }
        })

        if (event) {
            const parsedEvent = nft.interface.parseLog(event)
            console.log("\nDelegation event details:")
            console.log("Delegator:", msg(parsedEvent?.args?.delegator))
            console.log("From:", msg(parsedEvent?.args?.fromDelegate))
            console.log("To:", msg(parsedEvent?.args?.toDelegate))
        }
    }

    console.log("\nDelegation completed on home chain")

    // Verify delegation
    const currentDelegate = await nft.delegates(bobSigner.address)
    console.log("\nVerifying delegation:")
    console.log("Bob's current delegate:", msg(currentDelegate))
    console.log("Expected delegate (Alice):", msg(ALICE_ADDRESS))

    if (currentDelegate.toLowerCase() === ALICE_ADDRESS.toLowerCase()) {
        console.log(color.green("\n✅ Delegation verified successfully"))
    } else {
        console.log(color.red("\n❌ Delegation verification failed"))
        throw new Error("Delegation verification failed")
    }

    // Get Bob's voting power after delegation
    const votingPower = await nft.getVotes(bobSigner.address)
    const aliceVotingPower = await nft.getVotes(ALICE_ADDRESS)
    console.log("\nFinal voting power:")
    console.log("Bob's voting power:", votingPower.toString())
    console.log("Alice's voting power:", aliceVotingPower.toString())
}

main().catch(error => {
    console.error("\nError:", error)
    process.exitCode = 1
})
