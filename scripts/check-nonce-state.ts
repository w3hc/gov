import { ethers } from "hardhat"
import { Gov__factory } from "../typechain-types/factories/contracts/variants/crosschain/Gov__factory"
import { ProofHandler__factory } from "../typechain-types"

async function main() {
    const GOV_ADDRESS = "0xB8de4177BAf7365DFc7E6ad860E4B223b40f91A0"
    const NEW_VOTING_DELAY = 250n
    const PROOF_HANDLER_ADDRESS = "0x0152ee45780385dACCCCB128D816031CfFe5F36B"
    const OPERATION_TYPE = 1 // UPDATE_VOTING_DELAY

    // Connect to contracts
    const provider = new ethers.JsonRpcProvider(
        process.env.SEPOLIA_RPC_ENDPOINT_URL
    )

    console.log("\nReading ProofHandler storage...")

    // Calculate storage slot for currentNonce
    const nonceSlot = ethers.keccak256(
        ethers.solidityPacked(
            ["uint8", "uint256"],
            [OPERATION_TYPE, 0] // mapping key and base slot
        )
    )

    // Read nonce state
    const nonceData = await provider.getStorage(
        PROOF_HANDLER_ADDRESS,
        nonceSlot
    )
    const currentNonce = parseInt(nonceData, 16)
    console.log("Storage slot:", nonceSlot)
    console.log("Raw data:", nonceData)
    console.log("Current nonce:", currentNonce)

    // Check if the nonce was already claimed on target chain
    const opSepoliaProvider = new ethers.JsonRpcProvider(
        process.env.OP_SEPOLIA_RPC_ENDPOINT_URL
    )
    const opNonceData = await opSepoliaProvider.getStorage(
        PROOF_HANDLER_ADDRESS,
        nonceSlot
    )
    const opCurrentNonce = parseInt(opNonceData, 16)
    console.log("\nOP Sepolia nonce:", opCurrentNonce)

    // Check proof hash storage
    for (let nonce = 1; nonce <= 3; nonce++) {
        const proofValue = ethers.solidityPacked(["uint48"], [NEW_VOTING_DELAY])
        const message = ethers.keccak256(
            ethers.solidityPacked(
                ["address", "uint8", "bytes", "uint256"],
                [GOV_ADDRESS, OPERATION_TYPE, proofValue, nonce]
            )
        )
        const digest = ethers.keccak256(
            ethers.solidityPacked(
                ["string", "bytes32"],
                ["\x19Ethereum Signed Message:\n32", message]
            )
        )
        console.log(`\nNonce ${nonce} digest:`, digest)

        // Check if proof was applied
        const proofHash = ethers.keccak256(
            ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint8", "bytes", "uint256", "bytes32"],
                [OPERATION_TYPE, proofValue, nonce, digest]
            )
        )
        const proofSlot = ethers.keccak256(
            ethers.solidityPacked(
                ["bytes32", "uint256"],
                [proofHash, 1] // mapping key and base slot for updateAppliedOnChain
            )
        )
        const appliedData = await opSepoliaProvider.getStorage(
            PROOF_HANDLER_ADDRESS,
            proofSlot
        )
        console.log(
            `Proof ${nonce} applied:`,
            appliedData !==
                "0x0000000000000000000000000000000000000000000000000000000000000000"
        )
    }
}

main().catch(error => {
    console.error(error)
    process.exitCode = 1
})
