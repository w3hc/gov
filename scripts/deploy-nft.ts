// npx hardhat run scripts/deploy-nft.ts --network goerli
import hre, { ethers, network, artifacts } from 'hardhat'
import fs from 'fs'
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import { Web3Storage, Blob, File , getFilesFromPath } from "web3.storage"
import * as dotenv from "dotenv"

dotenv.config();
var msg = color.xterm(39).bgXterm(128)

async function main() {
  
  console.log("\nStorage in progress...") 

  const firstMembers = [
    "0x718d0218857f2B6f6e3D171eC3465d7bBf8daD9B",
    "0x466c3c7c3bC3e9153Be21867d73782F02708B45B",
    "0x382AB35697B69a6C08BA86d379583d7f39Fd4941",
    "0x476E2651BF97dE8a26e4A05a9c8e00A6EFa1390c",
    "0x58B9A0987C306bd397B6A3bC4336778a67bb90B9",
    "0x5a5dA6353aA78B0f97e69DA11E3ae022df03456e",
    "0x7fd5d090a30460385dd165fc1608e1f66fa2448e"
  ];

  function getAccessToken() {
    return process.env.WEB3STORAGE_TOKEN
  }

  function makeStorageClient() {
      return new Web3Storage({ token: getAccessToken()! })
  }

  const dir = "./storage/metadata/"
  let name:string = ""

  async function getFiles (file:any) {
      const File = await getFilesFromPath(file)
      name = File[File.length -1].name.substring(10)
      console.log("name:", name)
      return File
  }

  async function storeFiles(files:any) {
      const client = makeStorageClient()
      const add = await client.put(files,{ wrapWithDirectory:false })
      return add
  }

  const cid = await storeFiles(await getFiles(dir))
  console.log("url:", "https://" + cid + ".ipfs.w3s.link/"+ name)

  console.log("\ncid:", cid)

  // Edit the following variable
  const metadata = {
    "name": "DAO Membership",
    "author": "Gov",
    "description":
      "The owner of this NFT has a right to vote on the test DAO proposals.",
    "image": "ipfs://" + cid + "/" + name,
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
    return "ipfs://" + cid 
  }
  
  const uri = (await storeMetadata(makeFileObjects()))
  console.log("Metadata storage done. ✅", uri)

  console.log("\nNFT deployment in progress...") 
  const NFT = await ethers.getContractFactory("NFT")
  const nft = await NFT.deploy(firstMembers, uri)
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

  try {
    console.log("\nEtherscan verification in progress...")
    await nft.deployTransaction.wait(6)
    await hre.run("verify:verify", { network: network.name, address: nft.address, constructorArguments: [firstMembers, uri], })
    console.log("Etherscan verification done. ✅")
  } catch (error) {
    console.error(error)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
});