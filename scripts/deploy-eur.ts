// npx hardhat run scripts/deploy-eur.ts --network goerli
import hre, { ethers, network } from 'hardhat'
const color = require("cli-color")
var msg = color.xterm(39).bgXterm(128);
import * as dotenv from "dotenv"

dotenv.config();
var msg = color.xterm(39).bgXterm(128)

async function main() {
  
  console.log("\nEUR deployment in progress...") 

  const EUR = await ethers.getContractFactory("EUR")
  const eur = await EUR.deploy()
  await eur.deployed()
  console.log("\nEUR deployed at", msg(eur.address), "✅")
  const receipt = await ethers.provider.getTransactionReceipt(eur.deployTransaction.hash)

  if (network.name !== 'arthera-testnet') {
    try {
      console.log("\nEtherscan verification in progress...")
      await eur.deployTransaction.wait(6)
      await hre.run("verify:verify", { network: network.name, address: eur.address, constructorArguments: [], })
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