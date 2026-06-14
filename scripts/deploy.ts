import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🚀 Deploying PolisAgentNFT contract...");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying from account: ${deployer.address}`);

  // Get account balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH\n`);

  // Deploy contract
  const PolisAgentNFT = await ethers.getContractFactory("PolisAgentNFT");
  const contract = await PolisAgentNFT.deploy();

  await contract.deployed();

  console.log(`✅ PolisAgentNFT deployed successfully!`);
  console.log(`📍 Contract address: ${contract.address}`);
  console.log(`🔗 Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);

  // Get deployment details
  const deploymentTx = contract.deployTransaction;
  if (deploymentTx) {
    const receipt = await deploymentTx.wait();
    console.log(`📦 Transaction hash: ${receipt?.transactionHash}`);
    console.log(`⛽ Gas used: ${receipt?.gasUsed.toString()}`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "localhost",
    chainId: (await ethers.provider.getNetwork()).chainId,
    contractAddress: contract.address,
    deployerAddress: deployer.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = "./deployments.json";
  let deployments: any = {};

  if (fs.existsSync(deploymentPath)) {
    const data = fs.readFileSync(deploymentPath, "utf-8");
    deployments = JSON.parse(data);
  }

  deployments[process.env.HARDHAT_NETWORK || "localhost"] = deploymentInfo;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));

  console.log(`\n✨ Deployment info saved to deployments.json`);

  // Print explorer link
  const network = (await ethers.provider.getNetwork()).name;
  let explorerUrl = "";

  if (network.includes("sepolia")) {
    explorerUrl = `https://sepolia.arbiscan.io/address/${contract.address}`;
  } else if (network === "arbitrum") {
    explorerUrl = `https://arbiscan.io/address/${contract.address}`;
  } else if (network === "localhost" || network === "hardhat") {
    explorerUrl = "Local deployment - not on public explorer";
  }

  if (explorerUrl) {
    console.log(`\n🔍 View contract on explorer:`);
    console.log(`   ${explorerUrl}`);
  }

  // Print env setup instructions
  console.log(`\n📋 Add to .env.local for frontend:`);
  console.log(`   VITE_POLIS_NFT_CONTRACT=${contract.address}`);
  console.log(`   REACT_APP_POLIS_NFT_CHAIN_ID=${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`   REACT_APP_DEPLOYER_ADDRESS=${deployer.address}`);

  // For Arbitrum Sepolia, print helpful links
  if (network.includes("sepolia")) {
    console.log(`\n📚 Helpful Links:`);
    console.log(`   Contract Explorer: https://sepolia.arbiscan.io/address/${contract.address}`);
    console.log(`   Arbitrum Sepolia Docs: https://docs.arbitrum.io/for-devs/dev-node-intro`);
    console.log(`   Faucet: https://faucet.arbitrum.io/`);
  }

  console.log("\n✅ Deployment complete!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
