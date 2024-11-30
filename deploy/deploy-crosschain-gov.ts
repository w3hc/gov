import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import color from "cli-color"
var msg = color.xterm(39).bgXterm(128)
import {
    firstMembers,
    uri,
    name,
    symbol,
    manifesto,
    daoName,
    votingDelay,
    votingPeriod,
    votingThreshold,
    quorum
} from "../dao.config"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre
    const { deterministic } = deployments
    const { deployer } = await getNamedAccounts()

    function wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // Deploy NFT
    const { address: nftAddress, deploy: deployNFT } = await deterministic(
        "CrosschainNFT",
        {
            from: deployer,
            contract: "contracts/variants/crosschain/NFT.sol:NFT",
            args: [11155111, deployer, firstMembers, uri, name, symbol],
            salt: hre.ethers.id("NFT-v2"),
            log: true,
            waitConfirmations: 1
        }
    )

    console.log("NFT contract address:", msg(nftAddress))
    await deployNFT()

    // Wait between deployments
    // await wait(30000)

    // Deploy Gov
    const { address: govAddress, deploy: deployGov } = await deterministic(
        "CrosschainGov",
        {
            from: deployer,
            contract: "contracts/variants/crosschain/Gov.sol:Gov",
            args: [
                11155111,
                nftAddress,
                manifesto,
                daoName,
                votingDelay,
                votingPeriod,
                votingThreshold,
                quorum
            ],
            salt: hre.ethers.id("Gov-v2"),
            log: true,
            waitConfirmations: 5
        }
    )

    console.log("Gov contract address:", msg(govAddress))
    await deployGov()

    // Wait before verification
    // await wait(30000)

    // Transfer NFT ownership to Gov
    const nft = await hre.ethers.getContractAt(
        "contracts/variants/crosschain/NFT.sol:NFT",
        nftAddress
    )
    await nft.transferOwnership(govAddress)
    console.log("NFT ownership transferred to Gov")

    if (hre.network.name !== "hardhat") {
        console.log("\nVerifying NFT contract...")
        try {
            await hre.run("verify:verify", {
                address: nftAddress,
                contract: "contracts/variants/crosschain/NFT.sol:NFT",
                constructorArguments: [
                    11155111,
                    deployer,
                    firstMembers,
                    uri,
                    name,
                    symbol
                ]
            })
            console.log("NFT verification done ✅")
        } catch (err) {
            console.log("NFT verification failed:", err)
        }

        console.log("\nVerifying Gov contract...")
        try {
            await hre.run("verify:verify", {
                address: govAddress,
                contract: "contracts/variants/crosschain/Gov.sol:Gov",
                constructorArguments: [
                    11155111,
                    nftAddress,
                    manifesto,
                    daoName,
                    votingDelay,
                    votingPeriod,
                    votingThreshold,
                    quorum
                ]
            })
            console.log("Gov verification done ✅")
        } catch (err) {
            console.log("Gov verification failed:", err)
        }
    }
}

func.tags = ["CrosschainGov"]
export default func
