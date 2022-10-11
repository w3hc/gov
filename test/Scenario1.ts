import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Scenario #1", function () {

  async function deployContracts() {
    
    const [deployer, alice, bob] = await ethers.getSigners();

    const uri = "https://ipfs.io/ipfs/bafybeiberpia3qev7lvnusiiheqqfe57sk5r23gs6fh7v3v6vdcw6wrldq/metadata.json";
    const Sugar = await ethers.getContractFactory("Sugar");
    const sugar = await Sugar.deploy(alice.address, bob.address, uri);

    const SSD = await ethers.getContractFactory("SSD");
    const ssd = await SSD.deploy(sugar.address);

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

    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployContracts);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployContracts
    //   );

    //   expect(await ethers.provider.getBalance(lock.address)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      // it("Should revert with the right error if called too soon", async function () {
      //   const { lock } = await loadFixture(deployContracts);

      //   await expect(lock.withdraw()).to.be.revertedWith(
      //     "You can't withdraw yet"
      //   );
      // });

      // it("Should revert with the right error if called from another account", async function () {
      //   const { lock, unlockTime, otherAccount } = await loadFixture(
      //     deployContracts
      //   );

      //   // We can increase the time in Hardhat Network
      //   await time.increaseTo(unlockTime);

      //   // We use lock.connect() to send a transaction from another account
      //   await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
      //     "You aren't the owner"
      //   );
      // });

      // it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
      //   const { lock, unlockTime } = await loadFixture(
      //     deployContracts
      //   );

      //   // Transactions are sent using the first signer by default
      //   await time.increaseTo(unlockTime);

      //   await expect(lock.withdraw()).not.to.be.reverted;
      // });
    });

    describe("Events", function () {
      // it("Should emit an event on withdrawals", async function () {
      //   const { lock, unlockTime, lockedAmount } = await loadFixture(
      //     deployContracts
      //   );

      //   await time.increaseTo(unlockTime);

      //   await expect(lock.withdraw())
      //     .to.emit(lock, "Withdrawal")
      //     .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      // });
    });

    describe("Transfers", function () {
      // it("Should transfer the funds to the owner", async function () {
      //   const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
      //     deployContracts
      //   );

      //   await time.increaseTo(unlockTime);

      //   await expect(lock.withdraw()).to.changeEtherBalances(
      //     [owner, lock],
      //     [lockedAmount, -lockedAmount]
      //   );
      // });
    });
  });
});
