import React, { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { CHAINSCAN_URL, GALILEO_CHAIN_ID, AGENTIC_CONTRACT_ADDRESS } from "@/lib/chain";

type Props = {
  latestTxHash?: string | null;
  latestRootHash?: string | null;
};

export default function ChainStatus({ latestTxHash, latestRootHash }: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const eth = (window as any).ethereum;
        if (!eth) {
          if (mounted) setHasWallet(false);
          return;
        }
        if (mounted) setHasWallet(true);
        const provider = new BrowserProvider(eth as any);
        const accounts = await provider.listAccounts();
        if (!mounted) return;
        const first = accounts?.[0];
        setAddress(typeof first === "string" ? first : (first?.address ?? null));
        const net = await provider.getNetwork();
        if (!mounted) return;
        setChainId(net?.chainId ? Number(net.chainId) : null);
        setNetworkName(net?.name ?? null);
        eth.on?.("accountsChanged", (accs: string[]) => {
          setAddress(accs?.[0] ?? null);
        });
        eth.on?.("chainChanged", async () => {
          const n = await provider.getNetwork();
          setChainId(n?.chainId ? Number(n.chainId) : null);
          setNetworkName(n?.name ?? null);
        });
      } catch {
        // ignore
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const connectWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    setConnecting(true);
    try {
      await eth.request({ method: "eth_requestAccounts" });
      const provider = new BrowserProvider(eth as any);
      const accounts = await provider.listAccounts();
      const first = accounts?.[0];
      setAddress(typeof first === "string" ? first : (first?.address ?? null));
      const net = await provider.getNetwork();
      setChainId(net?.chainId ? Number(net.chainId) : null);
      setNetworkName(net?.name ?? null);
      setHasWallet(true);
    } catch {
      // ignore
    } finally {
      setConnecting(false);
    }
  };

  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedRoot, setCopiedRoot] = useState(false);

  const copyText = async (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      window.setTimeout(() => setter(false), 1200);
    } catch {
      // ignore clipboard errors
    }
  };

  const connected = Boolean(address);
  const galileoOk = chainId === GALILEO_CHAIN_ID;

  return (
    <div className="p-3 border rounded-md bg-surface">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Chain</div>
          <div className="text-xs font-mono text-muted-foreground">{networkName ?? "unknown"}</div>
          <div className={`text-xs font-mono ${galileoOk ? "text-green-400" : "text-amber-400"}`}>
            {galileoOk ? "Galileo Testnet" : "Other"}
          </div>
        </div>
        <div className="text-right text-xs">
          {connected ? (
            <div className="font-medium break-words">{address}</div>
          ) : hasWallet ? (
            <button
              type="button"
              onClick={connectWallet}
              className="font-mono text-[11px] text-accent underline hover:text-foreground"
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          ) : (
            <div className="text-muted-foreground">No wallet detected</div>
          )}
          <div className="font-mono text-[11px] text-muted-foreground">
            Chain ID: {chainId ?? "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div>
          <div className="text-[11px] text-muted-foreground">Latest tx</div>
          {latestTxHash ? (
            <div className="flex items-center gap-2">
              <a
                className="text-accent underline"
                href={`${CHAINSCAN_URL}/tx/${latestTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                {latestTxHash.slice(0, 12)}...
              </a>
              <button
                type="button"
                onClick={() => copyText(latestTxHash, setCopiedTx)}
                className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copiedTx ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>

        <div>
          <div className="text-[11px] text-muted-foreground">Latest 0G root</div>
          {latestRootHash ? (
            <div className="flex items-center gap-2">
              <span className="text-foreground">{latestRootHash.slice(0, 12)}...</span>
              <button
                type="button"
                onClick={() => copyText(latestRootHash, setCopiedRoot)}
                className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
              >
                {copiedRoot ? "Copied" : "Copy"}
              </button>
            </div>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>

        <div>
          <div className="text-[11px] text-muted-foreground">Contract</div>
          <a
            className="text-accent underline text-[12px]"
            href={`${CHAINSCAN_URL}/address/${AGENTIC_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {AGENTIC_CONTRACT_ADDRESS.slice(0, 12)}...
          </a>
        </div>
      </div>
    </div>
  );
}
