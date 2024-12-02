import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"

async function main() {
    const GOV_ADDRESS = "0xB8de4177BAf7365DFc7E6ad860E4B223b40f91A0"
    const NEW_VOTING_DELAY = 250n
    const OPERATION_TYPE = 1 // UPDATE_VOTING_DELAY
    const NONCE = 1n // Force nonce 1

    // Pack parameters
    const value = ethers.solidityPacked(["uint48"], [NEW_VOTING_DELAY])
    console.log("Packed delay value:", value)

    // Create message and digest manually
    const message = ethers.keccak256(
        ethers.solidityPacked(
            ["address", "uint8", "bytes", "uint256"],
            [GOV_ADDRESS, OPERATION_TYPE, value, NONCE]
        )
    )

    const digest = ethers.keccak256(
        ethers.solidityPacked(
            ["string", "bytes32"],
            ["\x19Ethereum Signed Message:\n32", message]
        )
    )

    // Encode the proof
    const proof = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8", "bytes", "uint256", "bytes32"],
        [OPERATION_TYPE, value, NONCE, digest]
    )

    console.log("\nGenerated proof details:")
    console.log("Operation type:", OPERATION_TYPE)
    console.log("Value:", value)
    console.log("Nonce:", NONCE.toString())
    console.log("Digest:", digest)

    console.log("\nFull proof to use in claim script:")
    console.log(proof)

    // Verify the digest matches what we saw in storage
    console.log("\nVerification:")
    const expectedDigest =
        "0xd6e24169a86f648dc2eb3d5607c83873e546b036409af044ff2fe5cfcf32e563"
    console.log("Expected digest:", expectedDigest)
    console.log("Generated digest matches:", digest === expectedDigest)
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
