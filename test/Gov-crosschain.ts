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
    let david: HardhatEthersSigner

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
            charlie,
            david
        }
    }

    describe("Cross-chain Deployment", function () {
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

        it("should deploy contracts at same addresses on both chains", async function () {
            const sourceNFTAddress = await sourceChainNFT.getAddress()
            const targetNFTAddress = await targetChainNFT.getAddress()
            const sourceGovAddress = await sourceChainGov.getAddress()
            const targetGovAddress = await targetChainGov.getAddress()

            expect(sourceNFTAddress).to.equal(targetNFTAddress)
            expect(sourceGovAddress).to.equal(targetGovAddress)
        })

        it("should initialize contracts with same parameters on both chains", async function () {
            // Compare NFT parameters
            expect(await sourceChainNFT.name()).to.equal(
                await targetChainNFT.name()
            )
            expect(await sourceChainNFT.symbol()).to.equal(
                await targetChainNFT.symbol()
            )

            // Compare Gov parameters
            expect(await sourceChainGov.name()).to.equal(
                await targetChainGov.name()
            )
            expect(await sourceChainGov.votingDelay()).to.equal(
                await targetChainGov.votingDelay()
            )
            expect(await sourceChainGov.votingPeriod()).to.equal(
                await targetChainGov.votingPeriod()
            )
            expect(await sourceChainGov.proposalThreshold()).to.equal(
                await targetChainGov.proposalThreshold()
            )
        })
        it("should verify Alice owns token ID 0 on both chains", async function () {
            const sourceOwner = await sourceChainNFT.ownerOf(0)
            const targetOwner = await targetChainNFT.ownerOf(0)

            expect(sourceOwner).to.equal(alice.address)
            expect(targetOwner).to.equal(alice.address)
            expect(sourceOwner).to.equal(targetOwner)
        })

        it("should verify Bob owns token ID 1 on both chains", async function () {
            const sourceOwner = await sourceChainNFT.ownerOf(1)
            const targetOwner = await targetChainNFT.ownerOf(1)

            expect(sourceOwner).to.equal(bob.address)
            expect(targetOwner).to.equal(bob.address)
            expect(sourceOwner).to.equal(targetOwner)
        })

        it("should verify token ID 2 does not exist on either chain", async function () {
            await expect(sourceChainNFT.ownerOf(2))
                .to.be.revertedWithCustomError(
                    sourceChainNFT,
                    "ERC721NonexistentToken"
                )
                .withArgs(2)

            await expect(targetChainNFT.ownerOf(2))
                .to.be.revertedWithCustomError(
                    targetChainNFT,
                    "ERC721NonexistentToken"
                )
                .withArgs(2)

            expect(await sourceChainNFT.existsOnChain(2)).to.be.false
            expect(await targetChainNFT.existsOnChain(2)).to.be.false
        })
    })

    describe("Cross-chain Ops", function () {
        beforeEach(async function () {
            const contracts = await loadFixture(deployContracts)
            deployer = contracts.deployer
            alice = contracts.alice
            bob = contracts.bob
            charlie = contracts.charlie
            david = contracts.david
            sourceChainNFT = contracts.sourceChainNFT
            sourceChainGov = contracts.sourceChainGov
            targetChainNFT = contracts.targetChainNFT
            targetChainGov = contracts.targetChainGov

            // Delegate voting power to enable proposal creation
            await sourceChainNFT.connect(alice).delegate(alice.address)
            await sourceChainNFT.connect(bob).delegate(bob.address)
        })

        it("should generate and verify membership proof", async function () {
            // Create and execute proposal to mint NFT to Charlie
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

            // Wait for voting delay
            await time.increase(2)

            // Vote on proposal
            await sourceChainGov.connect(alice).castVote(proposalId, 1)
            await sourceChainGov.connect(bob).castVote(proposalId, 1)

            // Wait for voting period to end
            await time.increase(11)

            // Execute proposal
            const descHash = ethers.id(proposalDescription)
            await sourceChainGov
                .connect(deployer)
                .execute(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    descHash
                )

            // Generate proof for Charlie's membership
            const tokenId = (await sourceChainNFT.totalSupply()) - 1n
            const proof = await sourceChainNFT.generateMintProof(tokenId)

            // Verify proof components
            const decodedProof = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256", "address", "string", "bytes32"],
                proof
            )

            expect(decodedProof[0]).to.equal(tokenId) // Token ID
            expect(decodedProof[1]).to.equal(charlie.address) // Owner address
            expect(decodedProof[2]).to.equal("ipfs://charlieURI") // Token URI
        })

        xit("should successfully claim membership on target chain", async function () {
            // Debug initial state
            const initialSupply = await sourceChainNFT.totalSupply()
            console.log("\nInitial state:")
            console.log("Source chain total supply:", initialSupply.toString())
            console.log(
                "Target chain total supply:",
                (await targetChainNFT.totalSupply()).toString()
            )

            // List existing token owners on both chains
            console.log("\nExisting tokens on source chain:")
            for (let i = 0; i < initialSupply; i++) {
                const owner = await sourceChainNFT.ownerOf(i)
                console.log(`Token ${i} owned by ${owner}`)

                // Reset existsOnChain for this token on target chain
                try {
                    // We need to call govBurn instead of regular burn since ownership is with Gov contract
                    const burnCalldata =
                        targetChainNFT.interface.encodeFunctionData("govBurn", [
                            i
                        ])
                    await targetChainGov
                        .connect(deployer)
                        .execute(
                            [await targetChainNFT.getAddress()],
                            [0],
                            [burnCalldata],
                            ethers.id("Reset token state")
                        )
                    console.log(`Reset token ${i} on target chain`)
                } catch (e) {
                    console.log(`Could not reset token ${i}:`, e)
                }
            }

            // Mint NFT on source chain
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

            // Execute proposal with voting
            await time.increase(2)
            await sourceChainGov.connect(alice).castVote(proposalId, 1)
            await sourceChainGov.connect(bob).castVote(proposalId, 1)
            await time.increase(11)

            const descHash = ethers.id(proposalDescription)
            await sourceChainGov
                .connect(deployer)
                .execute(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    descHash
                )

            // Generate proof for the newly minted token
            const newTokenId = (await sourceChainNFT.totalSupply()) - 1n
            console.log("\nAfter minting:")
            console.log("New token ID:", newTokenId.toString())
            console.log(
                "New token owner:",
                await sourceChainNFT.ownerOf(newTokenId)
            )

            // Check if token exists on target chain
            let existsOnTarget = false
            try {
                await targetChainNFT.ownerOf(newTokenId)
                existsOnTarget = true
            } catch (e) {
                // Token doesn't exist - this is what we want
            }
            console.log("Token exists on target chain:", existsOnTarget)

            // Generate and verify proof components
            const proof = await sourceChainNFT.generateMintProof(newTokenId)
            const decodedProof = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256", "address", "string", "bytes32"],
                proof
            )
            console.log("\nProof components:")
            console.log("Token ID:", decodedProof[0])
            console.log("Owner address:", decodedProof[1])
            console.log("Token URI:", decodedProof[2])

            // Now claim membership on target chain
            await targetChainNFT.connect(charlie).claimMint(proof)

            // Verify final state
            expect(await targetChainNFT.ownerOf(newTokenId)).to.equal(
                charlie.address
            )
            expect(await targetChainNFT.tokenURI(newTokenId)).to.equal(
                "ipfs://charlieURI"
            )
        })

        xit("should prevent duplicate membership claims on target chain", async function () {
            // Set up membership on source chain
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

            await time.increase(2)
            await sourceChainGov.connect(alice).castVote(proposalId, 1)
            await sourceChainGov.connect(bob).castVote(proposalId, 1)
            await time.increase(11)

            const descHash = ethers.id(proposalDescription)
            await sourceChainGov
                .connect(deployer)
                .execute(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    descHash
                )

            // Generate and use proof for first claim
            const tokenId = (await sourceChainNFT.totalSupply()) - 1n
            const proof = await sourceChainNFT.generateMintProof(tokenId)
            await targetChainNFT.connect(charlie).claimMint(proof)

            // Attempt duplicate claim
            await expect(
                targetChainNFT.connect(charlie).claimMint(proof)
            ).to.be.revertedWith("Token already exists on this chain")
        })

        xit("should reject invalid membership proofs", async function () {
            // Generate valid proof first
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

            await time.increase(2)
            await sourceChainGov.connect(alice).castVote(proposalId, 1)
            await sourceChainGov.connect(bob).castVote(proposalId, 1)
            await time.increase(11)

            const descHash = ethers.id(proposalDescription)
            await sourceChainGov
                .connect(deployer)
                .execute(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    descHash
                )

            const tokenId = (await sourceChainNFT.totalSupply()) - 1n
            const validProof = await sourceChainNFT.generateMintProof(tokenId)

            // Create invalid proof by modifying the address
            const decodedProof = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256", "address", "string", "bytes32"],
                validProof
            )
            const invalidProof = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "address", "string", "bytes32"],
                [
                    decodedProof[0],
                    david.address,
                    decodedProof[2],
                    decodedProof[3]
                ]
            )

            // Attempt to claim with invalid proof
            await expect(
                targetChainNFT.connect(charlie).claimMint(invalidProof)
            ).to.be.revertedWith("Invalid mint proof")
        })

        xit("should properly sync voting power after membership claim", async function () {
            // Set up membership on source chain
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

            await time.increase(2)
            await sourceChainGov.connect(alice).castVote(proposalId, 1)
            await sourceChainGov.connect(bob).castVote(proposalId, 1)
            await time.increase(11)

            const descHash = ethers.id(proposalDescription)
            await sourceChainGov
                .connect(deployer)
                .execute(
                    [await sourceChainNFT.getAddress()],
                    [0],
                    [mintCalldata],
                    descHash
                )

            // Claim membership on target chain
            const tokenId = (await sourceChainNFT.totalSupply()) - 1n
            const proof = await sourceChainNFT.generateMintProof(tokenId)
            await targetChainNFT.connect(charlie).claimMint(proof)

            // Delegate voting power
            await targetChainNFT.connect(charlie).delegate(charlie.address)

            // Verify voting power
            expect(await targetChainNFT.getVotes(charlie.address)).to.equal(1)
        })
    })
})
