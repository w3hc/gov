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

    // Verify we're on home chain
    const homeChain = await nft.home()
    const currentChainId = await provider.getNetwork().then(n => n.chainId)
    if (homeChain !== BigInt(currentChainId)) {
        throw new Error(
            `Must generate proof on home chain (${homeChain}). Current chain: ${currentChainId}`
        )
    }

    // Verify current delegation state
    const currentDelegate = await nft.delegates(signer.address)
    if (currentDelegate.toLowerCase() !== ALICE_ADDRESS.toLowerCase()) {
        throw new Error(
            `Invalid delegation state. Signer's current delegate: ${currentDelegate}, Expected: ${ALICE_ADDRESS}`
        )
    }

    console.log("\nGenerating delegation proof...")
    console.log("Delegator (Signer):", msg(signer.address))
    console.log("Delegate (Alice):", msg(ALICE_ADDRESS))

    try {
        const proof = await nft.generateDelegationProof(
            signer.address,
            ALICE_ADDRESS
        )
        console.log("\nProof:", msg(proof))

        const data = { proof }
        fs.writeFileSync(
            path.join(__dirname, "..", "data.json"),
            JSON.stringify(data, null, 2)
        )
        console.log(color.green("\n✅ Delegation proof saved to data.json"))

        // Validate the proof format
        const [delegator, delegate, digest] =
            ethers.AbiCoder.defaultAbiCoder().decode(
                ["address", "address", "bytes32"],
                proof
            )
        console.log("\nDecoded proof validation:")
        console.log("Delegator:", msg(delegator))
        console.log("Delegate:", msg(delegate))
        console.log("Digest:", msg(digest))
    } catch (error: any) {
        console.error(
            color.red("\nFailed to generate or save proof:"),
            error.message
        )
        throw error
    }
}

main().catch(error => {
    console.error("\nError:", error)
    process.exitCode = 1
})
