import { ethers } from "hardhat"
import color from "cli-color"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { NFT__factory } from "../typechain-types/factories/contracts/variants/crosschain/NFT__factory"
import * as fs from "fs"
import * as path from "path"

const msg = color.xterm(39).bgXterm(128)

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

async function verifyNetwork(networkName: string, rpcUrl: string) {
    console.log(color.magenta(`\nVerifying setup on ${networkName}...`))

    try {
        // Get deployed addresses from deployment files
        const nftAddress = getDeployedAddress(networkName, "CrosschainNFT")
        const govAddress = getDeployedAddress(networkName, "CrosschainGov")

        console.log(msg("\nDeployed Addresses:"))
        console.log(`NFT: ${nftAddress}`)
        console.log(`Gov: ${govAddress}`)

        // Create provider with correct options
        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Test provider connection
        const network = await provider.getNetwork()
        console.log(
            `Connected to ${networkName} (Chain ID: ${network.chainId})`
        )

        // Verify NFT Contract
        const nft = NFT__factory.connect(nftAddress, provider)
        console.log("\nVerifying NFT contract...")

        try {
            const nftName = await nft.name()
            const nftSymbol = await nft.symbol()
            const totalSupply = await nft.totalSupply()
            const homeChain = await nft.home()

            console.log(msg("NFT Contract Details:"))
            console.log(`- Address: ${nftAddress}`)
            console.log(`- Name: ${nftName}`)
            console.log(`- Symbol: ${nftSymbol}`)
            console.log(`- Total Supply: ${totalSupply}`)
            console.log(`- Home Chain ID: ${homeChain}`)
        } catch (error) {
            console.error(color.red("Failed to verify NFT contract"), error)
            return false
        }

        // Verify Gov Contract
        const gov = Gov__factory.connect(govAddress, provider)
        console.log("\nVerifying Gov contract...")

        try {
            const name = await gov.name()
            const votingDelay = await gov.votingDelay()
            const votingPeriod = await gov.votingPeriod()
            const manifesto = await gov.manifesto()
            const homeChain = await gov.home()

            console.log(msg("Gov Contract Details:"))
            console.log(`- Address: ${govAddress}`)
            console.log(`- Name: ${name}`)
            console.log(`- Voting Delay: ${votingDelay} blocks`)
            console.log(`- Voting Period: ${votingPeriod} blocks`)
            console.log(`- Manifesto CID: ${manifesto}`)
            console.log(`- Home Chain ID: ${homeChain}`)

            // Verify NFT ownership
            const nftOwner = await nft.owner()
            const expectedOwner = gov.target

            // Convert addresses to strings for comparison
            const ownerStr = nftOwner.toString()
            const expectedStr = expectedOwner.toString()

            if (ownerStr.toLowerCase() === expectedStr.toLowerCase()) {
                console.log(
                    msg("\n✅ NFT ownership correctly transferred to Gov")
                )
            } else {
                console.log(
                    color.red("\n❌ NFT ownership not transferred to Gov")
                )
                console.log(`Current owner: ${ownerStr}`)
                console.log(`Expected owner: ${expectedStr}`)
            }
        } catch (error) {
            console.error(color.red("Failed to verify Gov contract"), error)
            return false
        }

        return true
    } catch (error) {
        console.error(color.red(`Failed to verify ${networkName}`), error)
        return false
    }
}

async function main() {
    console.log(
        color.cyanBright("\nStarting cross-chain setup verification...\n")
    )

    const networks = {
        "op-sepolia": {
            rpcUrl:
                process.env.OP_SEPOLIA_RPC_ENDPOINT_URL ||
                "https://sepolia.optimism.io"
        },
        "arbitrum-sepolia": {
            rpcUrl:
                process.env.ARBITRUM_SEPOLIA_RPC_ENDPOINT_URL ||
                "https://sepolia-rollup.arbitrum.io/rpc"
        }
    }

    let success = true
    for (const [networkName, config] of Object.entries(networks)) {
        try {
            const networkSuccess = await verifyNetwork(
                networkName,
                config.rpcUrl
            )
            if (!networkSuccess) success = false
        } catch (error) {
            console.error(color.red(`Failed to verify ${networkName}`), error)
            success = false
        }
    }

    if (success) {
        console.log(
            color.green(
                "\n✅ Cross-chain setup verification completed successfully!"
            )
        )
    } else {
        console.log(
            color.red(
                "\n❌ Cross-chain setup verification failed on one or more networks"
            )
        )
        process.exitCode = 1
    }
}

main().catch(error => {
    console.error(color.red("\nScript failed:"), error)
    process.exitCode = 1
})
