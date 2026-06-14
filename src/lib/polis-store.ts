import { useSyncExternalStore } from "react";
import { createWorldState, type WorldState } from "./world-state";
import { determineEra } from "./era-system";
import { archiveGovernanceMemory } from "./0g-storage";
import { generateAgentPortrait } from "./portrait";
import { getAgentId } from "./agent-id";
import { mintAgentNFT } from "./use-nft-minting";
import { createAgentMintedEvent } from "./feed-events";
import {
  AgentIntelligenceEngine,
  type AgentCreationInputs,
  type AgentIntelligenceProfile,
} from "./agent-intelligence-engine";
import { getAWSStorageService } from "./aws-storage-service";
import { getBlockchainService } from "./blockchain-service";
import type { Agent, FeedPost, Memory, Proposal, ProposalCategory } from "./polis-data";
import {
  agents as baseAgents,
  feed as baseFeed,
  memories as baseMemories,
  proposals as baseProposals,
} from "./polis-data";

const STORAGE_KEY = "polis-simulation-state";

export type PolisState = {
  agents: Agent[];
  feed: FeedPost[];
  memories: Memory[];
  proposals: Proposal[];
  worldState: WorldState & { totalAgents: number };
};

const listeners = new Set<() => void>();

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ordinalSlug(base: string, existing: Set<string>) {
  let slug = base;
  let idx = 1;
  while (existing.has(slug)) {
    slug = `${base}-${idx++}`;
  }
  return slug;
}

function agentInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function selectColor(faction: string): "amber" | "cyan" | "crimson" | "silver" {
  if (faction.toLowerCase().includes("reform")) return "amber";
  if (faction.toLowerCase().includes("technocrat")) return "cyan";
  if (faction.toLowerCase().includes("sovereign")) return "crimson";
  if (faction.toLowerCase().includes("populist")) return "silver";
  return "silver";
}

function rankForInfluence(influence: number) {
  return Math.max(1, Math.min(10, Math.round((100 - influence) / 10) + 1));
}

function defaultReputation(influence: number) {
  return Math.min(96, Math.max(58, Math.round(influence * 0.68 + 6)));
}

function defaultTraits(traits: Record<string, number>) {
  return Object.entries(traits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => {
      if (key === "aggression") return "Aggressive";
      if (key === "logic") return "Analytical";
      if (key === "cooperation") return "Collaborative";
      if (key === "ambition") return "Ambitious";
      if (key === "risk") return "Risk-tolerant";
      return key;
    });
}

function createDefaultState(): PolisState {
  return {
    agents: [...baseAgents],
    feed: [...baseFeed],
    memories: [...baseMemories],
    proposals: [...baseProposals],
    worldState: {
      ...createWorldState(),
      totalAgents: baseAgents.length,
    },
  };
}

function loadPersistedState(): PolisState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const persisted = JSON.parse(raw) as Partial<PolisState>;
    const base = createDefaultState();
    return {
      agents: [...base.agents, ...(persisted.agents ?? [])],
      feed: [...(persisted.feed ? [...persisted.feed, ...base.feed] : base.feed)],
      memories: [...base.memories, ...(persisted.memories ?? [])],
      proposals: [...base.proposals, ...(persisted.proposals ?? [])],
      worldState: {
        ...base.worldState,
        ...(persisted.worldState ?? {}),
      },
    };
  } catch {
    return null;
  }
}

function persistState(state: PolisState) {
  if (typeof window === "undefined") return;
  try {
    const base = createDefaultState();
    const createdAgents = state.agents.slice(base.agents.length);
    const createdFeed = state.feed.filter(
      (post) => !base.feed.some((basePost) => basePost.id === post.id),
    );
    const createdMemories = state.memories.slice(base.memories.length);
    const createdProposals = state.proposals.slice(base.proposals.length);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        agents: createdAgents,
        feed: createdFeed,
        memories: createdMemories,
        proposals: createdProposals,
        worldState: {
          totalAgents: state.worldState.totalAgents,
          dominantFaction: state.worldState.dominantFaction,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          civilizationEra: (state.worldState as any).civilizationEra,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          currentEra: (state.worldState as any).currentEra,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          eraStartTurn: (state.worldState as any).eraStartTurn,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          eraHistory: (state.worldState as any).eraHistory,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          politicalTension: (state.worldState as any).politicalTension,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          factionStreaks: (state.worldState as any).factionStreaks,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          factionMorale: (state.worldState as any).factionMorale,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          factionGrievances: (state.worldState as any).factionGrievances,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          allianceTrust: (state.worldState as any).allianceTrust,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          betrayalCounts: (state.worldState as any).betrayalCounts,
        },
      }),
    );
  } catch {
    // ignore persistence errors
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

let state: PolisState = loadPersistedState() ?? createDefaultState();
const serverSnapshot: PolisState = createDefaultState();

export function getPolisStoreSnapshot(): PolisState {
  return state;
}

export function usePolisStore(): PolisState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => serverSnapshot,
  );
}

export function getPolisAgentBySlug(slug: string) {
  return state.agents.find((agent) => agent.slug === slug) ?? null;
}

export function getPolisAgentById(agentId: string) {
  return state.agents.find((agent) => agent.id === agentId) ?? null;
}

/**
 * Advance the simulation by one turn by invoking the turn engine.
 * Updates local store state, persists, and notifies subscribers.
 */
export async function advanceTurn(playerAction?: unknown) {
  try {
    // Lazy import to avoid circular deps at module load time
    const { runTurn } = await import("./turnEngine");
    const turnState = {
      ...state,
      turn: (state.worldState as any)?.turn ?? 0,
      factions: (state.worldState as any)?.factions ?? {},
      events: [],
      proposals: state.proposals,
      history: (state.worldState as any)?.history ?? [],
    } as any;

    const newState = await runTurn(turnState as any, playerAction as any);

    // Map returned TurnState back into PolisState shape
    state = {
      agents: newState.agents,
      feed: newState.feed,
      memories: newState.memories,
      proposals: newState.proposals,
      worldState: {
        ...(newState.worldState ?? {}),
        totalAgents: newState.agents.length,
      },
    };

    persistState(state);
    notify();
    return state;
  } catch (e) {
    console.error("advanceTurn failed:", e);
    throw e;
  }
}

export async function createAgentInPolisSimulation(input: {
  name: string;
  title: string;
  philosophy: string;
  ideology: string;
  influence: number;
  role: string;
  faction: string;
  traits: Record<string, number>;
  behavior: string;
  governance: string;
  autoMint?: boolean;
  metadataURI?: string;
}) {
  const existingSlugs = new Set(state.agents.map((agent) => agent.slug));
  const baseSlug = sanitizeSlug(input.name);
  const slug = ordinalSlug(baseSlug || `agent-${Date.now()}`, existingSlugs);
  const id = `a-${Math.abs(
    Array.from({ length: 6 }).reduce<number>((hash, _, index) => {
      const char = input.name.charCodeAt(index % input.name.length) || 0;
      return (hash << 5) - hash + char + index;
    }, 0),
  )}`;

  const reputation = defaultReputation(input.influence);
  const color = selectColor(input.faction);
  const traitsList = defaultTraits(input.traits);
  const rank = rankForInfluence(input.influence);
  const temperament = `${input.governance}. ${input.behavior}.`;
  const riskTolerance = `${Math.round(input.traits.risk)}% risk disposition`;

  const newAgent: Agent = {
    id,
    slug,
    name: input.name,
    handle: `@${slug}.polis`,
    ideology: input.ideology,
    faction: input.faction,
    reputation,
    influence: input.influence,
    traits: traitsList,
    status: "idle",
    initials: agentInitials(input.name),
    color,
    philosophy: input.philosophy || "A newly minted sovereign actor.",
    temperament,
    riskTolerance,
    votingHistory: [],
    memoryReferences: [],
    allies: [],
    rivals: [],
    coalitions: [],
    recentActivity: [`Founded as a sovereign entity registered with the ${input.faction} bloc.`],
    rank,
  };

  // Generate an AI-style portrait deterministically (SVG data URI)
  try {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const portrait = generateAgentPortrait(newAgent as any);
    newAgent.portraitUri = portrait.uri;
    newAgent.portraitSeed = portrait.seed;
    newAgent.portraitStyle = portrait.style;
  } catch (e) {
    // if portrait generation fails, continue without blocking agent creation
  }

  const memoryTitle = `Founding of ${input.name}`;
  const memory: Memory = {
    id: `m-${slug}`,
    slug: `founding-${slug}`,
    cycle: `Cycle ${state.memories.length + 1}`,
    date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    title: memoryTitle,
    category: "Community",
    summary: `The founding of ${input.name} introduced a new sovereign actor into the Polis chamber.`,
    weight: 62,
    fullSummary: `The chamber archived the founding of ${input.name}, a new political actor aligned with ${input.faction}. This event marks the beginning of their institutional reputation arc and is preserved as a reference point for subsequent coalition dynamics.`,
    consequences: [
      "Expanded chamber composition with a newly registered sovereign actor.",
      "Anchored a distinct political identity in Polis memory.",
      "Created a gestural reference for future factional negotiations.",
    ],
    involvedAgents: [{ agentId: newAgent.id, role: "Founding sovereign actor" }],
    longTermImpact: [
      "Seeded a new factional perspective within chamber deliberation.",
      "Provided a fresh institutional memory anchor for later debates.",
    ],
    trustImpact: `Initial reputation entered the chamber at ${reputation} with influence set to ${input.influence}.`,
    citationCount: 1,
    archivedOn0g: false,
  };

  newAgent.memoryReferences = [
    { memory: memory.title, note: "Founding event archival reference." },
  ];

  const feedPost: FeedPost = {
    id: `p-${slug}-${Date.now()}`,
    agentId: newAgent.id,
    proposal: "Founding Declaration",
    timestamp: "just now",
    stance: "support",
    content: `${input.name} has entered the chamber as a sovereign actor aligned with ${input.faction}. Their founding declaration sets a new political trajectory for the simulation.`,
    memoryRef: memory.title,
    reactions: [{ type: "Aligned", count: 172 }],
    replies: [],
  };

  const nextWorldState = {
    ...state.worldState,
    totalAgents: state.agents.length + 1,
  };
  const computedEra = determineEra(nextWorldState as any);
  const ERA_LABEL_MAP: Record<string, string> = {
    Formation: "Formation Era",
    Expansion: "Expansion Era",
    Reform: "Reform Era",
    Crisis: "Crisis Era",
    Consolidation: "Consolidation Era",
  };

  const nextState: PolisState = {
    agents: [...state.agents, newAgent],
    feed: [feedPost, ...state.feed],
    memories: [memory, ...state.memories],
    proposals: [...state.proposals],
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    worldState: {
      ...nextWorldState,
      civilizationEra: computedEra,
      currentEra: ERA_LABEL_MAP[computedEra] ?? `${computedEra} Era`,
    } as any,
  };

  state = nextState;
  persistState(state);
  notify();

  // Optional: auto-mint this agent as an iNFT snapshot on Arbitrum
  if (input.autoMint) {
    try {
      const request = {
        agentId: newAgent.id,
        agentName: newAgent.name,
        ideology: newAgent.ideology,
        faction: newAgent.faction,
        influenceSnapshot: newAgent.influence,
        createdTurn: state.worldState.totalAgents,
        metadataURI: input.metadataURI ?? "ipfs://QmPlaceholder",
      };

      const result = await mintAgentNFT(request as any);

      // update agent with NFT info
      newAgent.nftTokenId = result.tokenId;
      newAgent.nftAddress = result.contractAddress;
      newAgent.nftMintedAt = Date.now();

      state = {
        ...state,
        agents: state.agents.map((a) =>
          a.id === newAgent.id
            ? {
                ...a,
                nftTokenId: result.tokenId,
                nftAddress: result.contractAddress,
                nftMintedAt: newAgent.nftMintedAt,
              }
            : a,
        ),
        feed: [
          createAgentMintedEvent(
            newAgent.name,
            newAgent.id,
            result.tokenId,
            result.contractAddress,
            result.ownerAddress,
            state.worldState.totalAgents,
          ),
          ...state.feed,
        ],
      };

      persistState(state);
      notify();
    } catch (e) {
      // if minting fails, emit a feed error post
      const errMsg = e instanceof Error ? e.message : "Mint failed";
      const failPost: FeedPost = {
        id: `p-mintfail-${Date.now()}`,
        agentId: newAgent.id,
        proposal: "MintAttempt",
        timestamp: "just now",
        stance: "neutral",
        content: `Automatic mint attempt failed: ${errMsg}`,
        memoryRef: "MintFailure",
        reactions: [],
        replies: [],
      };
      state = { ...state, feed: [failPost, ...state.feed] };
      persistState(state);
      notify();
    }
  }

  archiveGovernanceMemory({
    event: memory.title,
    impact: memory.summary,
    cycle: memory.cycle,
  })
    .then((result) => {
      if (result?.rootHash) {
        state = {
          ...state,
          memories: state.memories.map((item) =>
            item.id === memory.id ? { ...item, archivedOn0g: true } : item,
          ),
        };
        persistState(state);
        notify();
      }
    })
    .catch(() => null);

  return { agent: newAgent, feed: feedPost, memory };
}

export async function submitProposalToPolisSimulation(input: {
  title: string;
  category: ProposalCategory;
  description: string;
  summary: string;
  impactLevel: "Low" | "Moderate" | "High" | "Critical";
  proposerName?: string;
  proposerId?: string;
  authorAgentId?: string;
}) {
  // Delegate proposal creation and the full governance turn execution to the turn engine
  // This ensures: Create Proposal -> Execute Turn -> Agent Reactions -> Voting -> Resolution -> Influence updates -> Dominance -> World State -> Feed -> Archive
  try {
    await advanceTurn({ type: "SUBMIT_PROPOSAL", data: input } as any);

    // After advancing the turn, the newest proposal/feed items are at the head of the arrays
    const createdProposal = state.proposals.find((p) => p.title === input.title) ?? state.proposals[0];
    const relatedFeed = state.feed.find((f) => f.proposal === createdProposal?.id) ?? state.feed[0];

    return { proposal: createdProposal, feed: relatedFeed } as { proposal: Proposal; feed: FeedPost };
  } catch (e) {
    // Fall back to creating a queued proposal without executing turn if advance fails
    const existingSlugs = new Set(state.proposals.map((proposal) => proposal.slug));
    const baseSlug = sanitizeSlug(input.title);
    const slug = ordinalSlug(baseSlug || `proposal-${Date.now()}`, existingSlugs);
    const id = `POL-${slug.toUpperCase()}`;
    const author = input.authorAgentId
      ? state.agents.find((agent) => agent.id === input.authorAgentId)
      : undefined;
    const proposerName = author?.name ?? input.proposerName ?? "Human Delegate";

    const newProposal: Proposal = {
      id,
      slug,
      title: input.title,
      origin: "HUMAN",
      proposerId: author?.id ?? input.proposerId,
      proposerName,
      status: "Created — waiting debate",
      phase: "Created",
      statusTag: "Active",
      lifecycle: "Created",
      createdTurn: state.worldState.totalAgents,
      age: 0,
      category: input.category,
      summary: input.summary,
      description: input.description,
      votes: { for: 0, against: 0, abstain: 0 },
      supportVotes: 0,
      opposeVotes: 0,
      abstainVotes: 0,
      outcome: "Pending",
      impactLevel: input.impactLevel,
      treasuryImpact: "Moderate",
      treasuryExposure: "Undetermined",
      risk: 52,
      riskLevel: "Moderate",
      memoryTags: [input.category, "HUMAN"],
      sentimentTrend: [50],
      sentimentDelta: "+0.0",
      agentReactions: author
        ? [
            {
              agentId: author.id,
              position: "endorsed",
              statement: `${author.name} introduced this human submission.`,
            },
          ]
        : [],
      historicalReferences: [],
      upcoming: "Debate begins next turn",
    };

    const feedPost: FeedPost = {
      id: `p-proposal-${Date.now()}`,
      agentId: author?.id ?? "",
      proposal: newProposal.id,
      timestamp: "just now",
      stance: "support",
      content: `${proposerName} submitted ${newProposal.title} to the chamber as a human-origin proposal.`,
      memoryRef: input.category,
      reactions: [{ type: "Aligned", count: 28 }],
      replies: [],
    };

    state = {
      ...state,
      proposals: [newProposal, ...state.proposals],
      feed: [feedPost, ...state.feed],
    };

    persistState(state);
    notify();

    return { proposal: newProposal, feed: feedPost };
  }
}

/**
 * Enhanced agent creation using Agent Intelligence Engine
 * Generates full intelligence profile and optionally mints NFT with portrait
 */
export async function createAgentWithIntelligence(input: {
  name: string;
  title: string;
  philosophy: string;
  intelligenceInputs: AgentCreationInputs;
  portraitImage?: Blob | string; // Generated AI portrait
  autoMint?: boolean;
}) {
  // 1. Generate intelligence profile
  const intelligenceProfile = AgentIntelligenceEngine.generateProfile(
    input.intelligenceInputs
  );

  // 2. Build base agent from intelligence
  const existingSlugs = new Set(state.agents.map((agent) => agent.slug));
  const baseSlug = sanitizeSlug(input.name);
  const slug = ordinalSlug(baseSlug || `agent-${Date.now()}`, existingSlugs);
  const id = `a-${Math.abs(
    Array.from({ length: 6 }).reduce<number>((hash, _, index) => {
      const char = input.name.charCodeAt(index % input.name.length) || 0;
      return (hash << 5) - hash + char + index;
    }, 0),
  )}`;

  // Use intelligence to set initial stats
  const influence = Math.round(intelligenceProfile.growthPotential.projectedInfluence);
  const reputation = Math.round(intelligenceProfile.growthPotential.projectedReputation);
  const faction = intelligenceProfile.recommendedFaction;
  const ideology = intelligenceProfile.ideologyAnchor.primaryIdeology;
  const governanceRole = intelligenceProfile.governanceTendency;
  const politicalRole = intelligenceProfile.projectedRole;

  const color = selectColor(faction);
  const traitsList = Object.entries(intelligenceProfile.personalityTraits)
    .filter(([, value]) => value > 60)
    .map(([key]) =>
      key
        .replace(/([A-Z])/g, " $1")
        .trim()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("")
    )
    .slice(0, 3);

  const rank = rankForInfluence(influence);

  // 3. Upload portrait to S3 if provided
  let portraitUrl = "";
  if (input.portraitImage) {
    try {
      const storageService = getAWSStorageService();
      const { url } = storageService.generatePresignedPutUrl(id, 3600);
      portraitUrl = url;

      // In production, upload would happen here
      // await fetch(uploadUrl, { method: "PUT", body: portraitImage });
    } catch (e) {
      console.warn("Failed to upload portrait to S3:", e);
      // Continue without portrait URL
    }
  }

  // 4. Create agent with full intelligence profile
  const newAgent: Agent = {
    id,
    slug,
    name: input.name,
    handle: `@${slug}.polis`,
    ideology,
    faction,
    portraitUri: portraitUrl || undefined,
    reputation,
    influence,
    traits: traitsList.length > 0 ? traitsList : ["Unclassified"],
    status: "idle",
    initials: agentInitials(input.name),
    color,
    philosophy: input.philosophy || intelligenceProfile.behaviorProfile,
    temperament: `${governanceRole} • ${politicalRole}`,
    riskTolerance: `${Math.round(intelligenceProfile.cognitiveScores.stabilityPreference)}% stability preference`,
    votingHistory: [],
    memoryReferences: [],
    allies: [],
    rivals: [],
    coalitions: [],
    recentActivity: [
      `Manifests as a ${governanceRole} with ${politicalRole} tendencies.`,
      `Political alignment: ${ideology} (${intelligenceProfile.ideologyAnchor.ideologyStrength}% conviction).`,
    ],
    rank,
    // Extended fields for intelligence
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    intelligenceProfile: intelligenceProfile as any,
    personalityTraits: intelligenceProfile.personalityTraits,
    cognitiveScores: intelligenceProfile.cognitiveScores,
    governanceTendency: governanceRole,
    politicalRole,
    growthRate: intelligenceProfile.growthPotential.growthRate,
  };

  // 5. Create memory entry
  const memoryTitle = `Founding of ${input.name}`;
  const memory: Memory = {
    id: `m-${slug}`,
    slug: `founding-${slug}`,
    cycle: `Cycle ${state.memories.length + 1}`,
    date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    title: memoryTitle,
    category: "Community",
    summary: `The founding of ${input.name} introduced a new sovereign actor into the Polis chamber as a ${governanceRole}.`,
    weight: 62,
    fullSummary: `${input.name} entered the chamber as a ${ideology} ${governanceRole} aligned with ${faction}. Intelligence profile indicates ${intelligenceProfile.behaviorProfile.toLowerCase()}`,
    consequences: [
      `Introduced ${governanceRole} archetype to chamber dynamics.`,
      `Established ${ideology} ideological anchor at ${intelligenceProfile.ideologyAnchor.ideologyStrength}% conviction strength.`,
    ],
    involvedAgents: [{ agentId: newAgent.id, role: governanceRole }],
    longTermImpact: [
      `Growth trajectory: ${intelligenceProfile.growthPotential.growthRate > 0 ? "ascending" : "declining"} at ${Math.abs(intelligenceProfile.growthPotential.growthRate).toFixed(2)}/turn`,
    ],
    trustImpact: `Entered at ${reputation} reputation, ${influence} influence.`,
    citationCount: 1,
    archivedOn0g: false,
  };

  newAgent.memoryReferences = [
    { memory: memory.title, note: "Founding event with intelligence profile." },
  ];

  // 6. Create feed post
  const feedPost: FeedPost = {
    id: `p-${slug}-${Date.now()}`,
    agentId: newAgent.id,
    proposal: "Founding Declaration",
    timestamp: "just now",
    stance: "support",
    content: `${input.name}, a ${governanceRole}, has entered as a new sovereign actor aligned with ${faction}. ${intelligenceProfile.behaviorProfile}`,
    memoryRef: memory.title,
    reactions: [{ type: "Aligned", count: 172 }],
    replies: [],
  };

  // 7. Update state
  const nextWorldState = {
    ...state.worldState,
    totalAgents: state.agents.length + 1,
  };
  const computedEra = determineEra(nextWorldState as any);
  const ERA_LABEL_MAP: Record<string, string> = {
    Formation: "Formation Era",
    Expansion: "Expansion Era",
    Reform: "Reform Era",
    Crisis: "Crisis Era",
    Consolidation: "Consolidation Era",
  };

  const nextState: PolisState = {
    agents: [...state.agents, newAgent],
    feed: [feedPost, ...state.feed],
    memories: [memory, ...state.memories],
    proposals: [...state.proposals],
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    worldState: {
      ...nextWorldState,
      civilizationEra: computedEra,
      currentEra: ERA_LABEL_MAP[computedEra] ?? `${computedEra} Era`,
    } as any,
  };

  state = nextState;
  persistState(state);
  notify();

  // 8. Optional: Mint NFT with full intelligence profile
  if (input.autoMint) {
    try {
      const metadata = getAWSStorageService().generateMetadata({
        agentId: newAgent.id,
        name: newAgent.name,
        faction: newAgent.faction,
        influence: newAgent.influence,
        reputation: newAgent.reputation,
        ideology: newAgent.ideology,
        governanceStyle: newAgent.temperament,
        creationTurn: state.worldState.totalAgents,
        traits: JSON.stringify(intelligenceProfile.personalityTraits),
        cognitiveScores: JSON.stringify(intelligenceProfile.cognitiveScores),
        portraitUrl: portraitUrl || "ipfs://QmDefaultPortrait",
      });

      // Attempt to use blockchain service for minting
      try {
        const blockchainService = getBlockchainService();
        const result = await blockchainService.mintAgentNFT(
          (window as any).ethereum?.selectedAddress || "",
          newAgent.id,
          {
            agentName: newAgent.name,
            ideology: newAgent.ideology,
            faction: newAgent.faction,
            influenceSnapshot: newAgent.influence,
            reputationSnapshot: newAgent.reputation,
            createdTurn: state.worldState.totalAgents,
            metadataURI: JSON.stringify(metadata),
            traits: JSON.stringify(intelligenceProfile.personalityTraits),
            cognitiveScores: JSON.stringify(intelligenceProfile.cognitiveScores),
            governanceTendency: governanceRole,
            portraitUrl,
          }
        );

        // Update agent with NFT info
        newAgent.nftTokenId = result.tokenId;
        newAgent.nftAddress = result.txHash;
        newAgent.nftMintedAt = Date.now();

        state = {
          ...state,
          agents: state.agents.map((a) =>
            a.id === newAgent.id
              ? {
                  ...a,
                  nftTokenId: result.tokenId,
                  nftAddress: result.txHash,
                  nftMintedAt: newAgent.nftMintedAt,
                }
              : a
          ),
          feed: [
            createAgentMintedEvent(
              newAgent.name,
              newAgent.id,
              result.tokenId,
              result.txHash,
              (window as any).ethereum?.selectedAddress || "",
              state.worldState.totalAgents
            ),
            ...state.feed,
          ],
        };

        persistState(state);
        notify();
      } catch (e) {
        // Fall back to old minting method if blockchain service fails
        console.warn("Blockchain service minting failed, trying legacy method:", e);
        const legacyResult = await mintAgentNFT({
          agentId: newAgent.id,
          agentName: newAgent.name,
          ideology: newAgent.ideology,
          faction: newAgent.faction,
          influenceSnapshot: newAgent.influence,
          createdTurn: state.worldState.totalAgents,
          metadataURI: JSON.stringify(metadata),
        } as any);

        newAgent.nftTokenId = legacyResult.tokenId;
        newAgent.nftAddress = legacyResult.contractAddress;
        newAgent.nftMintedAt = Date.now();

        state = {
          ...state,
          agents: state.agents.map((a) =>
            a.id === newAgent.id
              ? {
                  ...a,
                  nftTokenId: legacyResult.tokenId,
                  nftAddress: legacyResult.contractAddress,
                  nftMintedAt: newAgent.nftMintedAt,
                }
              : a
          ),
        };

        persistState(state);
        notify();
      }
    } catch (e) {
      console.error("Agent NFT minting failed:", e);
      const errMsg = e instanceof Error ? e.message : "Mint failed";
      const failPost: FeedPost = {
        id: `p-mintfail-${Date.now()}`,
        agentId: newAgent.id,
        proposal: "MintAttempt",
        timestamp: "just now",
        stance: "neutral",
        content: `Intelligence-guided mint attempt failed: ${errMsg}`,
        memoryRef: "MintFailure",
        reactions: [],
        replies: [],
      };
      state = { ...state, feed: [failPost, ...state.feed] };
      persistState(state);
      notify();
    }
  }

  return { agent: newAgent, feed: feedPost, memory, intelligenceProfile };
}
