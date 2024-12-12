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

            // Skip hardhat and localhost networks
            if (networkName === "hardhat" || networkName === "localhost") {
                console.log(
                    color.yellow(
                        `Skipping local network "${networkName}" - only checking remote networks.`
                    )
                )
                continue
            }

            // Type assertion for network config
            const config = networkConfig as {
                url?: string
                accounts?: string[]
            }

            // Check if network is properly configured
            if (
                !config.url ||
                !config.accounts ||
                config.accounts.length === 0
            ) {
                console.log(
                    color.yellow(
                        `Skipping network "${networkName}" - missing configuration in .env file`
                    )
                )
                continue
            }

            // Create provider with retry options
            const provider = new ethers.JsonRpcProvider(config.url, undefined, {
                maxRetries: 3,
                timeout: 10000
            })

            // Test provider connection
            try {
                await provider.getNetwork()
            } catch (error) {
                console.log(
                    color.yellow(
                        `Failed to connect to network "${networkName}" - check RPC URL`
                    )
                )
                continue
            }

            // Create signer and get balance
            const signer = new ethers.Wallet(config.accounts[0], provider)
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
