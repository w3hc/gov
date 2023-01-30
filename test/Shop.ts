import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks";

describe("Shop", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob, francis] = await ethers.getSigners();

    const uri = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe";
    const firstMembers = [
      alice.address, 
      bob.address
    ];
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(firstMembers, uri);

    const Gov = await ethers.getContractFactory("Gov");
    const manifesto = "bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya"
    const name = "Gov"
    const votingDelay = "1"
    const votingPeriod = "300"
    const votingThreshold = "1"
    const quorum = "20"
    const gov = await Gov.deploy(
      nft.address, 
      manifesto, 
      name, 
      votingDelay, 
      votingPeriod, 
      votingThreshold, 
      quorum
    ) 
    
    await deployer.sendTransaction({
      to: gov.address,
      value: ethers.utils.parseEther('1')
    });

    await nft.transferOwnership(gov.address);
    await nft.connect(alice).delegate(alice.address)
    await nft.connect(bob).delegate(alice.address)

    const call = gov.interface.encodeFunctionData('setManifesto', ["bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya"])
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
    await erc20Mock.transfer(alice.address, ethers.utils.parseEther('1'))
    await erc20Mock.transfer(francis.address, ethers.utils.parseEther('100'))

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(erc20Mock.address);
    await vault.transferOwnership(gov.address)

    const HypercertsMock = await ethers.getContractFactory("HypercertsMock");
    const hypercerts = await HypercertsMock.deploy();
    await hypercerts.transferOwnership(gov.address)

    const Shop = await ethers.getContractFactory("Shop");
    const shop = await Shop.deploy(erc20Mock.address, vault.address);
    await shop.transferOwnership(gov.address)

    return { gov, nft, deployer, alice, bob, francis, erc20Mock, vault, hypercerts, shop };
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { gov, hypercerts } = await loadFixture(deployContracts);
      expect(await hypercerts.owner()).to.equal(gov.address);
    });
  });

  describe("Interactions", function () {
   
    it("Should mint 2 fractions of an hypercert", async function () {
      const { gov, vault, alice, bob, erc20Mock, hypercerts } = await loadFixture(deployContracts);

      await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
      await vault.connect(alice).give(ethers.utils.parseEther('1'))
      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))

      const call = vault.interface.encodeFunctionData('govWithdraw', [ethers.utils.parseEther('0.5')])
      const call2 = hypercerts.interface.encodeFunctionData('safeMint', [gov.address])
      const call3 = hypercerts.interface.encodeFunctionData('safeMint', [gov.address])
      const calldatas = [call.toString(), call2.toString(), call3.toString()]

      const PROPOSAL_DESCRIPTION = ""
      const targets = [vault.address, hypercerts.address, hypercerts.address]
      const values = ["0", "0", "0"]
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
      
      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.5'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
      expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0'))

      await vault.connect(alice).withdraw(ethers.utils.parseEther('0.1'))

      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.45'))
      expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.05'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.9'))
      expect(await vault.totalSupply()).to.equal(ethers.utils.parseEther('0.9'))

    });

    it("Should mint 2 fractions: 50% to gov, 50% to vault", async function () {
        const { gov, vault, alice, bob, erc20Mock, hypercerts } = await loadFixture(deployContracts);
  
        await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
        await vault.connect(alice).give(ethers.utils.parseEther('1'))
        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
  
        const call = vault.interface.encodeFunctionData('govWithdraw', [ethers.utils.parseEther('0.5')])
        const call2 = hypercerts.interface.encodeFunctionData('safeMint', [alice.address])
        const call3 = hypercerts.interface.encodeFunctionData('safeMint', [alice.address])
        const calldatas = [call.toString(), call2.toString(), call3.toString()]
  
        const PROPOSAL_DESCRIPTION = ""
        const targets = [vault.address, hypercerts.address, hypercerts.address]
        const values = ["0", "0", "0"]
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

        await hypercerts.connect(alice).transferFrom(alice.address, vault.address, 0)
        
        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.5'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
        expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0'))
  
        await vault.connect(alice).withdraw(ethers.utils.parseEther('0.1'))
  
        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.45'))
        expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.05'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.9'))
        expect(await vault.totalSupply()).to.equal(ethers.utils.parseEther('0.9'))
  
      });

      it("Should sell 1 fraction", async function () {
        const { gov, vault, alice, bob, erc20Mock, hypercerts, shop } = await loadFixture(deployContracts);
  
        await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
        await vault.connect(alice).give(ethers.utils.parseEther('1'))
        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
  
        const call = vault.interface.encodeFunctionData('govWithdraw', [ethers.utils.parseEther('0.5')])
        const call2 = hypercerts.interface.encodeFunctionData('safeMint', [alice.address])
        const call3 = hypercerts.interface.encodeFunctionData('safeMint', [shop.address])
        const calldatas = [call.toString(), call2.toString(), call3.toString()]
  
        const PROPOSAL_DESCRIPTION = ""
        const targets = [vault.address, hypercerts.address, hypercerts.address]
        const values = ["0", "0", "0"]
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
        
        expect(await hypercerts.ownerOf(1)).to.be.equal(shop.address)
      });

      it("Should let Francis buy 1 fraction", async function () {
        const { gov, vault, alice, bob, erc20Mock, hypercerts, shop, francis } = await loadFixture(deployContracts);
  
        await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
        await vault.connect(alice).give(ethers.utils.parseEther('1'))
        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
  
        const call = vault.interface.encodeFunctionData('govWithdraw', [ethers.utils.parseEther('0.5')])
        const call2 = hypercerts.interface.encodeFunctionData('safeMint', [alice.address])
        const call3 = hypercerts.interface.encodeFunctionData('safeMint', [shop.address])
        const calldatas = [call.toString(), call2.toString(), call3.toString()]
  
        const PROPOSAL_DESCRIPTION = ""
        const targets = [vault.address, hypercerts.address, hypercerts.address]
        const values = ["0", "0", "0"]
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
        expect(await hypercerts.ownerOf(1)).to.be.equal(shop.address)

        await erc20Mock.connect(francis).approve(shop.address, ethers.utils.parseEther('100'))
        await shop.connect(francis).buy(hypercerts.address, 1)
        expect(await hypercerts.ownerOf(1)).to.be.equal(francis.address)

      });

  });
});