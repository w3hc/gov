import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
const fs = require("fs");
const hre = require("hardhat");
import { Web3Storage, getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  
  // deployer = 0x70456d078950db075283931D9bE2E01B49f3e71e = "Goerli Super tester" addr
  
  const alice = "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"
  const bob = "0xe61A1a5278290B6520f0CEf3F2c71Ba70CF5cf4C"

  function getAccessToken() {
    return process.env.WEB3STORAGE_TOKEN
  }

  function makeStorageClient() {
      return new Web3Storage({ token: getAccessToken()! })
  }

  const dir = "./metadata/"

  async function getFiles (file:any) {
      const File = await getFilesFromPath(file)
      return File
  }

  async function storeFiles(files:any) {
      const client = makeStorageClient()
      const add = await client.put(files,{ wrapWithDirectory:false })
      return add
  }

  const cid = await storeFiles(await getFiles(dir))

  console.log("✅ cid:", cid)
  console.log("✅ url:", "https://" + cid + ".ipfs.w3s.link/metadata.json")

  const uri = "https://" + cid + ".ipfs.w3s.link/metadata.json";

  const Sugar = await ethers.getContractFactory("Sugar")
  const sugar = await Sugar.deploy(alice, bob, uri)
  await sugar.deployed();
  console.log("NFT contract deployed at", msg(sugar.address), "✅")

  fs.writeFileSync(
    "store.json",
    JSON.stringify({sugarContractAddress: sugar.address}, undefined, 2)
  );

  console.log("Etherscan verification in progress...")
  await sugar.deployTransaction.wait(6)
  await hre.run("verify:verify", { network: "goerli", address: sugar.address, constructorArguments: [alice, bob, uri], });
  console.log("Etherscan verification done. ✅")

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
