import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

describe("Vault V1 [DEPRECATED]", function () {

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

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(erc20Mock.address);
    await vault.transferOwnership(gov.address)

    return { gov, nft, deployer, alice, bob, francis, erc20Mock, vault };
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { gov, vault } = await loadFixture(deployContracts);
      expect(await vault.owner()).to.equal(gov.address);
    });
  });

  describe("Interactions", function () {

    it("Should give USDC and mint USDg", async function () {
        const { vault, alice, erc20Mock } = await loadFixture(deployContracts);

        await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
        await vault.connect(alice).give(ethers.utils.parseEther('1'))

        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
    });

    it("Should burn USDg and withdraw USDC", async function () {
        const { vault, alice, erc20Mock } = await loadFixture(deployContracts);

        await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
        await vault.connect(alice).give(ethers.utils.parseEther('1'))

        expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
        expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))

        await vault.connect(alice).withdraw(ethers.utils.parseEther('1'))
    });

    it("Should burn 1 USDg and get 0.5 USDC after govWithdraw", async function () {
      const { vault, gov, alice, bob, erc20Mock } = await loadFixture(deployContracts);

      await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
      await vault.connect(alice).give(ethers.utils.parseEther('1'))

      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
      
      const call = vault.interface.encodeFunctionData('govWithdraw', [ethers.utils.parseEther('0.5')])
      const calldatas = [call.toString()]
      const PROPOSAL_DESCRIPTION = ""
      const targets = [vault.address]
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
      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.5'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
      expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0'))

      await vault.connect(alice).withdraw(ethers.utils.parseEther('1'))

      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0'))
      expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.5'))

    });

    it("Should burn 0.1 USDg and get 0.05 USDC after govWithdraw", async function () {
      const { gov, vault, alice, bob, erc20Mock } = await loadFixture(deployContracts);

      await erc20Mock.connect(alice).approve(vault.address, ethers.utils.parseEther('1'))
      await vault.connect(alice).give(ethers.utils.parseEther('1'))
      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('1'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))

      const call = vault.interface.encodeFunctionData('govWithdraw', [ethers.utils.parseEther('0.5')])
      const calldatas = [call.toString()]
      const PROPOSAL_DESCRIPTION = ""
      const targets = [vault.address]
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
      
      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.5'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('1'))
      expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0'))

      await vault.connect(alice).withdraw(ethers.utils.parseEther('0.1'))

      expect(await erc20Mock.balanceOf(vault.address)).to.equal(ethers.utils.parseEther('0.45'))
      expect(await erc20Mock.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.05'))
      expect(await vault.balanceOf(alice.address)).to.equal(ethers.utils.parseEther('0.9'))
      expect(await vault.totalSupply()).to.equal(ethers.utils.parseEther('0.9'))
    });

  });
});