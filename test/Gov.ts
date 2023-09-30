import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { moveBlocks } from "./utils/move-blocks"

describe("Gov", function () {

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
    const firstMembers = signers
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

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const erc20Mock = await ERC20Mock.deploy(ethers.utils.parseEther('10000'))
    await erc20Mock.transfer(gov.address, ethers.utils.parseEther('1'))

    const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
    const erc721Mock = await ERC721Mock.deploy();
    await erc721Mock.approve(gov.address, 1)
    await erc721Mock.transferFrom(deployer.address, gov.address, 1)

    const ERC1155Mock = await ethers.getContractFactory("ERC1155Mock")
    const erc1155Mock = await ERC1155Mock.deploy();
    await erc1155Mock.safeTransferFrom(deployer.address, gov.address, 1, 1, "0x")

    return { gov, nft, deployer, alice, bob, francis, erc20Mock, erc721Mock, erc1155Mock, signers, amount, quorum, firstMembers }
  }

  describe("Deployment", function () {
    it("Should own the right token IDs", async function () {
      const { nft, alice, bob } = await loadFixture(deployContracts);
      expect(await nft.ownerOf(0)).to.equal(alice.address);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    })

    it("Should set the right token address", async function () {
      const { gov, nft } = await loadFixture(deployContracts);
      expect(await gov.token()).to.equal(nft.address);
    })

    it("Should transfer the NFT contract ownership", async function () {
      const { gov, nft } = await loadFixture(deployContracts);
      expect(await nft.owner()).to.equal(gov.address);
    })

    it("Should set the right manifesto cid", async function () {
      const { gov } = await loadFixture(deployContracts);
      expect(await gov.manifesto()).to.equal("bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya");
    })

    it("Should get the quorum", async function () {
      const { gov, nft, quorum } = await loadFixture(deployContracts);
      const blockNumber = await ethers.provider.getBlockNumber();
      // const supply =  await nft.totalSupply();
      // const result = supply.toNumber() * quorum / 100
      // console.log("result:", result)
      expect(await gov.quorum(blockNumber - 1)).to.equal(2);
    })
  });

  describe("Interactions", function () {
    it("Should delegate to self", async function () {
      const { nft, alice } = await loadFixture(deployContracts);
      expect(await nft.delegates(alice.address)).to.equal(alice.address);
    })

    it('Should submit a proposal', async function () {
      const { nft, gov, alice, francis } = await loadFixture(deployContracts);

      const addMemberCall = nft.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
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
    })

    it('Should cast a vote', async function () {
      const { nft, gov, alice, francis } = await loadFixture(deployContracts);

      const addMemberCall = nft.interface.encodeFunctionData('safeMint', [francis.address, "10000000000000"])
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
    })

    it('Should execute the proposal', async function () {      
      const {nft, gov, alice, francis, bob } = await loadFixture(deployContracts)
      const calldatas = [
        (nft.interface.encodeFunctionData('safeMint', [
          francis.address, 
          "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"
        ]
        )).toString()]
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
      await moveBlocks(1)
      await gov.connect(alice).castVote(proposalId,1)
      await gov.connect(bob).castVote(proposalId,1)
      await moveBlocks(298)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await nft.ownerOf(2)).to.equal(francis.address)
    })

    it('Should switch delegate before castVote', async function () {      
      const {nft, gov, alice, francis, bob } = await loadFixture(deployContracts)

      const calldatas = [
        (nft.interface.encodeFunctionData('safeMint', [
          francis.address, 
          "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"
        ]
        )).toString()]
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
      await moveBlocks(1)      
      await nft.connect(bob).delegate(alice.address) // call to delegate after propose and before castVote
      await gov.connect(alice).castVote(proposalId,1)
      // await gov.connect(bob).castVote(proposalId,1) // bob donesn't need to go vote
      await moveBlocks(298)
      const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
      await gov.execute(
        targets, 
        values, 
        calldatas,
        desc
      )
      expect(await nft.ownerOf(2)).to.equal(francis.address)
    })

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

      const banMemberCall = nft.interface.encodeFunctionData('govBurn', [1])
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

      const call = gov.interface.encodeFunctionData('setManifesto', ["bafybeicxjvcgxcwrhgnu7rv3g4qqzozpwhasviz2p3ivk2734d4urqdesm"])
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

      const manifesto = "bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya"
      const name = "Gov"
      const votingDelay = "1"
      const votingPeriod = "300"
      const votingThreshold = "1"
      const quorum = "20"
      const Gov2 = await ethers.getContractFactory("Gov");
      const gov2 = await Gov2.deploy(
        await gov.token(), 
        manifesto, 
        name, 
        votingDelay, 
        votingPeriod, 
        votingThreshold, 
        quorum
      )

      const call = nft.interface.encodeFunctionData('transferOwnership', [gov2.address])
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
      const nftName = "Membership NFT"
      const symbol = "MEMBER"
      const nft2 = await NFT.deploy(firstMembers, uri, nftName, symbol);
      await nft2.deployed()

      const manifesto = "bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya"
      const name = "Gov"
      const votingDelay = 1
      const votingPeriod = 300
      const votingThreshold = 1
      const quorum = 20
      const Gov2 = await ethers.getContractFactory("Gov");
      const gov2 = await Gov2.deploy(
        nft2.address, 
        manifesto, 
        name, 
        votingDelay, 
        votingPeriod, 
        votingThreshold, 
        quorum
      )
      await gov2.deployed()

      await nft2.transferOwnership(gov2.address);
      await nft2.connect(alice).delegate(alice.address)
      await nft2.connect(bob).delegate(bob.address)

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

      const erc721Transfer = erc721Mock.interface.encodeFunctionData('transferFrom', [gov.address, francis.address, 1])
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

    xit("Should make 100+ people vote", async function () {
      const { gov, alice, francis, bob, nft } = await loadFixture(deployContracts);

      await francis.sendTransaction({
        to: gov.address,
        value: ethers.utils.parseEther('1')
      });
      expect(await ethers.provider.getBalance(gov.address)).to.be.equal(ethers.utils.parseEther('1'))

      let amount:number = 200
      let signers:any = []
      const randomSigners = async (amount:number) => {
        for (let i = 0; i < amount; i++) {
          const x = ethers.Wallet.createRandom()
          const y = new ethers.Wallet(x, ethers.provider)
          signers.push(y)
        }
        return signers
      }

      // console.log(randomSigners(amount))
      const members = randomSigners(amount)
      // console.log("Member #198:", (await members)[198].address )

      let max:number = 70
      for (let i = 0; i <= max ; i++) {
        const calldatas = [(nft.interface.encodeFunctionData('safeMint', [(await members)[i].address, "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"])).toString()]
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
        await moveBlocks(1)
        await gov.connect(alice).castVote(proposalId,1)
        await gov.connect(bob).castVote(proposalId,1)
        await moveBlocks(298)
        const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
        await gov.execute(
          targets, 
          values, 
          calldatas,
          desc
        )
        // expect(await nft.ownerOf(2)).to.be.equal((await members)[0].address)

      }
      expect(await nft.balanceOf((await members)[70].address)).to.be.equal("1")
      expect(await nft.ownerOf(72)).to.be.equal((await members)[70].address)
      console.log("[1st loop] nft supply:", (await nft.totalSupply()).toString())
      await francis.sendTransaction({
        to: (await members)[0].address,
        value: ethers.utils.parseEther('0.1')
      });
      await francis.sendTransaction({
        to: (await members)[1].address,
        value: ethers.utils.parseEther('0.1')
      });
      await francis.sendTransaction({
        to: (await members)[2].address,
        value: ethers.utils.parseEther('0.1')
      });
      await francis.sendTransaction({
        to: (await members)[3].address,
        value: ethers.utils.parseEther('0.1')
      });
      await francis.sendTransaction({
        to: (await members)[4].address,
        value: ethers.utils.parseEther('0.1')
      });
      let max2:number = 100
      for (let i = max + 1 ; i <= max + max2 ; i++) {
        const calldatas = [(nft.interface.encodeFunctionData('safeMint', [(await members)[i].address, "ipfs://bafkreih2ac5yabo2daerkw5w5wcwdc7rveqejf4l645hx2px26r5fxfnpe"])).toString()]
        const PROPOSAL_DESCRIPTION = " "
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
        await moveBlocks(1)
        await gov.connect(alice).castVote(proposalId,1)
        await gov.connect(bob).castVote(proposalId,1)
        await gov.connect(francis).castVote(proposalId,1)
        // console.log("Member #0 address:", (await members)[0].address )
        // console.log("Member #0 signer:", (await members)[0] )
        // console.log("Francis signer:", francis)

        // console.log(await nft.balanceOf((await members)[0].address))
        // console.log("members0 bal:", await ethers.provider.getBalance((await members)[0]))

        await nft.connect((await members)[0]).delegate((await members)[0].address)
        await gov.connect((await members)[0]).castVote(proposalId,1)

        await nft.connect((await members)[1]).delegate((await members)[1].address)
        await gov.connect((await members)[1]).castVote(proposalId,1)

        await nft.connect((await members)[2]).delegate((await members)[1].address)
        await gov.connect((await members)[2]).castVote(proposalId,1)

        await nft.connect((await members)[3]).delegate((await members)[1].address)
        await gov.connect((await members)[3]).castVote(proposalId,1)

        await nft.connect((await members)[4]).delegate((await members)[1].address)
        await gov.connect((await members)[4]).castVote(proposalId,1)

        await moveBlocks(298)
        const desc = ethers.utils.id(PROPOSAL_DESCRIPTION)
        await gov.execute(
          targets, 
          values, 
          calldatas,
          desc
        )

      }
      console.log("[2nd loop] nft supply:", (await nft.totalSupply()).toString())
      expect(await nft.balanceOf((await members)[170].address)).to.be.equal("1")
      expect(await nft.ownerOf(172)).to.be.equal((await members)[170].address)

    })
    it("Should transfer the membership NFT", async function () {
      const { nft, alice, bob } = await loadFixture(deployContracts)
      await nft.connect(bob).transferFrom(bob.address, alice.address, 1)
      expect(await nft.ownerOf(1)).to.be.equal(alice.address)
    });
  })
})
