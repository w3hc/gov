import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
// import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

describe("Signed Sealed Delivered", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob, francis] = await ethers.getSigners();

    const uri = "https://ipfs.io/ipfs/bafybeiberpia3qev7lvnusiiheqqfe57sk5r23gs6fh7v3v6vdcw6wrldq/metadata.json";
    const Sugar = await ethers.getContractFactory("Sugar");
    const sugar = await Sugar.deploy(alice.address, bob.address, uri);

    const SSD = await ethers.getContractFactory("SSD");
    const ssd = await SSD.deploy(sugar.address);

    await sugar.transferOwnership(ssd.address);
    await sugar.connect(bob).setApprovalForAll(ssd.address, true); // https://docs.openzeppelin.com/contracts-cairo/0.5.1/erc721#setapprovalforall

    return { ssd, sugar, deployer, alice, bob, francis };
  }

  describe("Deployment", function () {

    it("Should own the right token IDs", async function () {
      const { sugar, alice, bob } = await loadFixture(deployContracts);
      expect(await sugar.ownerOf(0)).to.equal(alice.address);
      expect(await sugar.ownerOf(1)).to.equal(bob.address);
    });

    it("Should set the right token address", async function () {
      const { ssd, sugar } = await loadFixture(deployContracts);
      expect(await ssd.token()).to.equal(sugar.address);
    }); 

    it("Should not be initializable twice", async function () {
      const { ssd } = await loadFixture(deployContracts);
      await expect(ssd.initialize("0x0000000000000000000000000000000000000008")).to.be.revertedWith("Initializable: contract is already initialized");
    }); 

    it("Should transfer the NFT contract ownership", async function () {
      const { ssd, sugar } = await loadFixture(deployContracts);
      expect(await sugar.owner()).to.equal(ssd.address);
    });

  });

  describe("Interactions", function () {

    it("Should delegate to self", async function () {
      const { sugar, alice } = await loadFixture(deployContracts);
      await sugar.connect(alice).delegate(alice.address)
      expect(await sugar.delegates(alice.address)).to.equal(alice.address);
    }); 

    it('Should submit a proposal', async function () {

      const { sugar, ssd, alice, francis } = await loadFixture(deployContracts);
      await sugar.connect(alice).delegate(alice.address)

      const addMemberCall = await sugar.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
      const calldatas = [addMemberCall.toString()]

      const targets = [sugar.address]
      const values = ["0"]
      const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }"))

      const propose = await ssd.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)
      expect(await ssd.state(proposalId)).to.be.equal(1)
      await expect(ssd.connect(francis).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )).to.be.revertedWith("Governor: proposer votes below proposal threshold")

    });

    it('Should cast a vote', async function () {

      const { sugar, ssd, alice, francis } = await loadFixture(deployContracts);
      await sugar.connect(alice).delegate(alice.address)

      const addMemberCall = await sugar.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
      const calldatas = [addMemberCall.toString()]

      const targets = [sugar.address]
      const values = ["0"]
      const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }"))

      const propose = await ssd.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await ssd.connect(alice).castVote(proposalId,1)
      expect(await ssd.hasVoted(proposalId, alice.address)).to.be.equal(true)

      // TODO: Francis can't vote
      
    });

    it('Should execute the proposal', async function () {

      const { sugar, ssd, alice, francis, bob } = await loadFixture(deployContracts);

      await sugar.connect(alice).delegate(alice.address)

      const addMemberCall = await sugar.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
      const calldatas = [addMemberCall.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }"

      const targets = [sugar.address]
      const values = ["0"]

      const propose = await ssd.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await ssd.connect(alice).castVote(proposalId,1)

      await ssd.connect(bob).castVote(proposalId,1)

      await moveBlocks(1000)

      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)

      const execution = await ssd.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

    });

    it('Should burn the NFT', async function () {

      const { sugar, ssd, alice, bob } = await loadFixture(deployContracts);

      await sugar.connect(alice).delegate(alice.address)

      const banMemberCall = await sugar.interface.encodeFunctionData('govBurn', [1])

      const calldatas = [banMemberCall.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: 'Bye bye!' } }"

      const targets = [sugar.address]
      const values = ["0"]

      const propose = await ssd.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await ssd.connect(alice).castVote(proposalId,1)

      await moveBlocks(1000)

      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)

      await ssd.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

      await moveBlocks(10)

      await expect(sugar.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID")

    });

    xit("Should upgrade", async function () {
      const { ssd, sugar } = await loadFixture(deployContracts);
      expect(await ssd.token()).to.equal(sugar.address);

      const newAddr = "0x0000000000000000000000000000000000000008"

      // TODO: upgrade = transfer NFT contract ownership + switch address

      // expect(await ssd.token()).to.equal(newAddr);

    });
  });
});
