import { BrowserProvider, Contract } from "ethers";
import { getAgentId } from "./agent-id";
import { archiveGovernanceMemory } from "./0g-storage";

const CONTRACT_ADDRESS = "0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F";

// Minimal ABI fragments used for optimistic interaction. If the real contract
// differs, the helper falls back to a simulated registration to keep UX responsive.
const ABI = [
  "function registerAgent(bytes32 metadataHash) external returns (bytes32)",
  "function getAgent(bytes32 id) view external returns (address owner, bytes32 metadataHash)",
];

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function computeAgentMetadataHash(agent: { id?: string; name: string; slug: string }) {
  const payload = JSON.stringify({
    id: agent.id ?? null,
    name: agent.name,
    slug: agent.slug,
    ts: Date.now(),
  });
  return sha256Hex(payload);
}

export async function registerAgenticOnChain(
  agent: { id?: string; name: string; slug: string },
  signerProvider?: any,
) {
  try {
    const agenticId = getAgentId(agent as any);
    const metadataHash = await computeAgentMetadataHash(agent);

    // If no provider passed, try to use window.ethereum
    const provider =
      signerProvider ??
      (typeof window !== "undefined" && (window as any).ethereum
        ? new BrowserProvider((window as any).ethereum)
        : null);

    if (!provider) {
      // Simulate registration for environments without wallet
      const simulatedTx = {
        success: true,
        simulated: true,
        agenticId,
        metadataHash,
        txHash: `0x_sim_${metadataHash.slice(0, 8)}`,
      };

      // Archive the metadata hash to 0G for persistence (non-blocking)
      archiveGovernanceMemory({ agenticId, metadataHash, simulated: true }).catch(() => null);

      return simulatedTx;
    }

    const signer = await (provider as BrowserProvider).getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);

    // Attempt to call registerAgent; if ABI mismatch or revert occurs, catch and fallback
    try {
      const tx = await contract.registerAgent(`0x${metadataHash}`);
      const receipt = await tx.wait?.();
      const txHash = tx.hash ?? receipt?.transactionHash ?? null;

      // Archive the metadata hash to 0G with the txHash
      const archiveResult = await archiveGovernanceMemory({ agenticId, metadataHash, txHash });

      // persist lightweight history to localStorage for demo tracing
      try {
        const rec = {
          ts: Date.now(),
          metadataHash,
          rootHash: archiveResult?.rootHash ?? null,
          txHash: txHash ?? null,
          simulated: false,
        };
        const key = `agentic-history:${agenticId}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.unshift(rec);
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
      } catch (e) {
        // ignore storage errors
      }

      return { success: true, simulated: false, agenticId, metadataHash, txHash, archiveResult };
    } catch (err) {
      // Fallback simulation on contract call failure
      const simulatedTx = {
        success: false,
        simulated: true,
        error: String(err),
        agenticId,
        metadataHash,
        txHash: `0x_sim_${metadataHash.slice(0, 8)}`,
      };

      const archiveRes = await archiveGovernanceMemory({
        agenticId,
        metadataHash,
        simulated: true,
        error: String(err),
      }).catch(() => null);
      try {
        const rec = {
          ts: Date.now(),
          metadataHash,
          rootHash: archiveRes?.rootHash ?? null,
          txHash: simulatedTx.txHash,
          simulated: true,
          error: String(err),
        };
        const key = `agentic-history:${agenticId}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        existing.unshift(rec);
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
      } catch (e) {}
      return simulatedTx;
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function checkAgenticRegistration(
  agent: { id?: string; name: string; slug: string },
  provider?: any,
) {
  try {
    const agenticId = getAgentId(agent as any);
    const metadataHash = await computeAgentMetadataHash(agent);

    const webProvider =
      provider ??
      (typeof window !== "undefined" && (window as any).ethereum
        ? new BrowserProvider((window as any).ethereum)
        : null);
    if (!webProvider) return { registered: false, agenticId };

    const contract = new Contract(CONTRACT_ADDRESS, ABI, webProvider);

    try {
      // optimistic: if getAgent exists, use it; otherwise return unknown
      const res = await contract.getAgent(`0x${metadataHash}`);
      return { registered: !!res, agenticId, metadataHash, owner: res?.owner ?? null };
    } catch (err) {
      return { registered: false, agenticId };
    }
  } catch (error) {
    return { registered: false, error: String(error) };
  }
}

export function getAgenticHistory(agenticId: string) {
  try {
    const key = `agentic-history:${agenticId}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}

export function isAgenticRegistered(agenticId: string) {
  return getAgenticHistory(agenticId).some((entry: any) => entry?.simulated === false);
}
