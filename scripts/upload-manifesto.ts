const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import { Web3Storage, getFilesFromPath } from "web3.storage"
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

  console.log("\nuri:", msg("ipfs://" + cid + "/manifesto.md"))

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
