// npx hardhat run scripts/deploy-nft.ts --network goerli
import hre, { ethers, network, artifacts } from 'hardhat'
import fs from 'fs'
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import { Web3Storage, Blob, File , getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv"
import { firstMembers, daoName, nftSymbol, nftDescription, participationRate, contribs, daoAddress, nickname, role, attributes } from "../dao.config"

dotenv.config();
var msg = color.xterm(39).bgXterm(128)

async function main() {
  
  console.log("\nStorage in progress...") 

  function getAccessToken() {
    return process.env.WEB3STORAGE_TOKEN
  }

  function makeStorageClient() {
      return new Web3Storage({ token: getAccessToken()! })
  }

  const dir = "./storage/metadata/"
  let fileName:string = ""

  async function getFiles (file:any) {
      const File = await getFilesFromPath(file)
      fileName = File[File.length -1].name.substring(10)
      console.log("fileName:", fileName)
      return File
  }

  async function storeFiles(files:any) {
      const client = makeStorageClient()
      const add = await client.put(files,{ wrapWithDirectory:false })
      return add
  }

  const cid = await storeFiles(await getFiles(dir))
  console.log("url:", "https://" + cid + ".ipfs.w3s.link/"+ fileName)

  console.log("\ncid:", cid)
  const nftName = daoName + " Membership"

  let metaLabs
  if (attributes === true) {
    metaLabs = [
      {
        "trait_type": "Participation rate (%)",
        "value": participationRate,
      },
      {
        "trait_type": "Contribs",
        "value": contribs,
      },
      {
        "trait_type": "DAO",
        "value": daoAddress,
      },
      {
        "trait_type": "Nickname",
        "value": nickname,
      },
      {
        "trait_type": "Role",
        "value": role,
      },
    ]
  } else metaLabs = []

  // Edit the following variable
  const metadata = {
    "name": nftName,
    "description": nftDescription,
    "image": "ipfs://" + cid + "/" + fileName,
    "attributes": [],
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
  
  const uri = (await storeMetadata(makeFileObjects()))
  console.log("Metadata storage done. ✅", uri)

  console.log("\nNFT deployment in progress...") 
  const NFT = await ethers.getContractFactory("NFT")
  const nft = await NFT.deploy(firstMembers, uri, nftName, nftSymbol)
  await nft.deployed()
  console.log("\nNFT deployed at", msg(nft.address), "✅")
  const receipt = await ethers.provider.getTransactionReceipt(nft.deployTransaction.hash)
  console.log("\nBlock number:", msg(receipt.blockNumber))

  fs.writeFileSync(
    "store.json",
    JSON.stringify({nft: nft.address}, undefined, 2)
  );

  fs.writeFileSync(
    'nftAbi.json', 
    JSON.stringify(
      artifacts.readArtifactSync('NFT').abi, 
      null, 
      2
    )
  )
  console.log("\nNFT ABI available in nftAbi.json ✅")  

  if (network.name !== 'arthera-testnet') {
    try {
      console.log("\nEtherscan verification in progress...")
      await nft.deployTransaction.wait(6)
      await hre.run("verify:verify", { network: network.name, address: nft.address, constructorArguments: [firstMembers, uri, nftName, nftSymbol], })
      console.log("Etherscan verification done. ✅")
    } catch (error) {
      console.error(error)
    }
  }
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
});