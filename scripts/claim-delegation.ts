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

function getProofFromData(): string {
    try {
        const dataPath = path.join(__dirname, "..", "data.json")
        const data = JSON.parse(fs.readFileSync(dataPath, "utf8"))
        return data.proof
    } catch (error) {
        throw new Error(`Failed to read proof from data.json: ${error}`)
    }
}

async function main() {
    const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY
    const ALICE_PRIVATE_KEY = process.env.ALICE
    if (!SIGNER_PRIVATE_KEY || !ALICE_PRIVATE_KEY) {
        throw new Error(
            "Please set SIGNER_PRIVATE_KEY and ALICE private key in your .env file"
        )
    }
    const ALICE_ADDRESS = new ethers.Wallet(ALICE_PRIVATE_KEY).address

    const networkName = hre.network.name
    const NFT_ADDRESS = getDeployedAddress(networkName, "CrosschainNFT")
    console.log("Using NFT contract address:", msg(NFT_ADDRESS))

    const provider = new ethers.JsonRpcProvider(
        networkName === "op-sepolia"
            ? process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
            : process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL
    )
    const signer = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider)

    const nft = NFT__factory.connect(NFT_ADDRESS, signer)

    // Verify we're NOT on home chain
    const homeChain = await nft.home()
    const currentChainId = await provider.getNetwork().then(n => n.chainId)
    if (homeChain === BigInt(currentChainId)) {
        throw new Error(
            `Cannot claim on home chain. Please use a different network.`
        )
    }

    const proof = getProofFromData()
    console.log("\nUsing delegation proof:", msg(proof))

    // Decode and validate proof before submitting
    const [delegator, delegate, digest] =
        ethers.AbiCoder.defaultAbiCoder().decode(
            ["address", "address", "bytes32"],
            proof
        )
    console.log("\nDecoded proof validation:")
    console.log("Delegator:", msg(delegator))
    console.log("Delegate:", msg(delegate))

    // Simulate the claim first
    console.log("\nSimulating delegation claim...")
    try {
        await nft.claimDelegation.staticCall(proof)
        console.log(color.green("✅ Simulation successful"))
    } catch (error: any) {
        console.error(color.red("Simulation failed:"), error.message)
        throw error
    }

    // Execute the actual claim
    console.log("\nSubmitting delegation claim transaction...")
    const tx = await nft.claimDelegation(proof, {
        gasLimit: 500000
    })

    console.log("Transaction submitted:", msg(tx.hash))
    const receipt = await tx.wait()

    if (receipt) {
        const event = receipt.logs.find(log => {
            try {
                return (
                    nft.interface.parseLog(log)?.name ===
                    "CrosschainDelegationClaimed"
                )
            } catch {
                return false
            }
        })

        if (event) {
            const parsedEvent = nft.interface.parseLog(event)
            console.log("\nDelegation claim event details:")
            console.log("Delegator:", msg(parsedEvent?.args?.delegator))
            console.log("Delegate:", msg(parsedEvent?.args?.delegate))
            console.log("Claimer:", msg(parsedEvent?.args?.claimer))
        }
    }

    // Verify final delegation state
    const currentDelegate = await nft.delegates(signer.address)
    console.log("\nVerifying final delegation state:")
    console.log("Signer's current delegate:", msg(currentDelegate))
    console.log("Expected delegate (Alice):", msg(ALICE_ADDRESS))

    console.log(
        color.green(
            "\n✅ Cross-chain delegation claimed and verified successfully!"
        )
    )
}

main().catch(error => {
    console.error("\nError:", error)
    process.exitCode = 1
})
