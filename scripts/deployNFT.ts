import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
const fs = require("fs");

async function main() {
  
  const alice = "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"
  const bob = "0xe61A1a5278290B6520f0CEf3F2c71Ba70CF5cf4C"

  // TODO: add metadata editor
  const uri = "https://ipfs.io/ipfs/bafybeiberpia3qev7lvnusiiheqqfe57sk5r23gs6fh7v3v6vdcw6wrldq/metadata.json";

  const Sugar = await ethers.getContractFactory("Sugar")
  const sugar = await Sugar.deploy(alice, bob, uri)
  await sugar.deployed();
  console.log("NFT contract deployed at", msg(sugar.address), "✅")

  fs.writeFileSync(
    "store.json",
    JSON.stringify({sugarContractAddress: sugar.address}, undefined, 2)
  );

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
