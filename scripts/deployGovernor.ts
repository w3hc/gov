import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as store from '../store.json'

async function main() {
  
  const SSD = await ethers.getContractFactory("SSD")
  const ssd = await SSD.deploy(store.sugarContractAddress)
  await ssd.deployed();
  console.log("Signed, sealed, delivered:", msg(ssd.address), "✅")  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
