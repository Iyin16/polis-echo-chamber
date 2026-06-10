import { useState } from "react";
import { Gem, Loader2 } from "lucide-react";
import { mintAgentNFT, buildAgentMetadata, type MintAgentNFTRequest } from "@/lib/use-nft-minting";
import { MintResultModal, MintErrorModal } from "./MintModals";

interface AgentMintButtonProps {
  agent: {
    id: string;
    name: string;
    ideology: string;
    faction: string;
    influence: number;
    reputation: number;
    temperament: string;
    riskTolerance: string;
    philosophy: string;
  };
  createdTurn: number;
  alreadyMinted?: boolean;
  onMintSuccess?: (tokenId: number, txHash: string) => void;
}

/**
 * Button to mint an agent as an NFT on Arbitrum
 */
export function AgentMintButton({
  agent,
  createdTurn,
  alreadyMinted = false,
  onMintSuccess,
}: AgentMintButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [result, setResult] = useState<{
    tokenId: number;
    txHash: string;
    blockExplorerUrl: string;
    contractAddress: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    try {
      setIsMinting(true);
      setError(null);

      // Build metadata
      const metadata = buildAgentMetadata(agent);
      const metadataJson = JSON.stringify(metadata);
      // In production, upload to IPFS and get URI
      // For now, use placeholder
      const metadataURI = "ipfs://QmPlaceholder";

      const request: MintAgentNFTRequest = {
        agentId: agent.id,
        agentName: agent.name,
        ideology: agent.ideology,
        faction: agent.faction,
        influenceSnapshot: agent.influence,
        createdTurn,
        metadataURI,
      };

      const mintResult = await mintAgentNFT(request);

      setResult({
        tokenId: mintResult.tokenId,
        txHash: mintResult.txHash,
        blockExplorerUrl: mintResult.blockExplorerUrl,
        contractAddress: mintResult.contractAddress,
      });

      if (onMintSuccess) {
        onMintSuccess(mintResult.tokenId, mintResult.txHash);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };

  if (alreadyMinted) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border hairline bg-muted text-muted-foreground text-xs uppercase tracking-widest cursor-not-allowed opacity-50"
      >
        <Gem className="h-3.5 w-3.5" />
        Already Minted
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleMint}
        disabled={isMinting}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border hairline bg-amber text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition text-xs uppercase tracking-widest font-medium"
      >
        {isMinting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Minting...
          </>
        ) : (
          <>
            <Gem className="h-3.5 w-3.5" />
            Mint NFT on Arbitrum
          </>
        )}
      </button>

      {result && (
        <MintResultModal
          tokenId={result.tokenId}
          txHash={result.txHash}
          blockExplorerUrl={result.blockExplorerUrl}
          contractAddress={result.contractAddress}
          agentName={agent.name}
          onClose={() => setResult(null)}
        />
      )}

      {error && <MintErrorModal error={error} onClose={() => setError(null)} />}
    </>
  );
}
