import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Signed Sealed Delivered", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob] = await ethers.getSigners();

    const uri = "https://ipfs.io/ipfs/bafybeiberpia3qev7lvnusiiheqqfe57sk5r23gs6fh7v3v6vdcw6wrldq/metadata.json";
    const Sugar = await ethers.getContractFactory("Sugar");
    const sugar = await Sugar.deploy(alice.address, bob.address, uri);

    const SSD = await ethers.getContractFactory("SSD");
    const ssd = await SSD.deploy(sugar.address);

    await sugar.transferOwnership(ssd.address);

    return { ssd, sugar, deployer, alice, bob };
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

    it("Should transfer the NFT contract ownership to the Governor contract", async function () {
      const { ssd, sugar } = await loadFixture(deployContracts);
      expect(await sugar.owner()).to.equal(ssd.address);
    }); 

  });

  describe("Interactions", function () {
    
    // TODO: Gov can mint NFTs
    // TODO: Gov can burn NFTs
    // TODO: Members can vote

  });
});
