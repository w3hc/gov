import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
const fs = require("fs");
const hre = require("hardhat");
import { Web3Storage, Blob, File , getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  
  console.log("\nStorage in progress...") 
  
  const alice = "0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"
  const bob = "0xe61A1a5278290B6520f0CEf3F2c71Ba70CF5cf4C"

  const firstMembers = [
    alice, 
    bob
  ];

  function getAccessToken() {
    return process.env.WEB3STORAGE_TOKEN
  }

  function makeStorageClient() {
      return new Web3Storage({ token: getAccessToken()! })
  }

  const dir = "./storage/metadata/"

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

  console.log("url:", "https://" + cid + ".ipfs.w3s.linkdata/image.png")

  const metadata = {
    "name": "DAO Membership",
    "author": "Gov",
    "description":
      "The owner of this NFT has a right to vote on the test DAO proposals.",
    "image": "ipfs://" + cid + "/image.png",
    "attributes": [
      {
        "trait_type": "Participation rate",
        "value": "100%",
      },
      {
        "trait_type": "Contribs",
        "value": "0",
      },
      {
        "trait_type": "DAO",
        "value": "unset",
      },
      {
        "trait_type": "Nickname",
        "value": "unset",
      },
      {
        "trait_type": "Role",
        "value": "Hacker",
      },
    ],
  };

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

  console.log("\nNFT deployment in progress...") 
  const NFT = await ethers.getContractFactory("NFT")
  const nft = await NFT.deploy(firstMembers, uri)
  await nft.deployed();
  console.log("\nNFT deployed at", msg(nft.address), "✅")

  fs.writeFileSync(
    "store.json",
    JSON.stringify({nft: nft.address}, undefined, 2)
  );

  try {
    console.log("\nEtherscan verification in progress...")
    await nft.deployTransaction.wait(6)
    await hre.run("verify:verify", { network: "goerli", address: nft.address, constructorArguments: [firstMembers, uri], });
    console.log("Etherscan verification done. ✅")
  } catch (error) {
    console.error(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});