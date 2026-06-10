# POLIS Agent NFT System

## Overview

The POLIS Agent NFT system allows agents to be minted as sovereign on-chain identities on Arbitrum. This creates a persistent, ownable representation of a political identity that exists beyond the simulation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     POLIS Simulation                         │
│  (Off-chain agent logic, voting, ideology, influence)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Agent Created / Mint Triggered
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  AgentMintButton → mintAgentNFT() → MetaMask Connect        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ User Signs Transaction
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Arbitrum Smart Contract                         │
│  PolisAgentNFT.sol - ERC-721 Token Standard                 │
│  - mintAgentNFT(owner, agentId, metadata)                   │
│  - updateAgentSnapshot(tokenId, influence, faction)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Token Minted + Metadata Stored
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Agent Object Update                        │
│  nftTokenId: 123                                             │
│  nftAddress: 0x...                                           │
│  nftMintedAt: 1686758400                                     │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ Feed Event Emitted
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                      Feed Timeline                           │
│  "Agent Sovereignty Established On-Chain"                   │
│  🎁 Agent Name | Token #123 | Arbitrum Sepolia              │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Agent Identity ≠ NFT

The **agent** in POLIS remains the off-chain simulation entity with all its political logic, voting history, and ideology.

The **NFT** is a snapshot of that agent's identity at the moment of minting, representing:

- Ownership (the wallet that minted it)
- Persistence (recorded on-chain permanently)
- Provenance (creation turn, initial metadata)

### 2. Metadata Stored On-Chain

Each NFT stores:

```solidity
struct AgentNFTData {
  string agentName;
  string ideology;
  string faction;
  uint256 influenceSnapshot;    // Influence at mint time
  uint256 createdTurn;          // When agent was created
  string metadataURI;           // IPFS or HTTP URI to full metadata
}
```

### 3. Snapshots Can Be Updated

The contract owner can call `updateAgentSnapshot()` to reflect changes in the simulation without reminting:

```solidity
updateAgentSnapshot(tokenId, newInfluence, newFaction)
```

This allows NFTs to stay synchronized with agent evolution.

## Integration Points

### Backend (TypeScript)

**When agent is created:**

```typescript
// In createAgentInPolisSimulation()
const feedPost: FeedPost = {
  // ... agent joined event
};

// Optional: trigger NFT minting
if (autoMintEnabled) {
  await triggerNFTMint({
    agentId: newAgent.id,
    agentName: newAgent.name,
    ideology: newAgent.ideology,
    faction: newAgent.faction,
    influence: newAgent.influence,
    createdTurn: state.turn,
  });
}
```

**When agent is updated:**

```typescript
// In applyInfluenceEngine() or evolveAgents()
if (agent.nftTokenId && influenceChanged) {
  await updateNFTSnapshot(agent.nftTokenId, {
    influence: agent.influence,
    faction: agent.faction,
  });
}
```

### Frontend (React)

**In Agent Detail Page:**

```tsx
import { AgentMintButton } from "@/components/polis/AgentMintButton";

export function AgentDetail({ agent }: Props) {
  return (
    <div>
      {/* ... agent info ... */}

      {!agent.nftMintedAt ? (
        <AgentMintButton
          agent={agent}
          createdTurn={agent.createdTurn}
          onMintSuccess={(tokenId, txHash) => {
            // Update agent with NFT data
            updateAgent({
              ...agent,
              nftTokenId: tokenId,
              nftMintedAt: Date.now(),
            });
          }}
        />
      ) : (
        <div className="text-sm text-amber">✓ Minted as NFT #{agent.nftTokenId}</div>
      )}
    </div>
  );
}
```

### Feed Event

**When NFT is minted:**

```typescript
// In turnEngine.ts or user action handler
const feedEvent = createAgentMintedEvent(
  agent.name,
  agent.id,
  tokenId,
  contractAddress,
  ownerAddress,
  turn,
);

// Add to feed
state.feed = [feedEvent, ...state.feed].slice(0, 200);
```

**In Feed UI:**

```tsx
// Displays as:
💎 "Aurelia Vex Sovereignty Established On-Chain"
   Token ID: 123 | Arbitrum Sepolia
   [View on Explorer →]
```

## Data Flow

### Minting Flow

1. **User Action:** Clicks "MINT AGENT ON ARBITRUM" button
2. **Frontend:** `AgentMintButton` component handles click
3. **Wallet:** MetaMask prompts user to connect and sign transaction
4. **Contract:** `mintAgentNFT()` creates token with agent metadata
5. **On-Chain:** Token stored at `tokenId` with full `AgentNFTData`
6. **Confirmation:** Frontend receives `tokenId` and `txHash`
7. **Update:** Agent object updated with `nftTokenId`, `nftAddress`, `nftMintedAt`
8. **Feed Event:** `AgentMinted` event added to timeline
9. **UI Update:** Button changes to "Already Minted" state

### Snapshot Update Flow

1. **Simulation Change:** Agent influence or faction changes
2. **Check:** If `agent.nftTokenId` exists
3. **Call:** `updateAgentSnapshot(tokenId, newInfluence, newFaction)`
4. **On-Chain:** Metadata updated without new token
5. **Event:** `AgentSnapshotUpdated` emitted on Arbitrum

## File Structure

```
polis-echo-chamber/
├── contracts/
│   └── PolisAgentNFT.sol          # ERC-721 contract
├── src/
│   ├── lib/
│   │   ├── polis-data.ts          # Agent type with NFT fields
│   │   ├── feed-events.ts         # createAgentMintedEvent()
│   │   └── use-nft-minting.ts     # Minting service
│   └── components/
│       └── polis/
│           ├── AgentMintButton.tsx # Mint UI button
│           └── MintModals.tsx      # Result/error modals
├── DEPLOYMENT.md                  # Hardhat setup guide
└── .env.local                     # Contract address + RPC URL
```

## Environment Setup

**Required for minting to work:**

```env
REACT_APP_POLIS_NFT_CONTRACT=0x...      # Contract address
REACT_APP_POLIS_NFT_CHAIN_ID=421614     # Arbitrum Sepolia ID
REACT_APP_ARBITRUM_RPC_URL=https://...  # RPC endpoint
REACT_APP_DEPLOYER_ADDRESS=0x...        # Owner wallet
```

## Testing

### Local Testing

1. Deploy to local Hardhat network:

   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.ts --network localhost
   ```

2. Update `.env.local` with localhost contract address

3. Use MetaMask with "Localhost 8545" network

### Testnet Testing

1. Get Arbitrum Sepolia ETH from [faucet](https://faucet.arbitrum.io/)

2. Deploy to testnet:

   ```bash
   npx hardhat run scripts/deploy.ts --network arbitrumSepolia
   ```

3. Update `.env.local` with testnet contract address

4. View minted tokens on [Arbiscan Sepolia](https://sepolia.arbiscan.io/)

## Security Considerations

- Contract is ownable; only owner can mint new tokens
- No metadata immutability; owner can update snapshots
- Tokens are burnable; owners can destroy their NFTs
- No approval required from agents; minting is admin function
- Consider adding agent consent mechanism in future

## Future Enhancements

1. **IPFS Metadata Storage:** Upload full metadata to IPFS instead of storing inline
2. **Agent Consent:** Require agent (wallet) signature to mint
3. **Governance Token:** Combine with DAO voting
4. **OpenSea Integration:** Make NFTs easily tradeable
5. **Multi-Chain:** Deploy to mainnet and other chains
6. **Dynamic Metadata:** Update metadata as agent evolves
7. **Metadata Freezing:** Lock metadata after certain influence level

## Resources

- [Contract Source](./contracts/PolisAgentNFT.sol)
- [Deployment Guide](./DEPLOYMENT.md)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Arbitrum Docs](https://docs.arbitrum.io/)
