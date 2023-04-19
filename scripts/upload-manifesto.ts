const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import { Web3Storage, getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv";
dotenv.config();

export async function upload() {
  
  console.log("\nStorage in progress...") 

  function getAccessToken() {
    return process.env.WEB3STORAGE_TOKEN
  }

  function makeStorageClient() {
      return new Web3Storage({ token: getAccessToken()! })
  }

  const dir = "./storage/manifesto/"

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

  // console.log("\ncid:", msg(cid))

  // console.log("\nurl:", "https://gateway.ipfs.io/ipfs/" + cid + "/manifesto.md")

  // console.log("\nManifesto storage done. ✅")

  return cid
}

upload().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
