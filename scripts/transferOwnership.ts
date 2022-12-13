import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as store from '../store.json'
const fs = require('fs');

async function main() {

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

  await sugar.transferOwnership(store.ssd);
  const newOwner = await sugar.owner()
  console.log("Sugar NFT contract owner is now", msg(newOwner), "✅")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
