import { useEffect, useState } from "react";
import { ExternalLink, Gem, ShieldCheck, Sparkles } from "lucide-react";
import { buildAgentMetadata, type MintAgentNFTRequest } from "@/lib/use-nft-minting";
import { getBlockchainService } from "@/lib/blockchain-service";
import { ethers } from "ethers";
import { AgentAvatar } from "./AgentAvatar";
import { toast } from "sonner";
import type { Agent } from "@/lib/polis-data";

type MintRecord = {
  tokenId: number;
  txHash: string;
  contractAddress: string;
  ownerAddress: string;
  blockExplorerUrl: string;
  mintedAt: number;
};

const storageKey = (agentId: string) => `polis.nft.mint.${agentId}`;

function loadMint(agentId: string): MintRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(agentId));
    return raw ? (JSON.parse(raw) as MintRecord) : null;
  } catch {
    return null;
  }
}

function saveMint(agentId: string, record: MintRecord) {
  try {
    window.localStorage.setItem(storageKey(agentId), JSON.stringify(record));
  } catch {
    // ignore
  }
}

function shortHash(h?: string) {
  if (!h) return "—";
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

export function SovereignIdentity({
  agent,
  createdTurn = 31,
  compact = false,
}: {
  agent: Agent;
  createdTurn?: number;
  compact?: boolean;
}) {
  const [mint, setMint] = useState<MintRecord | null>(null);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    const seeded = agent.nftTokenId
      ? {
          tokenId: agent.nftTokenId,
          txHash: "",
          contractAddress: agent.nftAddress ?? "",
          ownerAddress: "",
          blockExplorerUrl: agent.nftAddress
            ? `https://sepolia.arbiscan.io/address/${agent.nftAddress}`
            : "https://sepolia.arbiscan.io",
          mintedAt: agent.nftMintedAt ?? Date.now(),
        }
      : null;
    setMint(loadMint(agent.id) ?? seeded);
  }, [agent.id, agent.nftTokenId, agent.nftAddress, agent.nftMintedAt]);

  const handleMint = async () => {
    setMinting(true);
    try {
      const meta = buildAgentMetadata(agent);
      const metadataURI = `data:application/json;base64,${typeof window !== "undefined" ? btoa(JSON.stringify(meta)) : ""}`;

      // Attempt to use BlockchainService + wallet signer if available
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum as any);
        const signer = await provider.getSigner();
        const owner = await signer.getAddress();

        const blockchainService = getBlockchainService(import.meta.env.VITE_POLIS_NFT_CONTRACT as string);
        await blockchainService.connectSigner(signer as any);

        const agentData = {
          agentName: agent.name,
          ideology: agent.ideology,
          faction: agent.faction,
          influenceSnapshot: agent.influence ?? 0,
          reputationSnapshot: agent.reputation ?? 0,
          createdTurn,
          metadataURI,
          traits: JSON.stringify(agent.personalityTraits ?? {}),
          cognitiveScores: JSON.stringify(agent.cognitiveScores ?? {}),
          governanceTendency: agent.governanceTendency ?? "",
          portraitUrl: agent.portraitUri ?? "",
        };

        const res = await blockchainService.mintAgentNFT(owner, agent.id, agentData as any);
        const record: MintRecord = {
          tokenId: res.tokenId,
          txHash: res.txHash,
          contractAddress: import.meta.env.VITE_POLIS_NFT_CONTRACT as string,
          ownerAddress: owner,
          blockExplorerUrl: blockchainService.getExplorerTxUrl(res.txHash),
          mintedAt: Date.now(),
        };

        saveMint(agent.id, record);
        setMint(record);
        toast.success("Sovereign identity anchored", {
          description: `${agent.name} · Token #${res.tokenId} on Arbitrum`,
        });
      } else {
        // Fallback to legacy mint endpoint (no signer)
        const req: MintAgentNFTRequest = {
          agentId: agent.id,
          agentName: agent.name,
          ideology: agent.ideology,
          faction: agent.faction,
          influenceSnapshot: agent.influence,
          createdTurn,
          metadataURI,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await (await import("@/lib/use-nft-minting")).mintAgentNFT(req as any);
        const record: MintRecord = { ...res, mintedAt: Date.now() };
        saveMint(agent.id, record);
        setMint(record);
        toast.success("Sovereign identity anchored", {
          description: `${agent.name} · Token #${res.tokenId} on Arbitrum`,
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mint failed";
      toast.error("Mint failed", { description: msg });
    } finally {
      setMinting(false);
    }
  };

  const isMinted = !!mint;

  return (
    <div className={`panel rounded-md ${compact ? "p-3" : "p-4 md:p-5"} relative overflow-hidden`}>
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber" /> Sovereign Identity
          </div>
          {isMinted ? (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber/40 bg-amber/5 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-amber">
              <ShieldCheck className="h-3 w-3" /> On-Chain Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-silver/30 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
              Unanchored
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start gap-3">
          <AgentAvatar agent={agent} size={compact ? 40 : 56} />
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[15px] leading-tight">{agent.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">
              {agent.ideology}
            </p>
            {isMinted && mint ? (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                <div>
                  Token ID <span className="text-amber tabular-nums">#{mint.tokenId}</span>
                </div>
                <div>
                  Network <span className="text-cyan">Arbitrum</span>
                </div>
                <div className="col-span-2">
                  Minted{" "}
                  <span className="text-foreground/85">
                    {new Date(mint.mintedAt).toLocaleString()}
                  </span>
                </div>
                {mint.txHash ? (
                  <div className="col-span-2 truncate">
                    Tx <span className="text-foreground/70">{shortHash(mint.txHash)}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-[11.5px] text-foreground/70 leading-relaxed">
                Minting creates a permanent sovereign identity record for this political actor on
                Arbitrum.
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          {isMinted ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-cyan/30 bg-cyan/5 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-cyan">
                ◆ Arbitrum
              </span>
              {mint?.blockExplorerUrl ? (
                <a
                  href={mint.blockExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-sm border hairline bg-background/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                >
                  Explorer <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              onClick={handleMint}
              disabled={minting}
              className="ml-auto inline-flex items-center gap-2 rounded-sm bg-amber px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Gem className="h-3.5 w-3.5" />
              {minting ? "Anchoring…" : "Anchor Identity On-Chain"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function useMintedTokenId(agentId: string): number | null {
  const [tokenId, setTokenId] = useState<number | null>(null);
  useEffect(() => {
    const r = loadMint(agentId);
    setTokenId(r?.tokenId ?? null);
  }, [agentId]);
  return tokenId;
}
