import { ethers } from "hardhat";
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import { Web3Storage, Blob, File , getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  
  console.log("\nStorage in progress...") 

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

  const metadata = {
    "name": "DAO Membership",
    "author": "Gov",
    "description":
      "The owner of this NFT has a right to vote on the test DAO proposals.",
    "image": "ipfs://" + cid + "/image.png",
    "attributes": [
      {
        "trait_type": "Participation rate (%)",
        "value": "100",
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
    return cid 
  }

  const stored = (await storeMetadata(makeFileObjects()));
  
  console.log("\ntokenURI:", msg("ipfs://" + stored))
  console.log("\ncid:", stored)
  console.log("url:", "https://gateway.ipfs.io/ipfs/" + stored)
  console.log("\nMetadata storage done. ✅")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
