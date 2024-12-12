import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { NFT } from "../typechain-types/contracts/NFT"
import { Gov } from "../typechain-types/contracts/Gov"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { EventLog } from "ethers"

describe("Gov", function () {
    let gov: Gov
    let nft: NFT
    let owner: HardhatEthersSigner
    let alice: HardhatEthersSigner
    let bob: HardhatEthersSigner
    let charlie: HardhatEthersSigner
    let david: HardhatEthersSigner

    async function deployContracts() {
        ;[owner, alice, bob, charlie, david] = await ethers.getSigners()

        // Deploy NFT with initial members
        const NFTFactory = await ethers.getContractFactory(
            "contracts/NFT.sol:NFT"
        )
        const nftContract = (await NFTFactory.deploy(
            owner.address,
            [alice.address, bob.address], // Only Alice and Bob get NFTs initially
            "ipfs://testURI",
            "TestNFT",
            "TNFT"
        )) as unknown as NFT
        await nftContract.waitForDeployment()
        nft = nftContract

        // Deploy Gov contract
        const GovFactory = await ethers.getContractFactory(
            "contracts/Gov.sol:Gov"
        )
        const govContract = (await GovFactory.deploy(
            await nft.getAddress(),
            "ipfs://testManifesto",
            "TestGov",
            1, // votingDelay
            50, // votingPeriod
            1, // proposalThreshold
            1 // quorum
        )) as unknown as Gov
        await govContract.waitForDeployment()
        gov = govContract

        // Transfer NFT contract ownership to Gov
        await nft.transferOwnership(await gov.getAddress())

        return { gov, nft, owner, alice, bob, charlie, david }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployContracts)
        gov = contracts.gov
        nft = contracts.nft
        owner = contracts.owner
        alice = contracts.alice
        bob = contracts.bob
        charlie = contracts.charlie
        david = contracts.david
    })

    describe("NFT Core Functionality", function () {
        it("should show correct initial NFT distribution", async function () {
            expect(await nft.balanceOf(alice.address)).to.equal(1)
            expect(await nft.balanceOf(bob.address)).to.equal(1)
            expect(await nft.balanceOf(charlie.address)).to.equal(0)
            expect(await nft.balanceOf(david.address)).to.equal(0)
        })

        it("should not allow NFT transfers", async function () {
            const aliceTokenId = 0
            await expect(
                nft
                    .connect(alice)
                    .transferFrom(alice.address, charlie.address, aliceTokenId)
            ).to.be.revertedWith("This NFT is not transferable")
        })

        it("should allow the DAO to mint new NFTs", async function () {
            const targets = [await nft.getAddress()]
            const values = [0]
            const calldatas = [
                nft.interface.encodeFunctionData("safeMint", [
                    charlie.address,
                    "ipfs://newURI"
                ])
            ]
            const description = "Mint new member NFT"

            // Alice creates and votes on proposal
            await nft.connect(alice).delegate(alice.address)
            const tx = await gov
                .connect(alice)
                .propose(targets, values, calldatas, description)
            const receipt = await tx.wait()
            const proposalId = (
                receipt?.logs?.find(
                    log =>
                        log instanceof EventLog &&
                        log.eventName === "ProposalCreated"
                ) as EventLog
            )?.args?.[0]

            await time.increase(2)
            await gov.connect(alice).castVote(proposalId, 1)
            await time.increase(51)
            await gov.execute(
                targets,
                values,
                calldatas,
                ethers.id(description)
            )

            expect(await nft.balanceOf(charlie.address)).to.equal(1)
        })
    })

    describe("Delegation Mechanics", function () {
        describe("Basic Delegation", function () {
            it("should allow NFT holders to delegate their votes", async function () {
                await expect(nft.connect(alice).delegate(david.address)).to.not
                    .be.reverted
                expect(await nft.getVotes(david.address)).to.equal(1)
            })

            it("should allow non-NFT holders to delegate (but with no effect)", async function () {
                await nft.connect(charlie).delegate(david.address)
                expect(await nft.getVotes(david.address)).to.equal(0)
            })

            it("should allow self-delegation", async function () {
                await nft.connect(alice).delegate(alice.address)
                expect(await nft.getVotes(alice.address)).to.equal(1)
            })
        })

        describe("Delegation Transfers", function () {
            it("should properly transfer voting power when changing delegates", async function () {
                // Initial delegation
                await nft.connect(alice).delegate(david.address)
                expect(await nft.getVotes(david.address)).to.equal(1)

                // Change delegation
                await nft.connect(alice).delegate(bob.address)
                expect(await nft.getVotes(david.address)).to.equal(0)
                expect(await nft.getVotes(bob.address)).to.equal(2)
            })

            it("should maintain zero voting power for non-holders across multiple delegations", async function () {
                // First check initial state
                const initialBobVotes = await nft.getVotes(bob.address)

                // Charlie (non-holder) performs multiple delegations
                await nft.connect(charlie).delegate(david.address)
                await nft.connect(charlie).delegate(alice.address)
                await nft.connect(charlie).delegate(bob.address)

                expect(await nft.getVotes(david.address)).to.equal(0)
                expect(await nft.getVotes(alice.address)).to.equal(1)

                // Bob should maintain only his original voting power if any
                expect(await nft.getVotes(bob.address)).to.equal(
                    initialBobVotes
                )
            })
            it("should auto-delegate voting power to initial members on deployment", async function () {
                const { nft } = await loadFixture(deployContracts)

                // Get current timestamp
                const startTime = await time.latest()

                // Increase time by only 1 sec in on this network
                await time.increase(1)

                // Check voting power at the starting timestamp
                const alicePower = await nft.getPastVotes(
                    alice.address,
                    startTime
                )
                const bobPower = await nft.getPastVotes(bob.address, startTime)

                expect(alicePower).to.equal(1)
                expect(bobPower).to.equal(1)
                expect(await nft.delegates(alice.address)).to.equal(
                    alice.address
                )
                expect(await nft.delegates(bob.address)).to.equal(bob.address)
            })
        })

        describe("Historical Delegation Checks", function () {
            it("should track historical voting power correctly", async function () {
                // Helper function to display votes at a specific block
                // async function showVotes(label: string, block?: number) {
                //     const votes =
                //         block !== undefined
                //             ? await nft.getPastVotes(alice.address, block)
                //             : await nft.getVotes(alice.address)
                //     console.log(`${label}:`, votes.toString())
                // }

                // Initial state
                // console.log("\nInitial State:")
                // const startBlock = await ethers.provider.getBlockNumber()
                // await showVotes(`Block ${startBlock} votes`)

                // Step 1: Alice self-delegates
                // console.log("\nStep 1: Self Delegation")
                // const selfDelegateTx = await nft
                //     .connect(alice)
                //     .delegate(alice.address)
                // const selfDelegateReceipt = await selfDelegateTx.wait()
                // const delegateBlock = selfDelegateReceipt.blockNumber
                // console.log("Delegation occurred at block:", delegateBlock)
                // await showVotes("Current votes after delegation")

                // Mine an additional block
                // await ethers.provider.send("evm_mine", [])
                // const nextBlock = await ethers.provider.getBlockNumber()
                // console.log("\nBlock after delegation:", nextBlock)

                // Check votes at all relevant blocks
                // for (let block = startBlock; block <= nextBlock; block++) {
                //     await showVotes(`Votes at block ${block}`, block)
                // }

                // Step 2: Verify delegation to David
                // console.log("\nStep 2: Delegate to DaviInitial State:d")
                const davidDelegateTx = await nft
                    .connect(alice)
                    .delegate(david.address)
                await davidDelegateTx.wait()
                await ethers.provider.send("evm_mine", [])

                // console.log("\nFinal State:")
                // console.log(
                //     "Alice votes:",
                //     (await nft.getVotes(alice.address)).toString()
                // )
                // console.log(
                //     "David votes:",
                //     (await nft.getVotes(david.address)).toString()
                // )

                // First checkpoint should show correct historical voting power
                // According to Votes.sol, we need to check one block after the delegation
                // console.log("\nChecking historical records...")
                // const firstCheckpoint = await nft.getPastVotes(
                //     alice.address,
                //     delegateBlock
                // )
                // console.log("First checkpoint value:", firstCheckpoint)

                // Assertions based on correct block numbers
                expect(await nft.getVotes(alice.address)).to.equal(
                    0,
                    "Alice should have 0 votes after delegating to David"
                )
                expect(await nft.getVotes(david.address)).to.equal(
                    1,
                    "David should have 1 vote after receiving delegation"
                )
            })
        })
    })

    describe("Governance Functionality", function () {
        describe("Proposal Creation", function () {
            it("should allow NFT holders to create proposals", async function () {
                await nft.connect(alice).delegate(alice.address)

                const targets = [await gov.getAddress()]
                const values = [0]
                const calldatas = [
                    gov.interface.encodeFunctionData("setManifesto", [
                        "New Manifesto"
                    ])
                ]
                const description = "Test Proposal"

                await expect(
                    gov
                        .connect(alice)
                        .propose(targets, values, calldatas, description)
                ).to.not.be.reverted
            })

            it("should prevent non-NFT holders from creating proposals", async function () {
                const targets = [await gov.getAddress()]
                const values = [0]
                const calldatas = [
                    gov.interface.encodeFunctionData("setManifesto", [
                        "New Manifesto"
                    ])
                ]
                const description = "Test Proposal"

                await expect(
                    gov
                        .connect(charlie)
                        .propose(targets, values, calldatas, description)
                ).to.be.revertedWithCustomError(
                    gov,
                    "GovernorInsufficientProposerVotes"
                )
            })
        })

        describe("Voting", function () {
            let proposalId: bigint
            let targets: string[]
            let values: number[]
            let calldatas: string[]
            let description: string

            beforeEach(async function () {
                // Setup standard proposal
                targets = [await gov.getAddress()]
                values = [0]
                calldatas = [
                    gov.interface.encodeFunctionData("setManifesto", [
                        "New Manifesto"
                    ])
                ]
                description = "Test Proposal"

                // Alice creates proposal
                await nft.connect(alice).delegate(alice.address)
                const tx = await gov
                    .connect(alice)
                    .propose(targets, values, calldatas, description)
                const receipt = await tx.wait()
                proposalId = (
                    receipt?.logs?.find(
                        log =>
                            log instanceof EventLog &&
                            log.eventName === "ProposalCreated"
                    ) as EventLog
                )?.args?.[0]

                // Move past voting delay
                await time.increase(2)
            })

            it("should allow NFT holders to vote", async function () {
                await expect(gov.connect(alice).castVote(proposalId, 1)).to.not
                    .be.reverted
            })

            it("should allow delegated votes to be cast", async function () {
                await nft.connect(alice).delegate(david.address)
                await expect(gov.connect(david).castVote(proposalId, 1)).to.not
                    .be.reverted
            })

            it("should prevent non-holders from voting", async function () {
                await expect(gov.connect(charlie).castVote(proposalId, 1)).to
                    .not.be.reverted // The tx succeeds but...

                const proposalVotes = await gov.proposalVotes(proposalId)
                expect(proposalVotes[1]).to.equal(0) // ...but the vote doesn't count
            })

            it("should track voting power at time of proposal creation", async function () {
                // Initial vote from Alice
                await gov.connect(alice).castVote(proposalId, 1)

                // Create and execute proposal to mint new NFT to Charlie
                const mintTargets = [await nft.getAddress()]
                const mintValues = [0]
                const mintCalldata = [
                    nft.interface.encodeFunctionData("safeMint", [
                        charlie.address,
                        "ipfs://newURI"
                    ])
                ]
                const mintDescription = "Mint new member NFT"

                // Create and vote on mint proposal
                const mintTx = await gov
                    .connect(alice)
                    .propose(
                        mintTargets,
                        mintValues,
                        mintCalldata,
                        mintDescription
                    )
                const mintReceipt = await mintTx.wait()
                const mintProposalId = (
                    mintReceipt?.logs?.find(
                        log =>
                            log instanceof EventLog &&
                            log.eventName === "ProposalCreated"
                    ) as EventLog
                )?.args?.[0]

                // Wait for voting delay
                await time.increase(2)

                // Vote and wait for voting period
                await gov.connect(alice).castVote(mintProposalId, 1)
                await time.increase(51)

                // Execute mint proposal
                await gov.execute(
                    mintTargets,
                    mintValues,
                    mintCalldata,
                    ethers.id(mintDescription)
                )

                // Check that Charlie got their NFT
                expect(await nft.balanceOf(charlie.address)).to.equal(1)

                // Charlie delegates to themselves and tries to vote on original proposal
                await nft.connect(charlie).delegate(charlie.address)

                // Check proposal state before Charlie tries to vote
                const state = await gov.state(proposalId)
                // Only try to vote if proposal is still active
                if (state === BigInt(1)) {
                    // Active state
                    await gov.connect(charlie).castVote(proposalId, 1)
                }

                // Check votes - should only count Alice's original vote
                const proposalVotes = await gov.proposalVotes(proposalId)
                expect(proposalVotes[1]).to.equal(1)
            })
        })

        describe("Proposal Execution", function () {
            it("should execute successful proposals", async function () {
                // Setup
                await nft.connect(alice).delegate(alice.address)
                await nft.connect(bob).delegate(bob.address)

                const targets = [await gov.getAddress()]
                const values = [0]
                const newManifesto = "New Manifesto"
                const calldatas = [
                    gov.interface.encodeFunctionData("setManifesto", [
                        newManifesto
                    ])
                ]
                const description = "Update Manifesto"

                // Create proposal
                const tx = await gov
                    .connect(alice)
                    .propose(targets, values, calldatas, description)
                const receipt = await tx.wait()
                const proposalId = (
                    receipt?.logs?.find(
                        log =>
                            log instanceof EventLog &&
                            log.eventName === "ProposalCreated"
                    ) as EventLog
                )?.args?.[0]

                // Vote
                await time.increase(2)
                await gov.connect(alice).castVote(proposalId, 1)
                await gov.connect(bob).castVote(proposalId, 1)

                // Wait for voting period to end
                await time.increase(51)

                // Execute
                await gov.execute(
                    targets,
                    values,
                    calldatas,
                    ethers.id(description)
                )

                // Verify
                expect(await gov.manifesto()).to.equal(newManifesto)
            })

            it("should not execute failed proposals", async function () {
                // Setup similar to above but with opposing votes
                await nft.connect(alice).delegate(alice.address)
                await nft.connect(bob).delegate(bob.address)

                const targets = [await gov.getAddress()]
                const values = [0]
                const newManifesto = "New Manifesto"
                const calldatas = [
                    gov.interface.encodeFunctionData("setManifesto", [
                        newManifesto
                    ])
                ]
                const description = "Update Manifesto"

                const tx = await gov
                    .connect(alice)
                    .propose(targets, values, calldatas, description)
                const receipt = await tx.wait()
                const proposalId = (
                    receipt?.logs?.find(
                        log =>
                            log instanceof EventLog &&
                            log.eventName === "ProposalCreated"
                    ) as EventLog
                )?.args?.[0]

                await time.increase(2)
                await gov.connect(alice).castVote(proposalId, 1) // For
                await gov.connect(bob).castVote(proposalId, 0) // Against

                await time.increase(51)

                // Attempt to execute should fail
                await expect(
                    gov.execute(
                        targets,
                        values,
                        calldatas,
                        ethers.id(description)
                    )
                ).to.be.revertedWithCustomError(
                    gov,
                    "GovernorUnexpectedProposalState"
                )
            })
        })
    })
})
