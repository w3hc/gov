import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

describe("DAO Contracts", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob, francis] = await ethers.getSigners();

    const uri = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe";
    const firstMembers = [
      alice.address, 
      bob.address
    ];
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(firstMembers, uri);

    // const Manifesto = await ethers.getContractFactory("Manifesto");
    // const manifesto = await Manifesto.deploy("bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v1");

    const Gov = await ethers.getContractFactory("Gov");
    const gov = await Gov.deploy(nft.address)

    await nft.transferOwnership(gov.address);
    await nft.connect(alice).delegate(alice.address)
    await nft.connect(bob).delegate(alice.address)

    const call = await gov.interface.encodeFunctionData('setManifesto', ["bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya"])
    const calldatas = [call.toString()]
    const PROPOSAL_DESCRIPTION = "v1"
    const targets = [gov.address]
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
    await moveBlocks(300)
    const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
    await gov.execute(
      targets, 
      values, 
      calldatas,
      desc
    )

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20Mock = await ERC20Mock.deploy(ethers.utils.parseEther('10000'));
    await erc20Mock.transfer(gov.address, ethers.utils.parseEther('1'))

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    const erc721Mock = await ERC721Mock.deploy();
    await erc721Mock.approve(gov.address, 1)
    await erc721Mock.transferFrom(deployer.address, gov.address, 1)

    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock");
    const erc1155Mock = await ERC1155Mock.deploy();
    await erc1155Mock.safeTransferFrom(deployer.address, gov.address, 1, 1, "0x")

    return { gov, nft, deployer, alice, bob, francis, erc20Mock, erc721Mock, erc1155Mock };
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

    it("Should transfer the NFT contract ownership", async function () {
      const { gov, nft } = await loadFixture(deployContracts);
      expect(await nft.owner()).to.equal(gov.address);
    });

    it("Should set the right manifesto cid", async function () {
      const { gov } = await loadFixture(deployContracts);
      expect(await gov.manifesto()).to.equal("bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya");
    });

  });

  describe("Interactions", function () {

    it("Should delegate to self", async function () {
      const { nft, alice } = await loadFixture(deployContracts);
      expect(await nft.delegates(alice.address)).to.equal(alice.address);
    }); 

    it('Should submit a proposal', async function () {
      const { nft, gov, alice, francis } = await loadFixture(deployContracts);

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
    });

    it('Should execute the proposal', async function () {
      const { nft, gov, alice, francis, bob } = await loadFixture(deployContracts);

      const addMemberCall = await nft.interface.encodeFunctionData('safeMint', [francis.address, "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"])
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await nft.ownerOf(2)).to.equal(francis.address);
    });

    it('Should set the nft metadata', async function () {
      const { nft, gov, alice, bob } = await loadFixture(deployContracts);

      const newMetadata = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"
      const setMetadata = await nft.interface.encodeFunctionData('setMetadata', [1, newMetadata])
      const calldatas = [setMetadata.toString()]

      const PROPOSAL_DESCRIPTION = ""
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await nft.tokenURI(1)).to.equal(newMetadata);
    });

    it('Should burn the NFT', async function () {
      const { nft, gov, alice } = await loadFixture(deployContracts);

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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      await expect(nft.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID")
    });

    it("Should update the manifesto", async function () {

      const { gov, alice, bob } = await loadFixture(deployContracts);

      const call = await gov.interface.encodeFunctionData('setManifesto', ["bafybeicxjvcgxcwrhgnu7rv3g4qqzozpwhasviz2p3ivk2734d4urqdesm"])
      const calldatas = [call.toString()]
      const PROPOSAL_DESCRIPTION = "v2"
      const targets = [gov.address]
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await gov.manifesto()).to.be.equal("bafybeicxjvcgxcwrhgnu7rv3g4qqzozpwhasviz2p3ivk2734d4urqdesm")
    });

    it("Should transfer ETH to beneficiary", async function () {
      const { gov, alice, francis, bob } = await loadFixture(deployContracts);

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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      expect(await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )).to.emit(proposalId, 'ProposalExecuted');
    });

    it("Should upgrade Gov", async function () {
      const { nft, gov, alice, bob } = await loadFixture(deployContracts);

      const Gov = await ethers.getContractFactory("Gov");
      const gov2 = await Gov.deploy(await gov.token())

      const call = await nft.interface.encodeFunctionData('transferOwnership', [gov2.address])
      const calldatas = [call.toString()]

      const PROPOSAL_DESCRIPTION = ""
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await gov2.token()).to.equal(nft.address);
    });

    it("Should upgrade NFT", async function () {
      const { nft, alice, bob, francis } = await loadFixture(deployContracts);

      const uri = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe";
      const totalSupply = Number(await nft.totalSupply())
      let currentMembers = []
      for (let index = 0; index < totalSupply; index++) {
        if (await nft.ownerOf(index) !== "0x0000000000000000000000000000000000000000") {
          currentMembers.push(await nft.ownerOf(index))
        }
      }
      const firstMembers = currentMembers;
      const NFT = await ethers.getContractFactory("NFT");
      const nft2 = await NFT.deploy(firstMembers, uri);
      await nft2.deployed()

      const Gov = await ethers.getContractFactory("Gov");
      const gov2 = await Gov.deploy(nft2.address)
      await gov2.deployed()

      await nft2.transferOwnership(gov2.address);
      await nft2.connect(alice).delegate(alice.address)

      const call = nft2.interface.encodeFunctionData('safeMint', [francis.address, "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"])
      const calldatas = [call.toString()]
      const PROPOSAL_DESCRIPTION = ""
      const targets = [nft2.address]
      const values = ["0"]
      const propose = await gov2.connect(alice).propose(
        targets, 
        values, 
        calldatas, 
        PROPOSAL_DESCRIPTION
      )
      const proposeReceipt = await propose.wait(1)
      const proposalId = proposeReceipt.events![0].args!.proposalId.toString()
      await moveBlocks(2)
      await gov2.connect(alice).castVote(proposalId,1)
      await gov2.connect(bob).castVote(proposalId,1)
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov2.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await nft2.ownerOf(2)).to.equal(francis.address);
      expect(await gov2.token()).to.equal(nft2.address);
    });

    it("Should transfer ERC-20 to beneficiary", async function () {
      const { gov, alice, francis, bob, erc20Mock } = await loadFixture(deployContracts);

      const erc20MockTransfer = await erc20Mock.interface.encodeFunctionData('transfer', [francis.address, ethers.utils.parseEther('1')])
      const calldatas = [erc20MockTransfer.toString()]

      const PROPOSAL_DESCRIPTION = ""
      const targets = [erc20Mock.address]
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await erc20Mock.balanceOf(francis.address)).to.equal(ethers.utils.parseEther('1'));
    });

    it("Should transfer ERC-721 to beneficiary", async function () {
      const { gov, alice, francis, bob, erc721Mock } = await loadFixture(deployContracts);

      const erc721Transfer = await erc721Mock.interface.encodeFunctionData('transferFrom', [gov.address, francis.address, 1])
      const calldatas = [erc721Transfer.toString()]

      const PROPOSAL_DESCRIPTION = ""
      const targets = [erc721Mock.address]
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await erc721Mock.ownerOf(1)).to.equal(francis.address);
    });

    it("Should transfer ERC-1155 to beneficiary", async function () {
      const { gov, alice, francis, bob, erc1155Mock } = await loadFixture(deployContracts);

      const erc1155MockTransfer = await erc1155Mock.interface.encodeFunctionData('safeTransferFrom', [gov.address, francis.address, 1, 1, "0x"])
      const calldatas = [erc1155MockTransfer.toString()]

      const PROPOSAL_DESCRIPTION = ""
      const targets = [erc1155Mock.address]
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
      await moveBlocks(300)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await erc1155Mock.balanceOf(francis.address, 1)).to.equal(1);
    });
  });
});
