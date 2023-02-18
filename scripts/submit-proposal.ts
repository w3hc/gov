// npx hardhat run scripts/submit-proposal.ts --network goerli
import hre, { ethers, network, artifacts } from 'hardhat'
const color = require("cli-color")

var msg = color.xterm(39).bgXterm(128)

async function main() {

  console.log("\nSubmitting proposal...") 

  const TALLY_DAO_NAME = ""

  const baseUrl = "https://www.tally.xyz/gov/"+TALLY_DAO_NAME+"/proposal/"
  const govAbi = artifacts.readArtifactSync('Gov').abi

  const [member] = await ethers.getSigners()
  console.log("member:", member)

  try {
    // prepare Gov
    const gov = new ethers.Contract( '0x690C775dD85365a0b288B30c338ca1E725abD50E', govAbi, member)

    // prepare calldatas
    const call = "0x"
    const calldatas = [call.toString()]

    // prepare proposal description
    const PROPOSAL_DESCRIPTION = ""
    console.log("PROPOSAL_DESCRIPTION:", PROPOSAL_DESCRIPTION)

    // set targets and values
    const targets = ["0xD8a394e7d7894bDF2C57139fF17e5CBAa29Dd977"] // Alice DAO Tester addr
    const values = [ethers.utils.parseEther("0.0001")]
    
    // call propose
    const propose = await gov.propose(
      targets, 
      values, 
      calldatas, 
      PROPOSAL_DESCRIPTION
    )
    console.log("Propose triggered")
    const proposeReceipt = await propose.wait(1)
    const proposalId = proposeReceipt.events![0].args!.proposalId.toString()
    console.log("proposalId:", proposalId)
    console.log("Tally link:", msg(baseUrl + proposalId))

  } catch(e) {
    console.log("error:", e)
  }
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
