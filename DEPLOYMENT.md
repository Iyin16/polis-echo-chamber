# POLIS Agent NFT Deployment Guide

## Overview

The PolisAgentNFT contract is an ERC-721 smart contract deployed on **Arbitrum Sepolia testnet** that allows agents to be minted as sovereign on-chain identities.

## Contract Details

**Contract:** `PolisAgentNFT.sol`

- **Network:** Arbitrum Sepolia (testnet)
- **Standard:** ERC-721 (Non-Fungible Tokens)
- **Features:** Token URI storage, burnable, ownable

### Key Functions

- `mintAgentNFT(address to, string polisAgentId, AgentNFTData data)` - Mint new agent NFT
- `getAgentData(uint256 tokenId)` - Get agent data for token
- `updateAgentSnapshot(uint256 tokenId, uint256 newInfluence, string newFaction)` - Update agent metadata
- `getTokenIdForAgent(string polisAgentId)` - Look up token by agent ID
- `totalAgentsMinted()` - Get total minted agents

## Deployment Steps

### 1. Prerequisites

Install dependencies:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts ethers
```

### 2. Create Hardhat Project (if not exists)

```bash
npx hardhat init
```

### 3. Configure Hardhat for Arbitrum Sepolia

Create/update `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arbitrumSepolia: {
      url: process.env.ARB_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 421614,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    },
  },
};

export default config;
```

### 4. Create Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PolisAgentNFT...");

  const PolisAgentNFT = await ethers.getContractFactory("PolisAgentNFT");
  const contract = await PolisAgentNFT.deploy();

  await contract.deployed();

  console.log(`PolisAgentNFT deployed to: ${contract.address}`);
  console.log(`View on Arbiscan: https://sepolia.arbiscan.io/address/${contract.address}`);

  // Save to env for frontend
  console.log(`\nAdd to .env.local:`);
  console.log(`REACT_APP_POLIS_NFT_CONTRACT=${contract.address}`);
  console.log(`REACT_APP_POLIS_NFT_CHAIN_ID=421614`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

### 5. Set Environment Variables

Create `.env` in project root:

```
ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
DEPLOYER_PRIVATE_KEY=your_private_key_here
ARBISCAN_API_KEY=your_arbiscan_api_key_here
```

**IMPORTANT:** Never commit `.env` to version control. Add to `.gitignore`.

### 6. Deploy Contract

```bash
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
```

Save the contract address to `.env.local` in the frontend:

```
REACT_APP_POLIS_NFT_CONTRACT=0x...
REACT_APP_POLIS_NFT_CHAIN_ID=421614
REACT_APP_DEPLOYER_ADDRESS=0x...
```

### 7. Verify Contract (Optional)

```bash
npx hardhat verify --network arbitrumSepolia <CONTRACT_ADDRESS>
```

## Frontend Integration

### Environment Variables

Add to `.env.local`:

```
REACT_APP_POLIS_NFT_CONTRACT=0xYourContractAddress
REACT_APP_POLIS_NFT_CHAIN_ID=421614
REACT_APP_DEPLOYER_ADDRESS=0xYourDeployerAddress
REACT_APP_ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

### Contract ABI

Save the contract ABI to `src/lib/abis/PolisAgentNFT.json` for use with ethers.js:

```json
[
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "polisAgentId", "type": "string" },
      {
        "name": "data",
        "type": "tuple",
        "components": [
          { "name": "agentName", "type": "string" },
          { "name": "ideology", "type": "string" },
          { "name": "faction", "type": "string" },
          { "name": "influenceSnapshot", "type": "uint256" },
          { "name": "createdTurn", "type": "uint256" },
          { "name": "metadataURI", "type": "string" }
        ]
      }
    ],
    "name": "mintAgentNFT",
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]
```

### Minting Flow

1. User clicks "MINT AGENT ON ARBITRUM" button
2. Frontend calls `mintAgentNFT()` hook
3. Hook connects to MetaMask (window.ethereum)
4. User approves transaction in wallet
5. Contract mints NFT with agent metadata
6. Feed event emitted: `AgentMinted`
7. Agent object updated with `nftTokenId`, `nftAddress`, `nftMintedAt`

## Testing

### Local Hardhat Network

```bash
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

### Testnet Testing

1. Get Arbitrum Sepolia ETH from faucet:
   - https://faucet.arbitrum.io/

2. Deploy to testnet:

   ```bash
   npx hardhat run scripts/deploy.ts --network arbitrumSepolia
   ```

3. Interact via Arbiscan:
   - https://sepolia.arbiscan.io/

## Production Deployment

For mainnet deployment:

1. Update `hardhat.config.ts` with Arbitrum One network
2. Deploy with mainnet RPC
3. Update frontend `.env.production` with mainnet contract address

## Resources

- [OpenZeppelin ERC-721 Docs](https://docs.openzeppelin.com/contracts/4.x/erc721)
- [Arbitrum Sepolia Testnet](https://docs.arbitrum.io/for-devs/dev-node-intro)
- [Hardhat Docs](https://hardhat.org/docs)
- [Ethers.js Docs](https://docs.ethers.org/)

## Notes

- Contract owner can call `mintAgentNFT()` to create new tokens
- Each agent can be minted only once (tracked by `agentIdToTokenId`)
- Snapshots can be updated via `updateAgentSnapshot()` without reminting
- Contract is burnable (owners can burn their tokens)

## Removing committed .env files

If an `.env` file was accidentally committed, stop tracking it and push the change. This does not remove it from repository history.

1) Stop tracking and remove from latest commit:

```bash
git rm --cached .env
git commit -m "Remove committed .env and ignore it"
git push
```

2) If the secret was pushed and you need to remove it from the repository history, use the BFG Repo-Cleaner (recommended):

```bash
# install bfg, then
bfg --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Alternatively, use `git filter-branch` (slower and more complex). After cleaning history, rotate any exposed secrets (change API keys, revoke private keys).
