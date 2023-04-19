import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC4626.sol
// https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC4626

describe("Vault V2", function () {

  async function deployContracts() {
    
    let [deployer, alice, bob, francis] = await ethers.getSigners()

    let amount:number = 10
    let signers:any = [alice.address, bob.address, francis.address]
    const randomSigners = async (amount:number) => {
      for (let i = 0; i < amount; i++) {
        const x = ethers.Wallet.createRandom()
        const y = new ethers.Wallet(x, ethers.provider)
        signers.push(y.address)
      }
      return signers
    }
    await randomSigners(amount)

    const uri = "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"
    const firstMembers = signers;
    const NFT = await ethers.getContractFactory("NFT")
    const nft = await NFT.deploy(firstMembers, uri)

    const manifesto = "bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya"
    const name = "Gov"
    const votingDelay = 1
    const votingPeriod = 300
    const votingThreshold = 1
    const quorum = 20
    const Gov = await ethers.getContractFactory("Gov")
    const gov = await Gov.deploy(
      nft.address, 
      manifesto, 
      name, 
      votingDelay, 
      votingPeriod, 
      votingThreshold, 
      quorum
    )

    await nft.transferOwnership(gov.address)
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
    const erc20Mock = await ERC20Mock.deploy(ethers.utils.parseEther('10000'))
    await erc20Mock.transfer(francis.address, ethers.utils.parseEther('100'))
    await erc20Mock.transfer(alice.address, ethers.utils.parseEther('100'))

    const Vault2 = await ethers.getContractFactory("Vault2")
    const vault2 = await Vault2.deploy(erc20Mock.address)

    await vault2.transferOwnership(gov.address)

    const HypercertsMock = await ethers.getContractFactory("HypercertsMock");
    const hypercerts = await HypercertsMock.deploy();
    await hypercerts.transferOwnership(gov.address)

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock")
    const erc721Mock = await ERC721Mock.deploy()
    await erc721Mock.approve(vault2.address, 1)
    await erc721Mock.transferFrom(deployer.address, francis.address, 1)

    return { vault2, erc20Mock, gov, nft, deployer, alice, bob, francis, signers, amount, quorum, erc721Mock }
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { gov, vault2 } = await loadFixture(deployContracts)
      expect(await vault2.owner()).to.equal(gov.address)
    })

  })

  describe("Interactions", function () {
    
    it("Should deposit 10 units", async function () {
      const { vault2 ,francis, erc20Mock } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')
      await erc20Mock.connect(francis).approve(vault2.address, donation)
      await vault2.connect(francis).deposit(donation, francis.address)
      expect(await vault2.balanceOf(francis.address)).to.equal(donation)
    })

    it("Should withdraw 10 units", async function () {
      const { vault2 ,francis, erc20Mock } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')
      await erc20Mock.connect(francis).approve(vault2.address, donation)
      await vault2.connect(francis).deposit(donation, francis.address)
      expect(await vault2.balanceOf(francis.address)).to.equal(donation)
      await vault2.connect(francis).withdraw(donation, francis.address, francis.address)
      expect(await vault2.balanceOf(francis.address)).to.equal(0)
    })

    it("Should withdraw 9 units", async function () {
      const { vault2, alice, bob, francis, erc20Mock, gov } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')

      // Francis approves 10
      await erc20Mock.connect(francis).approve(vault2.address, donation)

      // Francis deposits 10
      await vault2.connect(francis).deposit(donation, francis.address)

      // Gov spends 1 unit
      const call2 = vault2.interface.encodeFunctionData('govTransfer', [ethers.utils.parseEther('1')])
      const calldatas2 = [call2.toString()]
      const PROPOSAL_DESCRIPTION2 = "no desc"
      const targets2 = [vault2.address]
      const values2 = ["0"]
      const propose2 = await gov.connect(alice).propose(
        targets2, 
        values2, 
        calldatas2, 
        PROPOSAL_DESCRIPTION2
      )
      const proposeReceipt2 = await propose2.wait(1)
      const proposalId2 = proposeReceipt2.events![0].args!.proposalId.toString()
      await moveBlocks(2)
      await gov.connect(alice).castVote(proposalId2,1)
      await gov.connect(bob).castVote(proposalId2,1)
      await moveBlocks(300)
      const desc2 = ethers.utils.id(PROPOSAL_DESCRIPTION2)
      await gov.execute(
        targets2, 
        values2, 
        calldatas2,
        desc2
      )

      // Francis withdraw 9 units
      expect(await vault2.balanceOf(francis.address)).to.equal(donation) // Francis has 10 xUSDC
      expect(await vault2.maxWithdraw(francis.address)).to.equal(ethers.utils.parseEther('9')) // He can withdraw 9 units max
      expect(await vault2.balanceOf(francis.address)).to.equal(donation) // ...but his balance is 10
      await vault2.connect(francis).withdraw(ethers.utils.parseEther('9'), francis.address, francis.address) // He withdraw 9 (can't withdraw more)
      expect(await erc20Mock.balanceOf(francis.address)).to.equal(ethers.utils.parseEther('99')) // His balance is 9 USDC
      expect(await vault2.balanceOf(francis.address)).to.equal(0) // His balance is 0 xUSDC
      expect(await vault2.totalSupply()).to.equal(ethers.utils.parseEther('0')) 

    })

    it("Should mint an NFT", async function () {
      const { vault2, alice, bob, francis, erc20Mock, gov, erc721Mock } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')

      // Francis approves 10
      await erc20Mock.connect(francis).approve(vault2.address, donation)

      // Francis deposits 10
      await vault2.connect(francis).deposit(donation, francis.address)

      // Gov spends 1 unit
      const call2 = vault2.interface.encodeFunctionData('govTransfer', [ethers.utils.parseEther('1')])
      const calldatas2 = [call2.toString()]
      const PROPOSAL_DESCRIPTION2 = "no desc"
      const targets2 = [vault2.address]
      const values2 = ["0"]
      const propose2 = await gov.connect(alice).propose(
        targets2, 
        values2, 
        calldatas2, 
        PROPOSAL_DESCRIPTION2
      )
      const proposeReceipt2 = await propose2.wait(1)
      const proposalId2 = proposeReceipt2.events![0].args!.proposalId.toString()
      await moveBlocks(2)
      await gov.connect(alice).castVote(proposalId2,1)
      await gov.connect(bob).castVote(proposalId2,1)
      await moveBlocks(300)
      const desc2 = ethers.utils.id(PROPOSAL_DESCRIPTION2)
      await gov.execute(
        targets2, 
        values2, 
        calldatas2,
        desc2
      )

      // Mint 1 NFT
      const mintClaim = erc721Mock.interface.encodeFunctionData('mint', [francis.address, 2])
      const calldatas3 = [mintClaim.toString()]
      const PROPOSAL_DESCRIPTION3 = "no desc"
      const targets3 = [erc721Mock.address]
      const values3 = ["0"]
      const propose3 = await gov.connect(alice).propose(
        targets3, 
        values3, 
        calldatas3, 
        PROPOSAL_DESCRIPTION3
      )
      const proposeReceipt3 = await propose3.wait(1)
      const proposalId3 = proposeReceipt3.events![0].args!.proposalId.toString()
      await moveBlocks(2)
      await gov.connect(alice).castVote(proposalId3,1)
      await gov.connect(bob).castVote(proposalId3,1)
      await moveBlocks(300)
      const desc3 = ethers.utils.id(PROPOSAL_DESCRIPTION3)
      await gov.execute(
        targets3, 
        values3, 
        calldatas3,
        desc3
      )
      expect(await erc721Mock.ownerOf(2)).to.equal(francis.address) // Francis has 10 xUSDC

      // Francis withdraw 9 units
      expect(await vault2.balanceOf(francis.address)).to.equal(donation) // Francis has 10 xUSDC
      expect(await vault2.maxWithdraw(francis.address)).to.equal(ethers.utils.parseEther('9')) // He can withdraw 9 units max
      expect(await vault2.balanceOf(francis.address)).to.equal(donation) // ...but his balance is 10
      await vault2.connect(francis).withdraw(ethers.utils.parseEther('9'), francis.address, francis.address) // He withdraw 9 (can't withdraw more)
      expect(await erc20Mock.balanceOf(francis.address)).to.equal(ethers.utils.parseEther('99')) // His balance is 9 USDC
      expect(await vault2.balanceOf(francis.address)).to.equal(0) // His balance is 0 xUSDC
      expect(await vault2.totalSupply()).to.equal(ethers.utils.parseEther('0')) 

    })

    it("Should take a snapshot snapshot", async function () {
      const { vault2, alice, bob, francis, erc20Mock, gov, erc721Mock } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')

      // Francis approves 10
      await erc20Mock.connect(francis).approve(vault2.address, donation)

      // Francis deposits 10
      await vault2.connect(francis).deposit(donation, francis.address)

      // Alice deposits 50
      // await erc20Mock.connect(alice).approve(vault2.address, donation)
      // await vault2.connect(alice).deposit(donation, francis.address)

      // Snapshot
      await vault2.snapshot()
      const snap = await vault2.latestSnapshot()
      console.log("snap:", snap) // returns 1

      await vault2.snapshot()
      const snap2 = await vault2.latestSnapshot()
      console.log("snap:", snap2) // returns 2

      console.log("Francis' bal at snaphot 1:", await vault2.balanceOfAt(francis.address, 1))

      // Gov spends 1 unit
      const call2 = vault2.interface.encodeFunctionData('govTransfer', [ethers.utils.parseEther('1')])
      const calldatas2 = [call2.toString()]
      const PROPOSAL_DESCRIPTION2 = "no desc"
      const targets2 = [vault2.address]
      const values2 = ["0"]
      const propose2 = await gov.connect(alice).propose(
        targets2, 
        values2, 
        calldatas2, 
        PROPOSAL_DESCRIPTION2
      )
      const proposeReceipt2 = await propose2.wait(1)
      const proposalId2 = proposeReceipt2.events![0].args!.proposalId.toString()
      await moveBlocks(2)
      await gov.connect(alice).castVote(proposalId2,1)
      await gov.connect(bob).castVote(proposalId2,1)
      await moveBlocks(300)
      const desc2 = ethers.utils.id(PROPOSAL_DESCRIPTION2)
      await gov.execute(
        targets2, 
        values2, 
        calldatas2,
        desc2
      )

      // Mint 1 NFT
      const mintClaim = erc721Mock.interface.encodeFunctionData('mint', [francis.address, 2])
      const calldatas3 = [mintClaim.toString()]
      const PROPOSAL_DESCRIPTION3 = "no desc"
      const targets3 = [erc721Mock.address]
      const values3 = ["0"]
      const propose3 = await gov.connect(alice).propose(
        targets3, 
        values3, 
        calldatas3, 
        PROPOSAL_DESCRIPTION3
      )
      const proposeReceipt3 = await propose3.wait(1)
      const proposalId3 = proposeReceipt3.events![0].args!.proposalId.toString()
      await moveBlocks(2)
      await gov.connect(alice).castVote(proposalId3,1)
      await gov.connect(bob).castVote(proposalId3,1)
      await moveBlocks(300)
      const desc3 = ethers.utils.id(PROPOSAL_DESCRIPTION3)
      await gov.execute(
        targets3, 
        values3, 
        calldatas3,
        desc3
      )
      expect(await erc721Mock.ownerOf(2)).to.equal(francis.address) // Francis has 10 xUSDC

      // Francis withdraw 9 units
      expect(await vault2.balanceOf(francis.address)).to.equal(donation) // Francis has 10 xUSDC
      expect(await vault2.maxWithdraw(francis.address)).to.equal(ethers.utils.parseEther('9')) // He can withdraw 9 units max
      expect(await vault2.balanceOf(francis.address)).to.equal(donation) // ...but his balance is 10
      await vault2.connect(francis).withdraw(ethers.utils.parseEther('9'), francis.address, francis.address) // He withdraw 9 (can't withdraw more)
      expect(await erc20Mock.balanceOf(francis.address)).to.equal(ethers.utils.parseEther('99')) // His balance is 9 USDC
      expect(await vault2.balanceOf(francis.address)).to.equal(0) // His balance is 0 xUSDC
      expect(await vault2.totalSupply()).to.equal(ethers.utils.parseEther('0')) 

    })
  })
})