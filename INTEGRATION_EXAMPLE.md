/\*\*

- EXAMPLE: How to integrate AgentMintButton into agent detail page
-
- This is a reference implementation showing how to:
- 1.  Add the mint button to agent detail view
- 2.  Handle success/error states
- 3.  Update agent data after minting
- 4.  Display NFT status
      \*/

import { useState } from "react";
import { Agent } from "@/lib/polis-data";
import { AgentMintButton } from "@/components/polis/AgentMintButton";

interface AgentDetailExampleProps {
agent: Agent;
onUpdateAgent: (agent: Agent) => void;
}

/\*\*

- Example Agent Detail Component with NFT Minting
  \*/
  export function AgentDetailExample({
  agent,
  onUpdateAgent,
  }: AgentDetailExampleProps) {
  const [isMinting, setIsMinting] = useState(false);

const handleMintSuccess = (tokenId: number, txHash: string) => {
setIsMinting(false);

    // Update agent object with NFT data
    const updatedAgent: Agent = {
      ...agent,
      nftTokenId: tokenId,
      nftAddress: process.env.REACT_APP_POLIS_NFT_CONTRACT,
      nftMintedAt: Date.now(),
    };

    // Persist update
    onUpdateAgent(updatedAgent);

    // Optional: Log to analytics
    console.log(`✨ Agent ${agent.name} minted as NFT #${tokenId}`);

};

return (
<div className="space-y-6">
{/_ Basic Agent Info _/}
<div className="space-y-2">
<h1 className="text-2xl font-serif font-bold">{agent.name}</h1>
<p className="text-sm text-muted-foreground">{agent.philosophy}</p>
</div>

      {/* Agent Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded border hairline p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Influence
          </p>
          <p className="text-lg font-semibold">{agent.influence.toFixed(1)}</p>
        </div>
        <div className="rounded border hairline p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Faction
          </p>
          <p className="text-lg font-semibold">{agent.faction}</p>
        </div>
        <div className="rounded border hairline p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Ideology
          </p>
          <p className="text-lg font-semibold">{agent.ideology}</p>
        </div>
        <div className="rounded border hairline p-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Reputation
          </p>
          <p className="text-lg font-semibold">{agent.reputation.toFixed(1)}</p>
        </div>
      </div>

      {/* NFT Status Section */}
      <div className="rounded border hairline p-4 bg-muted/30">
        <h2 className="text-sm font-semibold uppercase tracking-widest mb-3">
          On-Chain Status
        </h2>

        {agent.nftMintedAt ? (
          // Agent already minted
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-amber text-lg">✓</span>
              <span className="text-sm">
                Minted as NFT on Arbitrum
              </span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <p>
                <strong>Token ID:</strong> {agent.nftTokenId}
              </p>
              <p>
                <strong>Contract:</strong>{" "}
                <code className="text-xs bg-background rounded px-1">
                  {agent.nftAddress?.slice(0, 10)}...{agent.nftAddress?.slice(-8)}
                </code>
              </p>
              <p>
                <strong>Minted:</strong>{" "}
                {new Date(agent.nftMintedAt).toLocaleDateString()}
              </p>
            </div>
            <a
              href={`https://sepolia.arbiscan.io/token/${agent.nftAddress}?a=${agent.nftTokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-text-xs text-amber hover:underline"
            >
              View on Arbiscan →
            </a>
          </div>
        ) : (
          // Agent not yet minted
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This agent is not yet a sovereign on-chain identity. Mint as NFT
              to establish permanent provenance on Arbitrum.
            </p>
            <AgentMintButton
              agent={agent}
              createdTurn={agent.createdTurn || 0}
              alreadyMinted={false}
              onMintSuccess={handleMintSuccess}
            />
          </div>
        )}
      </div>

      {/* Additional Agent Details */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest">
          Profile
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Temperament
            </p>
            <p className="font-medium">{agent.temperament}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Risk Tolerance
            </p>
            <p className="font-medium">{agent.riskTolerance}</p>
          </div>
        </div>
      </div>
    </div>

);
}

/\*\*

- INTEGRATION CHECKLIST:
-
- 1.  Import AgentMintButton in your agent detail route:
- ✓ import { AgentMintButton } from "@/components/polis/AgentMintButton"
-
- 2.  Add to your agent detail component:
- ✓ {!agent.nftMintedAt && <AgentMintButton {...props} />}
-
- 3.  Set environment variables in .env.local:
- ✓ REACT_APP_POLIS_NFT_CONTRACT=0x...
- ✓ REACT_APP_POLIS_NFT_CHAIN_ID=421614
- ✓ REACT_APP_DEPLOYER_ADDRESS=0x...
-
- 4.  Ensure MetaMask is installed:
- ✓ User needs MetaMask browser extension
- ✓ User needs testnet ETH in wallet
-
- 5.  Update agent state on successful mint:
- ✓ Call onUpdateAgent() with updated agent
- ✓ Set nftTokenId, nftAddress, nftMintedAt
-
- 6.  Test the flow:
- ✓ Click "MINT AGENT ON ARBITRUM" button
- ✓ Approve transaction in MetaMask
- ✓ Wait for confirmation
- ✓ See success modal
- ✓ Button changes to "Already Minted"
  \*/

/\*\*

- STATE MANAGEMENT PATTERN:
-
- Your agent state should include:
-
- interface Agent {
- id: string;
- name: string;
- ideology: string;
- faction: string;
- influence: number;
- reputation: number;
- temperament: string;
- riskTolerance: string;
- philosophy: string;
- createdTurn?: number;
-
- // NFT fields
- nftTokenId?: number; // ERC-721 token ID
- nftAddress?: string; // Contract address
- nftMintedAt?: number; // Timestamp in milliseconds
- }
  \*/

/\*\*

- FEED EVENT INTEGRATION:
-
- When user successfully mints, the system automatically:
-
- 1.  Calls mintAgentNFT() from minting service
- 2.  Returns tokenId, txHash, contractAddress
- 3.  Updates agent object
- 4.  Emits feed event (if integrated in turn engine):
- createAgentMintedEvent(name, id, tokenId, address, owner, turn)
- 5.  Feed event appears in timeline:
- 💎 "Agent Name Sovereignty Established On-Chain"
-
- You can also manually emit feed event on minting:
-
- const feedEvent = createAgentMintedEvent(
-     agent.name,
-     agent.id,
-     tokenId,
-     contractAddress,
-     ownerAddress,
-     state.turn
- );
- state.feed = [feedEvent, ...state.feed];
  \*/

/\*\*

- METADATA SNAPSHOT:
-
- When minting, the following data is captured:
-
- {
- agentName: "Aurelia Vex", // Name at mint time
- ideology: "Progressive", // Ideology at mint time
- faction: "Forward Party", // Faction at mint time
- influenceSnapshot: 85.5, // Influence at mint time
- createdTurn: 0, // When agent was created
- metadataURI: "ipfs://..." // Full metadata (future)
- }
-
- This snapshot is immutable on-chain but can be updated via
- updateAgentSnapshot() to keep NFT synced with agent evolution.
  \*/
