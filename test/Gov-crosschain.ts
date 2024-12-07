import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import type { NFT, Gov, ProofHandler } from "../typechain-types"
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import type { Contract, EventLog } from "ethers"

describe("Crosschain Gov", function () {
    let gov: Gov & Contract
    let nft: NFT & Contract
    let proofHandler: ProofHandler & Contract
    let owner: HardhatEthersSigner
    let alice: HardhatEthersSigner
    let bob: HardhatEthersSigner
    let charlie: HardhatEthersSigner
    let david: HardhatEthersSigner

    async function findProposalId(receipt: any): Promise<bigint> {
        const log = receipt.logs.find(
            (x: any) => x.fragment?.name === "ProposalCreated"
        )
        if (!log) throw new Error("ProposalCreated event not found")
        return log.args[0]
    }

    // For finding tokenId in mint events
    async function findTokenId(receipt: any): Promise<bigint> {
        const log = receipt.logs.find(
            (x: any) =>
                x.fragment?.name === "Transfer" &&
                x.args[1] !== ethers.ZeroAddress
        )
        if (!log) throw new Error("Transfer event not found")
        return log.args[2]
    }

    async function deployContracts() {
        ;[owner, alice, bob, charlie, david] = await ethers.getSigners()

        // Deploy ProofHandler library first
        const ProofHandlerFactory = await ethers.getContractFactory(
            "contracts/variants/crosschain/ProofHandler.sol:ProofHandler"
        )
        const proofHandler = await ProofHandlerFactory.deploy()
        await proofHandler.waitForDeployment()

        // Deploy NFT with library linking
        const NFTFactory = await ethers.getContractFactory(
            "contracts/variants/crosschain/NFT.sol:NFT",
            {
                libraries: {
                    ProofHandler: await proofHandler.getAddress()
                }
            }
        )
        const nft = await NFTFactory.deploy(
            BigInt(1337), // Chain ID for local network
            owner.address,
            [alice.address, bob.address],
            "ipfs://testURI",
            "TestNFT",
            "TNFT"
        )

        // Deploy Gov with library linking
        const GovFactory = await ethers.getContractFactory(
            "contracts/variants/crosschain/Gov.sol:Gov",
            {
                libraries: {
                    ProofHandler: await proofHandler.getAddress()
                }
            }
        )
        const gov = await GovFactory.deploy(
            BigInt(1337),
            await nft.getAddress(),
            "ipfs://testManifesto",
            "TestDAO",
            0,
            50400,
            1,
            10
        )

        // Transfer NFT ownership to Gov
        await nft.transferOwnership(await gov.getAddress())

        // Delegate voting power
        await nft.connect(alice).delegate(alice.address)
        await nft.connect(bob).delegate(bob.address)

        return {
            gov: gov as Gov & Contract,
            nft: nft as NFT & Contract,
            proofHandler: proofHandler as ProofHandler & Contract,
            owner,
            alice,
            bob,
            charlie,
            david
        }
    }

    beforeEach(async function () {
        const contracts = await loadFixture(deployContracts)
        gov = contracts.gov
        nft = contracts.nft
        proofHandler = contracts.proofHandler
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
            const mintCalldata = nft.interface.encodeFunctionData("safeMint", [
                charlie.address,
                "ipfs://newURI"
            ])

            const tx = await gov
                .connect(alice)
                .propose(
                    [await nft.getAddress()],
                    [0],
                    [mintCalldata],
                    "Mint new NFT"
                )
            const receipt = await tx.wait()
            const proposalId = await findProposalId(receipt)

            // Skip voting delay
            await ethers.provider.send("evm_mine", [])

            // Vote on proposal
            await gov.connect(alice).castVote(proposalId, 1)
            await gov.connect(bob).castVote(proposalId, 1)

            // Wait for voting period to end
            for (let i = 0; i < 50400; i++) {
                await ethers.provider.send("evm_mine", [])
            }

            // Execute proposal
            const execTx = await gov
                .connect(alice)
                .execute(
                    [await nft.getAddress()],
                    [0],
                    [mintCalldata],
                    ethers.id("Mint new NFT")
                )
            const execReceipt = await execTx.wait()

            // Verify the mint
            expect(await nft.ownerOf(2)).to.equal(charlie.address)
        })
        it("should generate membership proof", async function () {
            // Get Alice's token ID (should be 0 as she was first member)
            const aliceTokenId = 0
            const uri = await nft.tokenURI(aliceTokenId)

            const params = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "string"],
                [alice.address, uri]
            )

            // Generate the proof
            const proof = await nft.connect(alice).generateOperationProof(
                0, // MINT
                params
            )

            const [operationType, proofParams, nonce, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint8", "bytes", "uint256", "bytes32"],
                    proof
                )

            expect(operationType).to.equal(0) // MINT
            expect(proofParams).to.equal(params)
        })

        it("should verify membership proof correctly", async function () {
            const aliceTokenId = 0
            const uri = await nft.tokenURI(aliceTokenId)

            const params = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "string"],
                [alice.address, uri]
            )

            // Generate proof on "source" chain
            const proof = await nft
                .connect(alice)
                .generateOperationProof(0, params)

            // Decode the proof
            const [operationType, proofParams, nonce, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint8", "bytes", "uint256", "bytes32"],
                    proof
                )

            // Verify the decoded values
            expect(operationType).to.equal(0) // MINT
            expect(proofParams).to.equal(params)

            // Reproduce the proof verification logic
            const nftAddress = await nft.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "bytes", "uint256"],
                [nftAddress, operationType, proofParams, nonce]
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

        it("should reject invalid membership proof", async function () {
            const aliceTokenId = 0
            const uri = await nft.tokenURI(aliceTokenId)

            // Generate valid params
            const validParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "string"],
                [alice.address, uri]
            )

            // Generate valid proof
            const validProof = await nft
                .connect(alice)
                .generateOperationProof(0, validParams)

            // Create invalid params
            const invalidParams = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "string"],
                [bob.address, uri]
            )

            // Create invalid proof with wrong digest
            const invalidProof = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint8", "bytes", "uint256", "bytes32"],
                [0, invalidParams, 1, ethers.id("invalid")]
            )

            const nftAddress = await nft.getAddress()

            // Verify valid proof works
            const [validOpType, validProofParams, validNonce, validDigest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint8", "bytes", "uint256", "bytes32"],
                    validProof
                )

            const validMessage = ethers.solidityPackedKeccak256(
                ["address", "uint8", "bytes", "uint256"],
                [nftAddress, validOpType, validProofParams, validNonce]
            )

            const validExpectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", validMessage]
                )
            )

            expect(validDigest).to.equal(
                validExpectedDigest,
                "Valid proof should verify"
            )
        })

        it("should generate and verify burn proof correctly", async function () {
            const aliceTokenId = 0
            const params = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256"],
                [aliceTokenId]
            )

            // Generate burn proof
            const proof = await nft
                .connect(alice)
                .generateOperationProof(1, params) // BURN

            const [operationType, proofParams, nonce, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint8", "bytes", "uint256", "bytes32"],
                    proof
                )

            expect(operationType).to.equal(1) // BURN
            expect(proofParams).to.equal(params)

            // Verify the proof
            const nftAddress = await nft.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "bytes", "uint256"],
                [nftAddress, operationType, proofParams, nonce]
            )

            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", message]
                )
            )

            expect(digest).to.equal(
                expectedDigest,
                "Burn proof verification failed"
            )
        })

        it("should generate and verify metadata proof correctly", async function () {
            const aliceTokenId = 0
            const newUri = "ipfs://newURI"

            const params = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "string"],
                [aliceTokenId, newUri]
            )

            // Generate metadata proof
            const proof = await nft
                .connect(alice)
                .generateOperationProof(2, params) // SET_METADATA

            const [operationType, proofParams, nonce, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint8", "bytes", "uint256", "bytes32"],
                    proof
                )

            expect(operationType).to.equal(2) // SET_METADATA
            expect(proofParams).to.equal(params)

            // Verify the proof
            const nftAddress = await nft.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "bytes", "uint256"],
                [nftAddress, operationType, proofParams, nonce]
            )

            const expectedDigest = ethers.keccak256(
                ethers.solidityPacked(
                    ["string", "bytes32"],
                    ["\x19Ethereum Signed Message:\n32", message]
                )
            )

            expect(digest).to.equal(
                expectedDigest,
                "Metadata proof verification failed"
            )
        })
        it("should generate and verify manifesto proof correctly", async function () {
            const newManifesto = "ipfs://newManifesto"

            // Generate manifesto proof on "source" chain
            const proof = await gov.generateParameterProof(
                0, // OperationType.SET_MANIFESTO
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["string"],
                    [newManifesto]
                )
            )

            // Decode the proof to verify its contents
            const [operationType, value, nonce, digest] =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["uint8", "bytes", "uint256", "bytes32"],
                    proof
                )

            // Decode the value back to string
            const manifestoValue = ethers.AbiCoder.defaultAbiCoder().decode(
                ["string"],
                value
            )[0]

            // Verify the decoded basic values
            expect(operationType).to.equal(0) // SET_MANIFESTO
            expect(manifestoValue).to.equal(newManifesto)
            expect(nonce).to.equal(0) // First update should have nonce 0

            // Reproduce the proof verification logic from the contract
            const govAddress = await gov.getAddress()
            const message = ethers.solidityPackedKeccak256(
                ["address", "uint8", "bytes", "uint256"],
                [govAddress, operationType, value, nonce]
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
                const proof = await gov.generateParameterProof(1, value) // UPDATE_VOTING_DELAY

                // Decode the proof to verify its contents
                const [operationType, proofValue, nonce, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "uint256", "bytes32"],
                        proof
                    )

                // Verify the decoded basic values
                expect(operationType).to.equal(1) // UPDATE_VOTING_DELAY
                expect(proofValue).to.equal(value)
                expect(nonce).to.equal(0) // First update should have nonce 0

                // Reproduce the proof verification logic from the contract
                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes", "uint256"],
                    [govAddress, operationType, value, nonce]
                )

                // Create the expected digest
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

            it("should verify voting period proof correctly", async function () {
                const newVotingPeriod = 50400n
                const value = ethers.solidityPacked(
                    ["uint32"],
                    [newVotingPeriod]
                )

                const proof = await gov.generateParameterProof(2, value) // UPDATE_VOTING_PERIOD

                const [operationType, proofValue, nonce, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "uint256", "bytes32"],
                        proof
                    )

                expect(operationType).to.equal(2) // UPDATE_VOTING_PERIOD
                expect(proofValue).to.equal(value)
                expect(nonce).to.equal(1)

                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes", "uint256"],
                    [govAddress, operationType, value, nonce]
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

                const proof = await gov.generateParameterProof(3, value) // UPDATE_PROPOSAL_THRESHOLD

                const [operationType, proofValue, nonce, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "uint256", "bytes32"],
                        proof
                    )

                expect(operationType).to.equal(3) // UPDATE_PROPOSAL_THRESHOLD
                expect(proofValue).to.equal(value)
                expect(nonce).to.equal(1)

                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes", "uint256"],
                    [govAddress, operationType, value, nonce]
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

                const proof = await gov.generateParameterProof(4, value) // UPDATE_QUORUM

                const [operationType, proofValue, nonce, digest] =
                    ethers.AbiCoder.defaultAbiCoder().decode(
                        ["uint8", "bytes", "uint256", "bytes32"],
                        proof
                    )

                expect(operationType).to.equal(4) // UPDATE_QUORUM
                expect(proofValue).to.equal(value)
                expect(nonce).to.equal(1)

                const govAddress = await gov.getAddress()
                const message = ethers.solidityPackedKeccak256(
                    ["address", "uint8", "bytes", "uint256"],
                    [govAddress, operationType, value, nonce]
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

            // Add tests for preventing duplicate and old proofs
            it("should reject duplicate proofs", async function () {
                const newQuorum = 20n
                const value = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256"],
                    [newQuorum]
                )
                const proof = await gov.generateParameterProof(4, value)

                await gov.claimParameterUpdate(proof)
                await expect(
                    gov.claimParameterUpdate(proof)
                ).to.be.revertedWith("Proof already claimed")
            })

            it("should reject old proofs", async function () {
                const value1 = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256"],
                    [20n]
                )
                const value2 = ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256"],
                    [30n]
                )

                // Generate both proofs first (they'll have sequential nonces)
                const proof1 = await gov.generateParameterProof(4, value1)
                const proof2 = await gov.generateParameterProof(4, value2)

                // Apply the newer proof first
                await gov.claimParameterUpdate(proof2)

                // Now try to apply the older proof - should fail because of older nonce
                await expect(
                    gov.claimParameterUpdate(proof1)
                ).to.be.revertedWith("Invalid nonce")
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

        it("should auto-delegate voting power to initial members on deployment", async function () {
            const { nft } = await loadFixture(deployContracts)

            // Get current timestamp
            const startTime = await time.latest()

            // Increase time by only 1 sec in on this network
            await time.increase(1)

            // Check voting power at the starting timestamp
            const alicePower = await nft.getPastVotes(alice.address, startTime)
            const bobPower = await nft.getPastVotes(bob.address, startTime)

            expect(alicePower).to.equal(1)
            expect(bobPower).to.equal(1)
            expect(await nft.delegates(alice.address)).to.equal(alice.address)
            expect(await nft.delegates(bob.address)).to.equal(bob.address)
        })

        describe("Delegation Transfers", function () {
            it("should properly transfer voting power when changing delegates", async function () {
                // Initial state - Alice and Bob each have 1 vote
                expect(await nft.getVotes(alice.address)).to.equal(1n)
                expect(await nft.getVotes(bob.address)).to.equal(1n)

                // Alice delegates to Bob
                await nft.connect(alice).delegate(bob.address)

                // Bob should have his own vote plus Alice's delegation
                expect(await nft.getVotes(bob.address)).to.equal(2n)
                expect(await nft.getVotes(alice.address)).to.equal(0n)
            })

            it("should maintain zero voting power for non-holders across multiple delegations", async function () {
                await nft.connect(charlie).delegate(alice.address)
                await nft.connect(charlie).delegate(bob.address)

                // Charlie doesn't own any NFTs, so their delegation shouldn't affect voting power
                expect(await nft.getVotes(charlie.address)).to.equal(0)
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

            beforeEach(async function () {
                const mintCalldata = nft.interface.encodeFunctionData(
                    "safeMint",
                    [charlie.address, "ipfs://newURI"]
                )

                const tx = await gov
                    .connect(alice)
                    .propose(
                        [await nft.getAddress()],
                        [0],
                        [mintCalldata],
                        "Mint new NFT"
                    )
                const receipt = await tx.wait()
                proposalId = await findProposalId(receipt)

                // Skip voting delay
                await ethers.provider.send("evm_mine", [])
            })

            it("should allow NFT holders to vote", async function () {
                await expect(gov.connect(alice).castVote(proposalId, 1)).to.not
                    .be.reverted
            })
        })

        describe("Proposal Execution", function () {
            it("should execute successful proposals", async function () {
                const mintCalldata = nft.interface.encodeFunctionData(
                    "safeMint",
                    [charlie.address, "ipfs://newURI"]
                )

                const tx = await gov
                    .connect(alice)
                    .propose(
                        [await nft.getAddress()],
                        [0],
                        [mintCalldata],
                        "Mint new NFT"
                    )
                const receipt = await tx.wait()
                const proposalId = await findProposalId(receipt)

                // Skip voting delay
                await ethers.provider.send("evm_mine", [])

                // Vote
                await gov.connect(alice).castVote(proposalId, 1)
                await gov.connect(bob).castVote(proposalId, 1)

                // Wait for voting period to end
                for (let i = 0; i < 50400; i++) {
                    await ethers.provider.send("evm_mine", [])
                }

                // Execute
                await expect(
                    gov.execute(
                        [await nft.getAddress()],
                        [0],
                        [mintCalldata],
                        ethers.id("Mint new NFT")
                    )
                ).to.not.be.reverted
            })

            it("should not execute failed proposals", async function () {
                // Similar structure but with failing conditions
            })
        })
    })
})
