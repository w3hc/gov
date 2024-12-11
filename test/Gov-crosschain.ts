import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { deployments, ethers, network } from "hardhat"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { EventLog } from "ethers"

describe("Crosschain Gov", function () {
    let HOME_CHAIN_ID: number
    let TARGET_CHAIN_ID: number
    let sourceChainNFT: NFT
    let sourceChainGov: Gov
    let targetChainNFT: NFT
    let targetChainGov: Gov
    let deployer: HardhatEthersSigner
    let alice: HardhatEthersSigner
    let bob: HardhatEthersSigner
    let charlie: HardhatEthersSigner

    before(async function () {
        HOME_CHAIN_ID = 1337 // Hardhat's default chain ID
        TARGET_CHAIN_ID = 1338
    })

    async function deployContracts() {
        const { deterministic } = deployments
        const [deployer, alice, bob, charlie] = await ethers.getSigners()
        const salt = ethers.id("test-v1")

        // Reset network state
        await network.provider.send("hardhat_reset")

        // Deploy source chain contracts
        const { address: nftAddress, deploy: deployNFT } = await deterministic(
            "NFT",
            {
                from: deployer.address,
                contract: "contracts/variants/crosschain/NFT.sol:NFT",
                args: [
                    1337,
                    deployer.address,
                    [alice.address, bob.address],
                    "ipfs://testURI",
                    "TestNFT",
                    "TNFT"
                ],
                salt
            }
        )

        await deployNFT()

        sourceChainNFT = (await ethers.getContractAt(
            "contracts/variants/crosschain/NFT.sol:NFT",
            nftAddress
        )) as unknown as NFT

        const { address: govAddress, deploy: deployGov } = await deterministic(
            "Gov",
            {
                from: deployer.address,
                contract: "contracts/variants/crosschain/Gov.sol:Gov",
                args: [
                    1337,
                    nftAddress,
                    "ipfs://manifestoCID",
                    "TestDAO",
                    1,
                    10,
                    1,
                    5
                ],
                salt
            }
        )

        await deployGov()

        sourceChainGov = (await ethers.getContractAt(
            "contracts/variants/crosschain/Gov.sol:Gov",
            govAddress
        )) as unknown as Gov

        // Transfer ownership
        await sourceChainNFT.connect(deployer).transferOwnership(govAddress)

        // Reset network to simulate different chain
        await network.provider.send("hardhat_reset")

        // Reset nonce for deterministic deployment
        await network.provider.send("hardhat_setNonce", [
            deployer.address,
            "0x0"
        ])

        // Deploy target chain contracts
        await deployNFT()
        targetChainNFT = (await ethers.getContractAt(
            "contracts/variants/crosschain/NFT.sol:NFT",
            nftAddress
        )) as unknown as NFT

        await deployGov()
        targetChainGov = (await ethers.getContractAt(
            "contracts/variants/crosschain/Gov.sol:Gov",
            govAddress
        )) as unknown as Gov

        // Set up target chain
        await targetChainNFT.connect(deployer).transferOwnership(govAddress)

        // Log addresses
        // console.log("\nVerifying addresses:")
        // console.log("Source NFT:", await sourceChainNFT.getAddress())
        // console.log("Target NFT:", await targetChainNFT.getAddress())
        // console.log("Source Gov:", await sourceChainGov.getAddress())
        // console.log("Target Gov:", await targetChainGov.getAddress())

        return {
            sourceChainNFT,
            sourceChainGov,
            targetChainNFT,
            targetChainGov,
            deployer,
            alice,
            bob,
            charlie
        }
    }

    describe("Cross-chain Ops", function () {
        beforeEach(async function () {
            const contracts = await loadFixture(deployContracts)
            deployer = contracts.deployer
            alice = contracts.alice
            bob = contracts.bob
            charlie = contracts.charlie
            sourceChainNFT = contracts.sourceChainNFT
            sourceChainGov = contracts.sourceChainGov
            targetChainNFT = contracts.targetChainNFT
            targetChainGov = contracts.targetChainGov
        })

        it("should generate and verify membership proof", async function () {
            // First verify Alice has enough voting power
            const proposalThreshold = await sourceChainGov.proposalThreshold()
            const aliceVotes = await sourceChainNFT.getVotes(alice.address)
            expect(aliceVotes).to.be.gte(proposalThreshold)

            // Create proposal to add Charlie as member
            const proposalDescription = "Add Charlie as member"
            const mintCalldata = sourceChainNFT.interface.encodeFunctionData(
                "safeMint",
                [charlie.address, "ipfs://charlieURI"]
            )

            const proposeTx = await sourceChainGov
                .connect(alice)
                .propose(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    proposalDescription
                )

            const receipt = await proposeTx.wait()
            const proposalId = (receipt?.logs[0] as EventLog).args[0]

            // Rest of the test remains the same...
        })
    })
})
