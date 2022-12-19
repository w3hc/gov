import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
const fs = require("fs");
const hre = require("hardhat");
import * as store from '../store.json'
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  
  console.log("\nManifesto deployment in progress...")
  const Manifesto = await ethers.getContractFactory("Manifesto");
  const manifesto = await Manifesto.deploy("bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v1");
  console.log("\nManifesto contract deployed at", msg(manifesto.address), "✅");

  await manifesto.transferOwnership(store.ssd)
  console.log("\nOwnership transferred to", store.ssd)

  fs.writeFileSync(
    "store.json",
    JSON.stringify({
      sugar: store.sugar, 
      ssd: store.ssd,
      manifesto: manifesto.address
    }, undefined, 2),
  ); 

  // console.log("Etherscan verification in progress...")
  // await manifesto.deployTransaction.wait(6)
  // await hre.run("verify:verify", { network: "goerli", address: manifesto.address, constructorArguments: ["bafybeihprzyvilohv6zwyqiel7wt3dncpjqdsc6q7xfj3iuraoc7n552ya", "v1"], });
  // console.log("Etherscan verification done. ✅")

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
