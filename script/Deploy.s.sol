// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.20 <0.9.0;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {NFT} from "../src/NFT.sol";
import {Gov} from "../src/Gov.sol";

/**
 * @title Deploy Script
 * @notice Deploys the Gov V2 governance system
 * @dev Loads configuration from config/dao.config.json
 */
contract Deploy is Script {
    struct DaoConfig {
        string nftName;
        string nftSymbol;
        string tokenURI;
        string govName;
        string manifestoCid;
        uint48 votingDelay;
        uint32 votingPeriod;
        uint256 proposalThreshold;
        uint256 quorum;
        address[] initialMembers;
    }

    function run() public {
        // Default config for local development (anvil)
        address[] memory defaultMembers = new address[](3);
        defaultMembers[0] = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Anvil account #0
        defaultMembers[1] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil account #1
        defaultMembers[2] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil account #2

        DaoConfig memory config = DaoConfig({
            nftName: "Gov DAO",
            nftSymbol: "GOV",
            tokenURI: "ipfs://QmDefault",
            govName: "Gov DAO",
            manifestoCid: "QmDefaultManifesto",
            votingDelay: 1 days,
            votingPeriod: 1 weeks,
            proposalThreshold: 1,
            quorum: 4,
            initialMembers: defaultMembers
        });

        // Try to load from config file if it exists and fs_permissions allow
        try vm.readFile(string.concat(vm.projectRoot(), "/config/dao.config.json")) returns (string memory json) {
            config.nftName = abi.decode(vm.parseJson(json, ".nftName"), (string));
            config.nftSymbol = abi.decode(vm.parseJson(json, ".nftSymbol"), (string));
            config.tokenURI = abi.decode(vm.parseJson(json, ".tokenURI"), (string));
            config.govName = abi.decode(vm.parseJson(json, ".govName"), (string));
            config.manifestoCid = abi.decode(vm.parseJson(json, ".manifestoCid"), (string));
            config.votingDelay = uint48(abi.decode(vm.parseJson(json, ".votingDelay"), (uint256)));
            config.votingPeriod = uint32(abi.decode(vm.parseJson(json, ".votingPeriod"), (uint256)));
            config.proposalThreshold = abi.decode(vm.parseJson(json, ".proposalThreshold"), (uint256));
            config.quorum = abi.decode(vm.parseJson(json, ".quorum"), (uint256));
            config.initialMembers = abi.decode(vm.parseJson(json, ".initialMembers"), (address[]));
            console2.log("Loaded config from dao.config.json");
        } catch {
            console2.log("Using default config (no config file or fs_permissions not set)");
        }

        // Use anvil account #0 private key by default for local deployment
        uint256 deployerPrivateKey =
            vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy NFT (will be owned by Gov after deployment)
        NFT nft = new NFT(
            deployer, // Temporary owner, will transfer to Gov
            config.initialMembers,
            config.tokenURI,
            config.nftName,
            config.nftSymbol
        );

        console2.log("NFT deployed at:", address(nft));

        // Deploy Gov
        Gov gov = new Gov(
            nft,
            config.manifestoCid,
            config.govName,
            config.votingDelay,
            config.votingPeriod,
            config.proposalThreshold,
            config.quorum
        );

        console2.log("Gov deployed at:", address(gov));

        // Transfer NFT ownership to Gov
        nft.transferOwnership(address(gov));
        console2.log("NFT ownership transferred to Gov");

        vm.stopBroadcast();

        // Log deployment summary
        console2.log("\n=== Deployment Summary ===");
        console2.log("NFT Contract:", address(nft));
        console2.log("Gov Contract:", address(gov));
        console2.log("Initial Members:", config.initialMembers.length);
        console2.log("Voting Delay:", config.votingDelay, "seconds");
        console2.log("Voting Period:", config.votingPeriod, "seconds");
        console2.log("Proposal Threshold:", config.proposalThreshold);
        console2.log("Quorum:", config.quorum, "%");
    }
}
