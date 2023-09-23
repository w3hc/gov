import hre, { ethers, network, artifacts } from 'hardhat'
import * as store from '../store.json'
import fs from 'fs'
const color = require("cli-color")
import { upload } from '../scripts/upload-manifesto'
import { daoName, votingDelay, votingPeriod, quorum, votingThreshold } from "../dao.config"

var msg = color.xterm(39).bgXterm(128)

async function main() {

  console.log("\nGov deployment in progress...") 
  
  const Gov = await ethers.getContractFactory("Gov")
  const manifesto = await upload()
  console.log("\nManifesto CID:", manifesto, "✅")

  let gov
  if (network.name !== 'optimism-goerli') {

    gov = await Gov.deploy(
      store.nft, 
      manifesto, 
      daoName, 
      votingDelay, 
      votingPeriod, 
      votingThreshold, 
      quorum
    )

  } else {
    gov = await Gov.deploy(
      store.nft, 
      manifesto, 
      daoName, 
      votingDelay, 
      votingPeriod, 
      votingThreshold, 
      quorum
    )
  }
  await gov.deployed()
  console.log("\nGov deployed at", msg(gov.address), "✅")
  const receipt = await ethers.provider.getTransactionReceipt(gov.deployTransaction.hash)
  console.log("\nBlock number:", msg(receipt.blockNumber))

  fs.writeFileSync(
    'store.json',
    JSON.stringify({
      nft: store.nft, 
      gov: gov.address
    }, undefined, 2),
  )

  fs.writeFileSync(
    'govAbi.json', 
    JSON.stringify(
      artifacts.readArtifactSync('Gov').abi, 
      null, 
      2
    )
  )
  console.log("\nGov ABI available in govAbi.json ✅")  

  if (network.name !== 'arthera-testnet') {
    try {
      console.log("\nEtherscan verification in progress...")
      await gov.deployTransaction.wait(6)
      await hre.run("verify:verify", { network: network.name, address: gov.address, constructorArguments: [
        store.nft, 
        manifesto, 
        daoName, 
        votingDelay, 
        votingPeriod, 
        votingThreshold, 
        quorum], 
      });
      console.log("Etherscan verification done. ✅")
    } catch (error) {
      console.error(error);
    }
  }
  const [issuer] = await ethers.getSigners()
  const abiDir = __dirname + '/../artifacts/contracts';
  const nftAbiContract = abiDir + "/" + "NFT.sol" + "/" + "NFT" + ".json"  
  let nftAbi;
  try {
    nftAbi = JSON.parse(fs.readFileSync(nftAbiContract,{encoding:'utf8', flag:'r'}));
  } catch (error) {
    console.log(error)
    return;
  }
  const nft = new ethers.Contract(store.nft, nftAbi.abi, issuer)
  await nft.transferOwnership(gov.address);
  console.log("\nNFT contract ownership transferred to", gov.address, "✅")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
