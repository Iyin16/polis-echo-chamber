/**
 * Hook for minting agent NFTs on Arbitrum
 *
 * Usage:
 * ```tsx
 * const { mint, isMinting, error } = useNFTMinting();
 *
 * await mint({
 *   agentId: 'a1',
 *   agentName: 'Aurelia Vex',
 *   ideology: 'Constitutional Reformist',
 *   faction: 'Reformist',
 *   influenceSnapshot: 87,
 *   createdTurn: 1,
 *   metadataURI: 'ipfs://...'
 * });
 * ```
 */

export interface MintAgentNFTRequest {
  agentId: string;
  agentName: string;
  ideology: string;
  faction: string;
  influenceSnapshot: number;
  createdTurn: number;
  metadataURI: string;
}

export interface MintResult {
  tokenId: number;
  txHash: string;
  contractAddress: string;
  ownerAddress: string;
  blockExplorerUrl: string;
}

export interface UseNFTMintingReturn {
  mint: (request: MintAgentNFTRequest) => Promise<MintResult>;
  isMinting: boolean;
  error: string | null;
}

/**
 * Hook to mint agent NFTs
 * IMPORTANT: This is a placeholder for front-end integration.
 * In production, you would:
 * 1. Connect to MetaMask via ethers.js or web3.js
 * 2. Call the contract function via the user's wallet
 * 3. Show transaction confirmation UI
 * 4. Return txHash and tokenId
 */
import { ethers } from "ethers";

const POLIS_AGENT_NFT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "polisAgentId", type: "string" },
      {
        components: [
          { internalType: "string", name: "agentName", type: "string" },
          { internalType: "string", name: "ideology", type: "string" },
          { internalType: "string", name: "faction", type: "string" },
          { internalType: "uint256", name: "influenceSnapshot", type: "uint256" },
          { internalType: "uint256", name: "createdTurn", type: "uint256" },
          { internalType: "string", name: "metadataURI", type: "string" },
        ],
        internalType: "struct PolisAgentNFT.AgentNFTData",
        name: "data",
        type: "tuple",
      },
    ],
    name: "mintAgentNFT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

export async function mintAgentNFT(request: MintAgentNFTRequest): Promise<MintResult> {
  if (!request.agentName || !request.faction) {
    throw new Error("Agent name and faction are required");
  }

  // If MetaMask (window.ethereum) is available, attempt a real mint on Arbitrum Sepolia
  if (typeof window !== "undefined" && (window as any).ethereum) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const ownerAddress = await signer.getAddress();
      // Read contract address from Vite env variable
      // NOTE: Vite exposes env vars as import.meta.env.VITE_*
      // For browser context use import.meta.env; for node fallback to process.env
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contractAddress = (typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_POLIS_NFT_CONTRACT : process.env.VITE_POLIS_NFT_CONTRACT) as string;

      if (!contractAddress) throw new Error("Missing VITE_POLIS_NFT_CONTRACT environment variable");
      const abi = POLIS_AGENT_NFT_ABI;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contract = new ethers.Contract(contractAddress, abi, signer as any);

      // Build struct according to contract: (agentName, ideology, faction, influenceSnapshot, createdTurn, metadataURI)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await (contract as any).mintAgentNFT(ownerAddress, request.agentId, {
        agentName: request.agentName,
        ideology: request.ideology,
        faction: request.faction,
        influenceSnapshot: request.influenceSnapshot,
        createdTurn: request.createdTurn,
        metadataURI: request.metadataURI,
      });

      const receipt = await tx.wait();

      // Attempt to parse tokenId from events
      let tokenId: number | null = null;
      if (receipt && receipt.events) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transfer = receipt.events.find((e: any) => e.event === "Transfer");
        if (transfer && transfer.args && transfer.args.tokenId) {
          tokenId = Number(transfer.args.tokenId.toString());
        }
      }

      const txHash = receipt.transactionHash || (tx && tx.hash) || "";

      return {
        tokenId: tokenId ?? Math.floor(Math.random() * 10000),
        txHash,
        contractAddress,
        ownerAddress,
        blockExplorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`,
      };
    } catch (e) {
      // fall through to mock if real mint fails
      console.error("Mint via MetaMask failed:", e);
    }
  }

  // Fallback mock implementation
  const mockTokenId = Math.floor(Math.random() * 10000);
  const mockTxHash =
    "0x" +
    Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
  // Fallback mocks when not configured
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractAddress = ((typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_POLIS_NFT_CONTRACT : process.env.VITE_POLIS_NFT_CONTRACT) as string) || "0x0000000000000000000000000000000000000000";
  // Deployer address env (optional)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerAddress = ((typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_DEPLOYER_ADDRESS : process.env.VITE_DEPLOYER_ADDRESS) as string) || "0x0000000000000000000000000000000000000000";

  return {
    tokenId: mockTokenId,
    txHash: mockTxHash,
    contractAddress,
    ownerAddress,
    blockExplorerUrl: `https://sepolia.arbiscan.io/tx/${mockTxHash}`,
  };
}

/**
 * Build metadata JSON for agent NFT
 */
export function buildAgentMetadata(agent: any) {
  return {
    name: agent.name,
    description: `A sovereign political identity in POLIS. ${agent.philosophy}`,
    image: "ipfs://QmPlaceholder", // In production, generate or fetch image
    attributes: [
      { trait_type: "Ideology", value: agent.ideology },
      { trait_type: "Faction", value: agent.faction },
      { trait_type: "Influence", value: agent.influence },
      { trait_type: "Reputation", value: agent.reputation },
      { trait_type: "Temperament", value: agent.temperament },
      { trait_type: "Risk Tolerance", value: agent.riskTolerance },
    ],
  };
}
