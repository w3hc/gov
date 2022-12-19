import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

describe("Signed Sealed Delivered", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob, francis] = await ethers.getSigners();

    const uri = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe";
    const Sugar = await ethers.getContractFactory("Sugar");
    const sugar = await Sugar.deploy(alice.address, bob.address, uri);

    const Manifesto = await ethers.getContractFactory("Manifesto");
    const manifesto = await Manifesto.deploy("bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v1");

    const SSD = await ethers.getContractFactory("SSD");
    const ssd = await SSD.deploy(sugar.address);

    await sugar.transferOwnership(ssd.address);
    await manifesto.transferOwnership(ssd.address)

    return { ssd, sugar, manifesto, deployer, alice, bob, francis };
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

      await ssd.execute(
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

    it("Should transfer ETH to beneficiary", async function () {

      const { sugar, ssd, alice, francis, bob } = await loadFixture(deployContracts);

      await sugar.connect(alice).delegate(alice.address)

      await francis.sendTransaction({
        to: ssd.address,
        value: ethers.utils.parseEther('0.0001')
      });

      const addMemberCall = "0x"
      const calldatas = [addMemberCall.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: 'Transfer 0.0001 ETH to Bob.' } }"

      const targets = [alice.address]
      const values = ["100000000000000"]

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

      const bal = await ethers.provider.getBalance(alice.address)

      await ssd.execute(
        targets, 
        values, 
        calldatas,
        desc
      )

      expect (ethers.utils.formatEther(await ethers.provider.getBalance(alice.address))).to.equal("9999.999710964329166642")

    });

    it("Should update the manifesto", async function () {

      const { sugar, ssd, manifesto, alice, francis, bob } = await loadFixture(deployContracts);

      await sugar.connect(alice).delegate(alice.address)

      const call = await manifesto.interface.encodeFunctionData('update', ["bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v2"])
      const calldatas = [call.toString()]

      const PROPOSAL_DESCRIPTION = "{ result: { kind: 'valid', asString: 'Update our manifesto.' } }"

      const targets = [manifesto.address]
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

      await ssd.execute(
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

      const { ssd, sugar, alice } = await loadFixture(deployContracts);

      // https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades
      // https://docs.openzeppelin.com/upgrades-plugins/1.x/

      // TODO: (1) deploy new implementation, (2) transfer NFT contract ownership, (3) propose, vote and execute upgrade

    });
  });
});
