import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/finance/PaymentSplitter.sol

describe("Splitter", function () {

  async function deployContracts() {
    
    let [deployer, alice, bob, francis, org1, org2, org3] = await ethers.getSigners()

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

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock")
    const erc20Mock = await ERC20Mock.deploy(ethers.utils.parseEther('10000'))
    await erc20Mock.transfer(francis.address, ethers.utils.parseEther('100'))
    await erc20Mock.transfer(alice.address, ethers.utils.parseEther('100'))

    const payees = [org1.address, org2.address]
    const shares = [50, 50]

    const Splitter = await ethers.getContractFactory("UpdatablePaymentSplitter")
    const splitter = await Splitter.deploy(payees, shares)
    await splitter.transferOwnership(gov.address)

    return { splitter, erc20Mock, gov, nft, deployer, alice, bob, francis, signers, amount, quorum, org1, org2, org3 }
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { gov, splitter } = await loadFixture(deployContracts)
      expect(await splitter.owner()).to.equal(gov.address)
    })

    it("Should set the amount of shares", async function () {
      const { splitter, org1} = await loadFixture(deployContracts)
      expect(await splitter.shares(org1.address)).to.equal(50)
    })
  })

  describe("Interactions", function () {
    
    it("Should withdraw 50 shares", async function () {
      const { splitter ,francis, erc20Mock, org1 } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')
      await erc20Mock.connect(francis).approve(splitter.address, donation)      
      await erc20Mock.connect(francis).transfer(splitter.address, donation)  
      expect(await erc20Mock.balanceOf(splitter.address)).to.be.equal(ethers.utils.parseEther('10')) 
      expect (await splitter.shares(org1.address)).to.be.equal(50)
      await splitter.connect(org1)["releasable(address,address)"](erc20Mock.address,org1.address)
      await splitter.connect(org1)["release(address,address)"](erc20Mock.address,org1.address)
      expect (await splitter.shares(org1.address)).to.be.equal(50)
      expect(await erc20Mock.balanceOf(splitter.address)).to.be.equal(ethers.utils.parseEther('5')) 
      expect(await erc20Mock.balanceOf(org1.address)).to.be.equal(ethers.utils.parseEther('5')) 
    })

    it("Should add a payee", async function () {
      const { splitter ,francis, org3, erc20Mock, org1, gov, alice, bob  } = await loadFixture(deployContracts)

      expect( splitter.connect(francis)._addPayee(org3.address, 50)).to.be.revertedWith("Ownable: caller is not the owner")

      const call = splitter.interface.encodeFunctionData('_addPayee', [org3.address, 50])
      const calldatas = [call.toString()]
      const PROPOSAL_DESCRIPTION = "v2"
      const targets = [splitter.address]
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

      const donation = ethers.utils.parseEther('10')
      await erc20Mock.connect(francis).approve(splitter.address, donation)      
      await erc20Mock.connect(francis).transfer(splitter.address, donation)  
      expect(await erc20Mock.balanceOf(splitter.address)).to.be.equal(ethers.utils.parseEther('10')) 
      expect (await splitter.shares(org1.address)).to.be.equal(50)
      await splitter.connect(org1)["releasable(address,address)"](erc20Mock.address,org1.address)
      await splitter.connect(org1)["release(address,address)"](erc20Mock.address,org1.address)
      expect (await splitter.shares(org1.address)).to.be.equal(50)
      expect(await erc20Mock.balanceOf(org1.address)).to.be.equal(ethers.utils.parseEther('3.333333333333333333')) 
    })

    xit("Should remove a payee", async function () {
      const { splitter ,francis, org3, erc20Mock, org1, gov, alice, bob  } = await loadFixture(deployContracts)
    
    })

    xit("Should update the amount of shares", async function () {
      const { splitter ,francis, org3, erc20Mock, org1, gov, alice, bob  } = await loadFixture(deployContracts)
    
    })
  })
})