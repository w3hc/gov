const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128)
import hre from "hardhat"
import { ethers } from "ethers"

async function main() {
    const networks = Object.entries(hre.config.networks)

    console.log(
        color.cyanBright(
            "\nFetching signer balances for all supported networks...\n"
        )
    )

    for (const [networkName, networkConfig] of networks) {
        try {
            console.log(color.magenta(`\nSwitching to network: ${networkName}`))

            // Ensure network has an RPC URL and accounts
            const { url, accounts } = networkConfig as any

            if (!url || accounts.length === 0) {
                console.error(
                    color.yellow(
                        `Skipping network "${networkName}" due to missing RPC URL or accounts.`
                    )
                )
                continue
            }

            // Create provider and signer
            const provider = new ethers.JsonRpcProvider(url)
            const signer = new ethers.Wallet(accounts[0], provider)

            // Get balance
            const balance = await provider.getBalance(signer.address)

            console.log(
                `Signer (${signer.address}) on network "${networkName}" has`,
                msg(ethers.formatEther(balance)),
                "ETH."
            )
        } catch (error: any) {
            console.error(
                color.red(
                    `Failed to process network ${networkName}: ${error.message}`
                )
            )
        }
    }

    console.log(color.cyanBright("\nDone fetching balances for all networks."))
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
