import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as store from '../store.json'
const hre = require("hardhat");
const fs = require('fs');

async function main() {

  console.log("\nGov deployment in progress...") 
  
  const Gov = await ethers.getContractFactory("Gov")
  const gov = await Gov.deploy(store.nft)
  await gov.deployed();
  console.log("\nGov deployed at", msg(gov.address), "✅")  

  fs.writeFileSync(
    "store.json",
    JSON.stringify({
      nft: store.nft, 
      gov: gov.address
    }, undefined, 2),
  ); 

  console.log("Etherscan verification in progress...")
  await gov.deployTransaction.wait(6)
  await hre.run("verify:verify", { network: "goerli", address: gov.address, constructorArguments: [store.nft], });
  console.log("Etherscan verification done. ✅")

  const [issuer] = await ethers.getSigners()
  const abiDir = __dirname + '/../artifacts/contracts';
  const nftAbiContract = abiDir + "/" + "NFT.sol" + "/" + "NFT" + ".json"  
  let nftAbi;
  try {
    nftAbi = JSON.parse(fs.readFileSync(nftAbiContract,{encoding:'utf8', flag:'r'}));
  } catch (error) {
    console.log(error)
    return;
  }
  const nft = new ethers.Contract(store.nft, nftAbi.abi, issuer)

  await nft.transferOwnership(gov.address);
  const newOwner = await nft.owner()
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
