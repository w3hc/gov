import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/finance/PaymentSplitter.sol

describe("Fundraiser", function () {

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
    const nftName = "Membership NFT"
    const symbol = "MEMBER"
    const NFT = await ethers.getContractFactory("NFT")
    const nft = await NFT.deploy(firstMembers, uri, nftName, symbol)

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

//     IERC20 _usdc,
//     uint _minCap,
//     uint _deadline

    const Fundraiser = await ethers.getContractFactory("Fundraiser")
    const fundraiser = await Fundraiser.deploy(erc20Mock.address, 1, 222222)
    await fundraiser.transferOwnership(gov.address)

    return { fundraiser, erc20Mock, gov, nft, deployer, alice, bob, francis, signers, amount, quorum, org1, org2, org3 }
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { gov, fundraiser } = await loadFixture(deployContracts)
      expect(await fundraiser.owner()).to.equal(gov.address)
    })

    it("Should set the usdc address", async function () {
      const { fundraiser, erc20Mock} = await loadFixture(deployContracts)
      expect(await fundraiser.usdc()).to.equal(erc20Mock.address)
    })
  })

  describe("Interactions", function () {
    
    it("Should fund the project", async function () {
      const { fundraiser ,francis, erc20Mock, org1 } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')
      await erc20Mock.connect(francis).approve(fundraiser.address, donation)     
      await erc20Mock.connect(francis).transfer(fundraiser.address, donation)  
      expect(await erc20Mock.balanceOf(fundraiser.address)).to.be.equal(donation) 
    })

    it("Should withdraw the whole contract balance", async function () {
      const { fundraiser ,francis, erc20Mock, org1 } = await loadFixture(deployContracts)
      const donation = ethers.utils.parseEther('10')
      await erc20Mock.connect(francis).approve(fundraiser.address, donation)     
      await erc20Mock.connect(francis).transfer(fundraiser.address, donation)  
      expect(await erc20Mock.balanceOf(fundraiser.address)).to.be.equal(donation)
      expect(await fundraiser.stop())
      // expect(await fundraiser.stop())

    })

    xit("Should exit ", async function () {
      const { splitter ,francis, org3, erc20Mock, org1, gov, alice, bob  } = await loadFixture(deployContracts)
    
    })

    xit("Should not reach the min cap ", async function () {
      const { splitter ,francis, org3, erc20Mock, org1, gov, alice, bob  } = await loadFixture(deployContracts)
    
    })

    xit("Should ", async function () {
      const { splitter ,francis, org3, erc20Mock, org1, gov, alice, bob  } = await loadFixture(deployContracts)
    
    })
  })
})