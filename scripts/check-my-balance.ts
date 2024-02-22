const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128)
import hre, { ethers, network } from "hardhat"
import fs from "fs"

async function main() {
    const [signer] = await ethers.getSigners()

    console.log(
        "\nCurrent signer wallet (" + signer.address + ") has",

        msg(
            ethers.formatEther(
                String(await ethers.provider.getBalance(signer.address))
            )
        ),
        "ETH."
    )
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
