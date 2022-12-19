import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as store from '../store.json'
const hre = require("hardhat");
const fs = require('fs');

async function main() {

  console.log("\nGovernor deployment in progress...") 
  
  const SSD = await ethers.getContractFactory("SSD")
  const ssd = await SSD.deploy(store.sugar)
  await ssd.deployed();
  console.log("\nGovernor deployed at", msg(ssd.address), "✅")  

  fs.writeFileSync(
    "store.json",
    JSON.stringify({
      sugar: store.sugar, 
      ssd: ssd.address
    }, undefined, 2),
  ); 

  // console.log("Etherscan verification in progress...")
  // await ssd.deployTransaction.wait(6)
  // await hre.run("verify:verify", { network: "goerli", address: ssd.address, constructorArguments: [store.sugar], });
  // console.log("Etherscan verification done. ✅")

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
  const sugar = new ethers.Contract(store.sugar, sugarAbi.abi, issuer)

  await sugar.transferOwnership(ssd.address);
  const newOwner = await sugar.owner()
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
