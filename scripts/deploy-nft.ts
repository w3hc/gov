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
  
  const o = "0x7fd5d090a30460385dd165fc1608e1f66fa2448e"
  const b = "0x476e2651bf97de8a26e4a05a9c8e00a6efa1390c"
  const j = "0xa30189949cd8f662582b10eb6e353374419edf67"

  const firstMembers = [
    o, 
    b,
    j
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

  console.log("url:", "https://" + cid + ".ipfs.w3s.link/image.png")

  // Edit the following variable
  const metadata = {
    "name": "Web3 Hackers Collective Membership",
    "author": "W3HC",
    "description":
      "The owner of this NFT has a right to vote on proposals submitted to the W3HC DAO. \n\nThe mission statement of the Web3 Hackers Collective is \"We want to build integrations through mentoring and learning.\" \n\nhttps://w3hc.org/",
    "image": "ipfs://" + cid + "/image.png",
    "attributes": [
      {
        "trait_type": "Participation rate (%)",
        "value": "100",
      },
      {
        "trait_type": "Contribs",
        "value": "1",
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
  const W3HCMembership = await ethers.getContractFactory("W3HCMembership")
  const nft = await W3HCMembership.deploy(firstMembers, uri)
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
      artifacts.readArtifactSync('W3HCMembership').abi, 
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