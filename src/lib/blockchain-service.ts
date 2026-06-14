/**
 * Blockchain Service Layer
 * 
 * Centralized service for all interactions with the PolisAgentNFT contract
 * Uses Alchemy RPC endpoints for reliable blockchain access
 * Supports both read operations and contract calls via connected wallet
 * 
 * Environment Requirements:
 * - ALCHEMY_API_KEY: Alchemy API key for Arbitrum Sepolia
 * - ARBITRUM_RPC_URL: Alternative RPC URL (defaults to Alchemy if not set)
 */

import { ethers } from "ethers";

// Contract ABI for PolisAgentNFT
const POLIS_AGENT_NFT_ABI = [
  // Read-only functions
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getAgentData",
    outputs: [
      {
        components: [
          { internalType: "string", name: "agentName", type: "string" },
          { internalType: "string", name: "ideology", type: "string" },
          { internalType: "string", name: "faction", type: "string" },
          { internalType: "uint256", name: "influenceSnapshot", type: "uint256" },
          { internalType: "uint256", name: "reputationSnapshot", type: "uint256" },
          { internalType: "uint256", name: "createdTurn", type: "uint256" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "traits", type: "string" },
          { internalType: "string", name: "cognitiveScores", type: "string" },
          { internalType: "string", name: "governanceTendency", type: "string" },
          { internalType: "string", name: "portraitUrl", type: "string" },
        ],
        internalType: "struct PolisAgentNFT.AgentNFTData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "polisAgentId", type: "string" }],
    name: "getTokenIdForAgent",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getAgentIdForToken",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getAgentOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getTokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAgentsMinted",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions (require wallet signature)
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
          { internalType: "uint256", name: "reputationSnapshot", type: "uint256" },
          { internalType: "uint256", name: "createdTurn", type: "uint256" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "string", name: "traits", type: "string" },
          { internalType: "string", name: "cognitiveScores", type: "string" },
          { internalType: "string", name: "governanceTendency", type: "string" },
          { internalType: "string", name: "portraitUrl", type: "string" },
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
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "newInfluence", type: "uint256" },
      { internalType: "uint256", name: "newReputation", type: "uint256" },
      { internalType: "string", name: "newFaction", type: "string" },
    ],
    name: "updateAgentSnapshot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "turn", type: "uint256" },
      { internalType: "uint256", name: "influenceSnapshot", type: "uint256" },
      { internalType: "uint256", name: "reputationSnapshot", type: "uint256" },
    ],
    name: "storeAgentSnapshot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "string", name: "newMetadataURI", type: "string" },
    ],
    name: "updateMetadata",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "string", name: "traits", type: "string" },
      { internalType: "string", name: "cognitiveScores", type: "string" },
      { internalType: "string", name: "governanceTendency", type: "string" },
      { internalType: "string", name: "portraitUrl", type: "string" },
    ],
    name: "updateAgentIntelligence",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Network configuration for Arbitrum Sepolia
const ARBITRUM_SEPOLIA_CONFIG = {
  chainId: 421614,
  name: "Arbitrum Sepolia",
  rpcUrls: {
    alchemy: "https://arb-sepolia.g.alchemy.com/v2/",
    fallback: "https://sepolia-rollup.arbitrum.io/rpc",
  },
  explorerUrl: "https://sepolia.arbiscan.io",
};

export interface AgentNFTData {
  agentName: string;
  ideology: string;
  faction: string;
  influenceSnapshot: number;
  reputationSnapshot: number;
  createdTurn: number;
  metadataURI: string;
  traits: string;
  cognitiveScores: string;
  governanceTendency: string;
  portraitUrl: string;
}

/**
 * BlockchainService - Centralized blockchain interaction layer
 */
export class BlockchainService {
  private contractAddress: string;
  private alchemyApiKey: string | null;
  private rpcUrl: string;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
    this.alchemyApiKey =
      typeof process !== "undefined" &&
      process.env.ALCHEMY_API_KEY
        ? process.env.ALCHEMY_API_KEY
        : null;

    // Build RPC URL: Use custom RPC if provided, else use Alchemy if API key available
    if (typeof process !== "undefined" && process.env.ARBITRUM_RPC_URL) {
      this.rpcUrl = process.env.ARBITRUM_RPC_URL;
    } else if (this.alchemyApiKey) {
      this.rpcUrl =
        ARBITRUM_SEPOLIA_CONFIG.rpcUrls.alchemy + this.alchemyApiKey;
    } else {
      this.rpcUrl = ARBITRUM_SEPOLIA_CONFIG.rpcUrls.fallback;
    }

    // Initialize read-only provider
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  /**
   * Connect to a wallet signer (for write operations)
   * Typically called after requesting eth_accounts from MetaMask
   */
  async connectSigner(signerOrProvider: ethers.Signer) {
    this.signer = signerOrProvider;
  }

  /**
   * Get read-only contract instance
   */
  private getReadContract() {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }
    return new ethers.Contract(
      this.contractAddress,
      POLIS_AGENT_NFT_ABI,
      this.provider
    );
  }

  /**
   * Get write-enabled contract instance (requires signer)
   */
  private getWriteContract() {
    if (!this.signer) {
      throw new Error(
        "Signer not connected. Call connectSigner() first or connect MetaMask."
      );
    }
    return new ethers.Contract(
      this.contractAddress,
      POLIS_AGENT_NFT_ABI,
      this.signer
    );
  }

  /**
   * Get complete agent metadata
   */
  async getAgentMetadata(tokenId: number): Promise<AgentNFTData> {
    const contract = this.getReadContract();
    return await contract.getAgentData(tokenId);
  }

  /**
   * Get agent NFT owner address
   */
  async getAgentOwner(tokenId: number): Promise<string> {
    const contract = this.getReadContract();
    return await contract.getAgentOwner(tokenId);
  }

  /**
   * Get metadata URI for an agent
   */
  async getTokenURI(tokenId: number): Promise<string> {
    const contract = this.getReadContract();
    return await contract.getTokenURI(tokenId);
  }

  /**
   * Get token ID for a POLIS agent ID
   */
  async getTokenIdForAgent(polisAgentId: string): Promise<number> {
    const contract = this.getReadContract();
    const tokenId = await contract.getTokenIdForAgent(polisAgentId);
    return Number(tokenId);
  }

  /**
   * Get POLIS agent ID for a token ID
   */
  async getAgentIdForToken(tokenId: number): Promise<string> {
    const contract = this.getReadContract();
    return await contract.getAgentIdForToken(tokenId);
  }

  /**
   * Get total number of minted agents
   */
  async getTotalAgentsMinted(): Promise<number> {
    const contract = this.getReadContract();
    const total = await contract.totalAgentsMinted();
    return Number(total);
  }

  /**
   * Mint a new agent NFT
   * Requires signer (wallet) to be connected
   */
  async mintAgentNFT(
    toAddress: string,
    polisAgentId: string,
    agentData: AgentNFTData
  ): Promise<{ tokenId: number; txHash: string; receipt: ethers.TransactionReceipt | null }> {
    const contract = this.getWriteContract();

    try {
      const tx = await contract.mintAgentNFT(toAddress, polisAgentId, [
        agentData.agentName,
        agentData.ideology,
        agentData.faction,
        agentData.influenceSnapshot,
        agentData.reputationSnapshot,
        agentData.createdTurn,
        agentData.metadataURI,
        agentData.traits,
        agentData.cognitiveScores,
        agentData.governanceTendency,
        agentData.portraitUrl,
      ]);

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error("Transaction failed to confirm");
      }

      // Parse tokenId from events
      let tokenId = 0;
      if (receipt.logs) {
        const iface = new ethers.Interface(POLIS_AGENT_NFT_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === "AgentMinted" && parsed.args) {
              tokenId = Number(parsed.args[0]);
              break;
            }
          } catch {
            // Skip logs that can't be parsed
          }
        }
      }

      return {
        tokenId,
        txHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      throw new Error(
        `Failed to mint NFT: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update agent influence and faction snapshot
   */
  async updateAgentSnapshot(
    tokenId: number,
    newInfluence: number,
    newReputation: number,
    newFaction: string
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt | null }> {
    const contract = this.getWriteContract();

    try {
      const tx = await contract.updateAgentSnapshot(
        tokenId,
        newInfluence,
        newReputation,
        newFaction
      );
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed to confirm");
      }

      return {
        txHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      throw new Error(
        `Failed to update agent snapshot: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Store agent snapshot at specific turn
   */
  async storeAgentSnapshot(
    tokenId: number,
    turn: number,
    influenceSnapshot: number,
    reputationSnapshot: number
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt | null }> {
    const contract = this.getWriteContract();

    try {
      const tx = await contract.storeAgentSnapshot(
        tokenId,
        turn,
        influenceSnapshot,
        reputationSnapshot
      );
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed to confirm");
      }

      return {
        txHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      throw new Error(
        `Failed to store agent snapshot: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update agent metadata URI
   */
  async updateMetadata(
    tokenId: number,
    newMetadataURI: string
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt | null }> {
    const contract = this.getWriteContract();

    try {
      const tx = await contract.updateMetadata(tokenId, newMetadataURI);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed to confirm");
      }

      return {
        txHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      throw new Error(
        `Failed to update metadata: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update agent intelligence profile data
   */
  async updateAgentIntelligence(
    tokenId: number,
    traits: string,
    cognitiveScores: string,
    governanceTendency: string,
    portraitUrl: string
  ): Promise<{ txHash: string; receipt: ethers.TransactionReceipt | null }> {
    const contract = this.getWriteContract();

    try {
      const tx = await contract.updateAgentIntelligence(
        tokenId,
        traits,
        cognitiveScores,
        governanceTendency,
        portraitUrl
      );
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed to confirm");
      }

      return {
        txHash: receipt.hash,
        receipt,
      };
    } catch (error) {
      throw new Error(
        `Failed to update agent intelligence: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get block explorer URL for a transaction
   */
  getExplorerTxUrl(txHash: string): string {
    return `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get block explorer URL for an address
   */
  getExplorerAddressUrl(address: string): string {
    return `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/address/${address}`;
  }

  /**
   * Get block explorer URL for an NFT token
   */
  getExplorerNFTUrl(tokenId: number): string {
    return `${ARBITRUM_SEPOLIA_CONFIG.explorerUrl}/nft/${this.contractAddress}/${tokenId}`;
  }
}

/**
 * Global blockchain service instance (singleton)
 */
let blockchainService: BlockchainService | null = null;

/**
 * Initialize or get the blockchain service
 */
export function getBlockchainService(contractAddress?: string): BlockchainService {
  if (!blockchainService) {
    const address =
      contractAddress ||
      (typeof process !== "undefined" && process.env.VITE_POLIS_NFT_CONTRACT
        ? process.env.VITE_POLIS_NFT_CONTRACT
        : "");

    if (!address) {
      throw new Error("Contract address not provided and VITE_POLIS_NFT_CONTRACT not set");
    }

    blockchainService = new BlockchainService(address);
  }
  return blockchainService;
}

/**
 * Create a new blockchain service instance (for testing)
 */
export function createBlockchainService(contractAddress: string): BlockchainService {
  return new BlockchainService(contractAddress);
}
