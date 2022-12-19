import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

describe("Signed Sealed Delivered", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob, francis] = await ethers.getSigners();

    const uri = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe";
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(alice.address, bob.address, uri);

    const Manifesto = await ethers.getContractFactory("Manifesto");
    const manifesto = await Manifesto.deploy("bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v1");

    const Gov = await ethers.getContractFactory("Gov");
    const gov = await Gov.deploy(nft.address);

    await nft.transferOwnership(gov.address);
    await manifesto.transferOwnership(gov.address)

    return { gov, nft, manifesto, deployer, alice, bob, francis };
  }

  describe("Deployment", function () {

    it("Should own the right token IDs", async function () {
      const { nft, alice, bob } = await loadFixture(deployContracts);
      expect(await nft.ownerOf(0)).to.equal(alice.address);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });

    it("Should set the right token address", async function () {
      const { gov, nft } = await loadFixture(deployContracts);
      expect(await gov.token()).to.equal(nft.address);
    }); 

    it("Should not be initializable twice", async function () {
      const { gov } = await loadFixture(deployContracts);
      await expect(gov.initialize("0x0000000000000000000000000000000000000008")).to.be.revertedWith("Initializable: contract is already initialized");
    }); 

    it("Should transfer the NFT contract ownership", async function () {
      const { gov, nft } = await loadFixture(deployContracts);
      expect(await nft.owner()).to.equal(gov.address);
    });

  });

  describe("Interactions", function () {

    it("Should delegate to self", async function () {
      const { nft, alice } = await loadFixture(deployContracts);
      await nft.connect(alice).delegate(alice.address)
      expect(await nft.delegates(alice.address)).to.equal(alice.address);
    }); 

    it('Should submit a proposal', async function () {

      const { nft, gov, alice, francis } = await loadFixture(deployContracts);
      await nft.connect(alice).delegate(alice.address)

      const addMemberCall = await nft.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
      const calldatas = [addMemberCall.toString()]

      const targets = [nft.address]
      const values = ["0"]
      const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }"))

      const propose = await gov.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)
      expect(await gov.state(proposalId)).to.be.equal(1)
      await expect(gov.connect(francis).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )).to.be.revertedWith("Governor: proposer votes below proposal threshold")

    });

    it('Should cast a vote', async function () {

      const { nft, gov, alice, francis } = await loadFixture(deployContracts);
      await nft.connect(alice).delegate(alice.address)

      const addMemberCall = await nft.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
      const calldatas = [addMemberCall.toString()]

      const targets = [nft.address]
      const values = ["0"]
      const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }"))

      const propose = await gov.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        descriptionHash
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await gov.connect(alice).castVote(proposalId,1)
      expect(await gov.hasVoted(proposalId, alice.address)).to.be.equal(true)

      // TODO: Francis can't vote
      
    });

    it('Should execute the proposal', async function () {

      const { nft, gov, alice, francis, bob } = await loadFixture(deployContracts);

      await nft.connect(alice).delegate(alice.address)

      const addMemberCall = await nft.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
      const calldatas = [addMemberCall.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: '# Simple proposal\n**It\'s simple.**' } }"

      const targets = [nft.address]
      const values = ["0"]

      const propose = await gov.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await gov.connect(alice).castVote(proposalId,1)

      await gov.connect(bob).castVote(proposalId,1)

      await moveBlocks(1000)

      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)

      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

    });

    it('Should burn the NFT', async function () {

      const { nft, gov, alice, bob } = await loadFixture(deployContracts);

      await nft.connect(alice).delegate(alice.address)

      const banMemberCall = await nft.interface.encodeFunctionData('govBurn', [1])

      const calldatas = [banMemberCall.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: 'Bye bye!' } }"

      const targets = [nft.address]
      const values = ["0"]

      const propose = await gov.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await gov.connect(alice).castVote(proposalId,1)

      await moveBlocks(1000)

      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)

      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

      await moveBlocks(10)

      await expect(nft.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID")

    });

    it("Should transfer ETH to beneficiary", async function () {

      const { nft, gov, alice, francis, bob } = await loadFixture(deployContracts);

      await nft.connect(alice).delegate(alice.address)

      await francis.sendTransaction({
        to: gov.address,
        value: ethers.utils.parseEther('0.0001')
      });

      const addMemberCall = "0x"
      const calldatas = [addMemberCall.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: 'Transfer 0.0001 ETH to Bob.' } }"

      const targets = [alice.address]
      const values = ["100000000000000"]

      const propose = await gov.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await gov.connect(alice).castVote(proposalId,1)

      await gov.connect(bob).castVote(proposalId,1)

      await moveBlocks(1000)

      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)

      const bal = await ethers.provider.getBalance(alice.address)

      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

      expect (ethers.utils.formatEther(await ethers.provider.getBalance(alice.address))).to.equal("9999.999710964551449754")

    });

    it("Should update the manifesto", async function () {

      const { nft, gov, manifesto, alice, francis, bob } = await loadFixture(deployContracts);

      await nft.connect(alice).delegate(alice.address)

      const call = await manifesto.interface.encodeFunctionData('update', ["bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v2"])
      const calldatas = [call.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: 'Update our manifesto.' } }"

      const targets = [manifesto.address]
      const values = ["0"]

      const propose = await gov.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )

      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()

      await moveBlocks(2)

      await gov.connect(alice).castVote(proposalId,1)

      await gov.connect(bob).castVote(proposalId,1)

      await moveBlocks(1000)

      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)

      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

    });

    xit("Should transfer ERC-20 to beneficiary", async function () {
    });

    xit("Should transfer ERC-721 to beneficiary", async function () {
    });

    xit("Should transfer ERC-1155 to beneficiary", async function () {
    });

    xit("Should upgrade", async function () {

      const { gov, nft, alice } = await loadFixture(deployContracts);

      // https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades
      // https://docs.openzeppelin.com/upgrades-plugins/1.x/

      // TODO: (1) deploy new implementation, (2) transfer NFT contract ownership, (3) propose, vote and execute upgrade

    });
  });
});
