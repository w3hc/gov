// npx hardhat run scripts/deploy-gov.ts --network goerli
import hre, { ethers, network, artifacts } from 'hardhat'
import * as store from '../store.json'
import fs from 'fs'
const color = require("cli-color")
import { upload } from '../scripts/upload-manifesto'

var msg = color.xterm(39).bgXterm(128)

async function main() {

  console.log("\nGov deployment in progress...") 
  
  const Gov = await ethers.getContractFactory("Web3HackersCollective")
  const manifesto = await upload()

  /*
  On Optimism Mainnet 

  1 day : 569288-566176=3112
  2 days : 569288-563523=5765

  SO that's 120 blocks / 1 hour according to Etherscan

  On OP testnet (previous calculation): 300 is around 1 hour according to https://www.tally.xyz/gov/more-optimistic-than-ever
  */

  // Edit the following 5 variables
  const name = "Web3 Hackers Collective"
  const votingDelay = 1
  const numberOfDays = 14
  const votingPeriod = 120 * 24 * numberOfDays // For OP Mainnet
  const votingThreshold = 1
  const quorum = 20

  const gov = await Gov.deploy(
    store.nft, 
    manifesto, 
    name, 
    votingDelay, 
    votingPeriod, 
    votingThreshold, 
    quorum
  )
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
      artifacts.readArtifactSync('Web3HackersCollective').abi, 
      null, 
      2
    )
  )
  console.log("\nGov ABI available in govAbi.json ✅")  

  try {
    console.log("\nEtherscan verification in progress...")
    await gov.deployTransaction.wait(6)
    await hre.run("verify:verify", { network: network.name, address: gov.address, constructorArguments: [
      store.nft, 
      manifesto, 
      name, 
      votingDelay, 
      votingPeriod, 
      votingThreshold, 
      quorum], 
    });
    console.log("Etherscan verification done. ✅")
  } catch (error) {
    console.error(error);
  }

  const [issuer] = await ethers.getSigners()
  const abiDir = __dirname + '/../artifacts/contracts';
  const nftAbiContract = abiDir + "/" + "W3HCMembership.sol" + "/" + "W3HCMembership" + ".json"  
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
