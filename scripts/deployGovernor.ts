import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as store from '../store.json'
const hre = require("hardhat");
const fs = require('fs');

async function main() {
  
  // deployer = 0x70456d078950db075283931D9bE2E01B49f3e71e = "Goerli Super tester" addr

  const SSD = await ethers.getContractFactory("SSD")
  const ssd = await SSD.deploy(store.sugar)
  await ssd.deployed();
  console.log("Governor contract address:", msg(ssd.address), "✅")  

  fs.writeFileSync(
    "store.json",
    JSON.stringify({
      sugar: store.sugar, 
      ssd: ssd.address
    }, undefined, 2),
  ); 

  console.log("Etherscan verification in progress...")
  await ssd.deployTransaction.wait(6)
  await hre.run("verify:verify", { network: "goerli", address: ssd.address, constructorArguments: [store.sugar], });
  console.log("Etherscan verification done. ✅")
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
