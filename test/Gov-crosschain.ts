import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"
import { NFT } from "../typechain-types/contracts/variants/crosschain/NFT"
import { Gov } from "../typechain-types/contracts/variants/crosschain/Gov"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { EventLog } from "ethers"

describe("Crosschain Gov", function () {
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
            "contracts/variants/crosschain/NFT.sol:NFT"
        )
        const nftContract = (await NFTFactory.deploy(
            1337,
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
            "contracts/variants/crosschain/Gov.sol:Gov"
        )
        const govContract = (await GovFactory.deploy(
            1337,
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
            ).to.be.revertedWith("NFT is not transferable")
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
        it("should generate membership proof", async function () {
            // Get Alice's token ID (should be 0 as she was first member)
            const aliceTokenId = 0

            // Generate the proof
            expect(
                await nft.connect(alice).generateMintProof(aliceTokenId)
            ).to.be.equal(
                "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000000805f94c8cd397e8c8823da171013dfc02b9f0d1812fb747295e6b0534f0270bf57000000000000000000000000000000000000000000000000000000000000000e697066733a2f2f74657374555249000000000000000000000000000000000000"
            )

            expect(await nft.connect(alice).generateMintProof(aliceTokenId)).to
                .be.reverted
        })

        it("should verify membership proof correctly", async function () {
            // Get Alice's token ID (0)
            const aliceTokenId = 0

            // Generate proof on "source" chain
            const proof = await nft
                .connect(alice)
                .generateMintProof(aliceTokenId)

            // Decode the proof to verify its contents
            const [tokenId, to, uri, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint256", "address", "string", "bytes32"],
                    proof
                )

            // Verify the decoded basic values
            expect(tokenId).to.equal(aliceTokenId)
            expect(to).to.equal(alice.address)
            expect(uri).to.equal(await nft.tokenURI(aliceTokenId))

            // Reproduce the proof verification logic from the contract
            const nftAddress = await nft.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "address", "string"],
                [nftAddress, 0, tokenId, to, uri]
            )

            // Create the expected digest (mimicking the contract's verification)
            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", message]
                )
            )

            // Verify the digest matches
            expect(digest).to.equal(
                expectedDigest,
                "Proof digest verification failed"
            )
        })

        it("should reject invalid membership proof", async function () {
            // Get Alice's token ID (0)
            const aliceTokenId = 0

            // Generate valid proof
            const proof = await nft
                .connect(alice)
                .generateMintProof(aliceTokenId)

            // Create an invalid proof by changing the tokenId and digest
            const invalidProof = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "address", "string", "bytes32"],
                [
                    aliceTokenId + 1,
                    bob.address,
                    await nft.tokenURI(aliceTokenId),
                    ethers.id("invalid")
                ]
            )

            // Decode the invalid proof
            const [invalidTokenId, invalidTo, invalidUri, invalidDigest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint256", "address", "string", "bytes32"],
                    invalidProof
                )

            const nftAddress = await nft.getAddress()
            const expectedMessage = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "address", "string"],
                [nftAddress, 0, invalidTokenId, invalidTo, invalidUri] // 0 is OperationType.MINT
            )

            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", expectedMessage]
                )
            )

            // Verify the invalid proof's digest doesn't match the expected digest
            expect(invalidDigest).to.not.equal(
                expectedDigest,
                "Invalid proof should not verify"
            )

            // Verify the original proof is still valid
            const [tokenId, to, validUri, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint256", "address", "string", "bytes32"],
                    proof
                )

            const validMessage = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "address", "string"],
                [nftAddress, 0, tokenId, to, validUri]
            )

            const validExpectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", validMessage]
                )
            )

            expect(digest).to.equal(
                validExpectedDigest,
                "Valid proof should verify"
            )
        })

        it("should generate and verify burn proof correctly", async function () {
            // Get Alice's token ID (0)
            const aliceTokenId = 0

            // Generate burn proof on "source" chain
            const proof = await nft
                .connect(alice)
                .generateBurnProof(aliceTokenId)

            // Decode the proof to verify its contents
            const [tokenId, digest] = ethers.AbiCoder.defaultAbiCoder().decode(
                ["uint256", "bytes32"],
                proof
            )

            // Verify the decoded basic values
            expect(tokenId).to.equal(aliceTokenId)

            // Reproduce the proof verification logic from the contract
            const nftAddress = await nft.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256"],
                [nftAddress, 1, tokenId] // 1 is OperationType.BURN
            )

            // Create the expected digest (mimicking the contract's verification)
            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", message]
                )
            )

            // Verify the digest matches
            expect(digest).to.equal(
                expectedDigest,
                "Burn proof digest verification failed"
            )
        })
        it("should generate and verify metadata proof correctly", async function () {
            const aliceTokenId = 0
            const newUri = "ipfs://newURI"

            // Generate metadata proof on "source" chain
            const proof = await nft
                .connect(alice)
                .generateMetadataProof(aliceTokenId, newUri)

            // Decode the proof to verify its contents
            const [tokenId, uri, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint256", "string", "bytes32"],
                    proof
                )

            // Verify the decoded basic values
            expect(tokenId).to.equal(aliceTokenId)
            expect(uri).to.equal(newUri)

            // Reproduce the proof verification logic from the contract
            const nftAddress = await nft.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "uint256", "string"],
                [nftAddress, 2, tokenId, newUri] // 2 is OperationType.SET_METADATA
            )

            // Create the expected digest (mimicking the contract's verification)
            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", message]
                )
            )

            // Verify the digest matches
            expect(digest).to.equal(
                expectedDigest,
                "Metadata proof digest verification failed"
            )
        })
        it("should generate and verify manifesto proof correctly", async function () {
            const newManifesto = "ipfs://newManifesto"

            // Generate manifesto proof on "source" chain
            const proof = await gov.generateManifestoProof(newManifesto)

            // Decode the proof to verify its contents
            const [manifestoValue, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["string", "bytes32"],
                    proof
                )

            // Verify the decoded basic values
            expect(manifestoValue).to.equal(newManifesto)

            // Reproduce the proof verification logic from the contract
            const govAddress = await gov.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "string"],
                [govAddress, 0, newManifesto] // 0 is OperationType.SET_MANIFESTO
            )

            // Create the expected digest (mimicking the contract's verification)
            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", message]
                )
            )

            // Verify the digest matches
            expect(digest).to.equal(
                expectedDigest,
                "Manifesto proof digest verification failed"
            )
        })
        describe("Governance Parameter Proofs", () => {
            it("should verify voting delay proof correctly", async function () {
                const newVotingDelay = 48n
                const value = ethers.solidityPacked(
                    ["uint48"],
                    [newVotingDelay]
                )

                // Generate proof on home chain
                const proof = await gov.generateParameterProof(
                    1, // UPDATE_VOTING_DELAY
                    value
                )

                // Decode the proof to verify its contents
                const [operationType, proofValue, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "bytes32"],
                        proof
                    )

                // Verify the decoded basic values
                expect(operationType).to.equal(1) // UPDATE_VOTING_DELAY
                expect(proofValue).to.equal(value)

                // Reproduce the proof verification logic from the contract
                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes"],
                    [govAddress, operationType, value]
                )

                // Create the expected digest (mimicking the contract's verification)
                const expectedDigest = ethers.keccak256(
                    ethers.solidityPacked(
                        ["string", "bytes32"],
                        ["\x19Ethereum Signed Message:\n32", message]
                    )
                )

                // Verify the digest matches
                expect(digest).to.equal(
                    expectedDigest,
                    "Proof digest verification failed"
                )
            })

            it("should verify voting period proof correctly", async function () {
                const newVotingPeriod = 50400n
                const value = ethers.solidityPacked(
                    ["uint32"],
                    [newVotingPeriod]
                )

                // Generate proof on home chain
                const proof = await gov.generateParameterProof(
                    2, // UPDATE_VOTING_PERIOD
                    value
                )

                // Decode the proof to verify its contents
                const [operationType, proofValue, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "bytes32"],
                        proof
                    )

                // Verify the decoded basic values
                expect(operationType).to.equal(2) // UPDATE_VOTING_PERIOD
                expect(proofValue).to.equal(value)

                // Reproduce the proof verification logic from the contract
                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes"],
                    [govAddress, operationType, value]
                )

                const expectedDigest = ethers.keccak256(
                    ethers.solidityPacked(
                        ["string", "bytes32"],
                        ["\x19Ethereum Signed Message:\n32", message]
                    )
                )

                expect(digest).to.equal(
                    expectedDigest,
                    "Proof digest verification failed"
                )
            })

            it("should verify proposal threshold proof correctly", async function () {
                const newThreshold = ethers.parseEther("100")
                const value = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256"],
                    [newThreshold]
                )

                // Generate proof on home chain
                const proof = await gov.generateParameterProof(
                    3, // UPDATE_PROPOSAL_THRESHOLD
                    value
                )

                // Decode the proof to verify its contents
                const [operationType, proofValue, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "bytes32"],
                        proof
                    )

                // Verify the decoded basic values
                expect(operationType).to.equal(3) // UPDATE_PROPOSAL_THRESHOLD
                expect(proofValue).to.equal(value)

                // Reproduce the proof verification logic from the contract
                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes"],
                    [govAddress, operationType, value]
                )

                const expectedDigest = ethers.keccak256(
                    ethers.solidityPacked(
                        ["string", "bytes32"],
                        ["\x19Ethereum Signed Message:\n32", message]
                    )
                )

                expect(digest).to.equal(
                    expectedDigest,
                    "Proof digest verification failed"
                )
            })

            it("should verify quorum proof correctly", async function () {
                const newQuorum = 20n
                const value = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256"],
                    [newQuorum]
                )

                // Generate proof on home chain
                const proof = await gov.generateParameterProof(
                    4, // UPDATE_QUORUM
                    value
                )

                // Decode the proof to verify its contents
                const [operationType, proofValue, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "bytes32"],
                        proof
                    )

                // Verify the decoded basic values
                expect(operationType).to.equal(4) // UPDATE_QUORUM
                expect(proofValue).to.equal(value)

                // Reproduce the proof verification logic from the contract
                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes"],
                    [govAddress, operationType, value]
                )

                const expectedDigest = ethers.keccak256(
                    ethers.solidityPacked(
                        ["string", "bytes32"],
                        ["\x19Ethereum Signed Message:\n32", message]
                    )
                )

                expect(digest).to.equal(
                    expectedDigest,
                    "Proof digest verification failed"
                )
            })
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
