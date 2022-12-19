import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
const fs = require("fs");
const hre = require("hardhat");
import { Web3Storage, Blob, File , getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  
  console.log("NFT contract deployment in progress...")
  
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

  console.log("\ncid:", cid)

  console.log("url:", "https://" + cid + ".ipfs.w3s.linkdata/MANIFESTO.template.md")
  console.log("url:", "https://" + cid + ".ipfs.w3s.linkdata/lode-runner-lightblue.png")

  const metadata = {
    "name": "SSD Membership",
    "author": "SSD",
    "description": "The owner of this NFT has a right to vote on the test DAO proposals.",
    "image": "ipfs://" + cid + "/lode-runner-lightblue.png",
    "manifesto": "ipfs://" + cid + "/MANIFESTO.template.md",
    // "attributes": [
    //   {
    //     "trait_type": "Level",
    //     "value": "1"
    //   }
    // ]
  }

  function makeFileObjects() {
    const blob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
    });

    const files = [
      new File(["contents-of-file-1"], "plain-utf8.txt"),
      new File([blob], "metadata.json"),
    ];
    return files
  }

  async function storeMetadata(files: any) {
    const client = makeStorageClient()
    const cid = await client.put(files, { wrapWithDirectory:false })
    return "ipfs://" + cid 
  }

  const uri = (await storeMetadata(makeFileObjects()));
  console.log("Metadata storage done. ✅", uri)

  const manifestoUri = "https://" + cid + ".ipfs.w3s.linkdata/lode-runner-lightblue.png"
  fs.writeFileSync(
    "manifesto.json",
    JSON.stringify({manifesto: manifestoUri}, undefined, 2)
  );

  const Sugar = await ethers.getContractFactory("Sugar")
  const sugar = await Sugar.deploy(alice, bob, uri)
  await sugar.deployed();
  console.log("\nNFT contract deployed at", msg(sugar.address), "✅")

  fs.writeFileSync(
    "store.json",
    JSON.stringify({sugar: sugar.address}, undefined, 2)
  );

  // console.log("Etherscan verification in progress...")
  // await sugar.deployTransaction.wait(6)
  // await hre.run("verify:verify", { network: "goerli", address: sugar.address, constructorArguments: [alice, bob, uri], });
  // console.log("Etherscan verification done. ✅")

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
