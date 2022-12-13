import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as store from '../store.json'
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  
  // deployer = 0x70456d078950db075283931D9bE2E01B49f3e71e = "Goerli Super tester" addr

  const SSD = await ethers.getContractFactory("SSD")
  const ssd = await SSD.deploy(store.sugarContractAddress)
  await ssd.deployed();
  console.log("Governor contract address:", msg(ssd.address), "✅")  

  console.log("Etherscan verification in progress...")
  await ssd.deployTransaction.wait(6)
  await hre.run("verify:verify", { network: "goerli", address: ssd.address, constructorArguments: [store.sugarContractAddress], });
  console.log("Etherscan verification done. ✅")

  const [issuer] = await ethers.getSigners()
  const abiDir = __dirname + '/../artifacts/contracts';
  const sugarAbiContract = abiDir + "/" + "Sugar.sol" + "/" + "Sugar" + ".json"  
  let sugarAbi;
  try {
    sugarAbi = JSON.parse(fs.readFileSync(sugarAbiContract,{encoding:'utf8', flag:'r'}));
  } catch (error) {
    console.log(error)
    return;
  }
  const sugar = new ethers.Contract(store.sugarContractAddress, sugarAbi.abi, issuer)

  const transferOwnership = await sugar.transferOwnership(ssd.address);
  console.log("Sugar NFT contract owner is", await sugar.owner(), "✅")  

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
