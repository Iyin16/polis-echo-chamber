import { useState } from "react";
import { AgentMintButton } from "./AgentMintButton";
import { ArrowUpRight, Check, AlertCircle } from "lucide-react";

interface MintResultModalProps {
  tokenId: number;
  txHash: string;
  blockExplorerUrl: string;
  contractAddress: string;
  agentName: string;
  onClose: () => void;
}

/**
 * Modal showing successful NFT mint result
 */
export function MintResultModal({
  tokenId,
  txHash,
  blockExplorerUrl,
  contractAddress,
  agentName,
  onClose,
}: MintResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border hairline bg-background p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-amber/10 flex items-center justify-center">
            <Check className="h-5 w-5 text-amber" />
          </div>
          <h2 className="text-xl font-serif font-semibold">Sovereignty Established</h2>
        </div>

        <p className="text-sm text-foreground/80 mb-5">
          {agentName} is now a sovereign on-chain entity on Arbitrum.
        </p>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">
              Token ID
            </p>
            <code className="text-sm font-mono bg-muted rounded px-2 py-1 text-foreground">
              {tokenId}
            </code>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">
              Contract
            </p>
            <code className="text-xs font-mono bg-muted rounded px-2 py-1 text-foreground break-all">
              {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
            </code>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">
              Transaction
            </p>
            <a
              href={blockExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-amber hover:underline flex items-center gap-1"
            >
              {txHash.slice(0, 16)}...
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-sm border hairline bg-foreground text-background hover:opacity-90 transition text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * Modal showing mint error
 */
export function MintErrorModal({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border hairline bg-background p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-crimson/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-crimson" />
          </div>
          <h2 className="text-xl font-serif font-semibold">Mint Failed</h2>
        </div>

        <p className="text-sm text-foreground/80 mb-5">{error}</p>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-sm border hairline bg-foreground text-background hover:opacity-90 transition text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
