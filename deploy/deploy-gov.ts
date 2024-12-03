import "@nomiclabs/hardhat-ethers"
import color from "cli-color"
var msg = color.xterm(39).bgXterm(128)
import hre, { ethers, network } from "hardhat"
import { abi } from "../artifacts/contracts/NFT.sol/NFT.json"
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

export default async ({ getNamedAccounts, deployments }: any) => {
    const { deploy } = deployments

    function wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    const { deployer } = await getNamedAccounts()
    const signer = await ethers.getSigner(deployer)
    console.log("deployer:", deployer)

    const nft = await deploy("NFT", {
        from: deployer,
        args: [deployer, firstMembers, uri, name, symbol],
        log: true,
        overwrite: true
    })

    const gov = await deploy("Gov", {
        from: deployer,
        args: [
            nft.address,
            manifesto,
            daoName,
            votingDelay,
            votingPeriod,
            votingThreshold,
            quorum
        ],
        log: true,
        overwrite: true
    })

    switch (hre.network.name) {
        case "optimism":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "base":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "sepolia":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(90 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "opSepolia":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break

        case "baseSepolia":
            try {
                console.log(
                    "NFT contract deployed:",
                    msg(nft.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await wait(30 * 1000)
                await hre.run("verify:verify", {
                    network: network.name,
                    address: nft.receipt.contractAddress,
                    constructorArguments: [
                        deployer,
                        firstMembers,
                        uri,
                        name,
                        symbol
                    ]
                })
                console.log("NFT contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            try {
                console.log(
                    "DAO contract deployed:",
                    msg(gov.receipt.contractAddress)
                )
                console.log("\nEtherscan verification in progress...")
                console.log(
                    "\nWaiting for 6 block confirmations (you can skip this part)"
                )
                await hre.run("verify:verify", {
                    network: network.name,
                    address: gov.receipt.contractAddress,
                    constructorArguments: [
                        nft.address,
                        manifesto,
                        daoName,
                        votingDelay,
                        votingPeriod,
                        votingThreshold,
                        quorum
                    ]
                })
                console.log("DAO contract verification done. ✅")
            } catch (error) {
                console.error(error)
            }

            break
    }

    const nftContract = new ethers.Contract(nft.address, abi, signer)
    await nftContract.transferOwnership(gov.address)
    console.log("\nNFT contract ownership transferred to the DAO. ✅")
}
export const tags = ["Gov"]
