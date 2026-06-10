import type { CivilizationEra, EraHistoryEntry, WorldState } from "./world-state";
import type { Agent, FeedPost, Memory, Proposal } from "./polis-data";
import { createFeedEvent } from "./feed-events";

/* eslint-disable @typescript-eslint/no-explicit-any */
type CState = {
  turn: number;
  agents: Agent[];
  proposals: Proposal[];
  feed: FeedPost[];
  memories: Memory[];
  worldState: WorldState & Record<string, any>;
  factions: Record<string, number>;
  [key: string]: any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const ERA_LABELS: Record<CivilizationEra, string> = {
  Formation: "Formation Era",
  Expansion: "Expansion Era",
  Reform: "Reform Era",
  Crisis: "Crisis Era",
  Consolidation: "Consolidation Era",
};

export const ERA_DESCRIPTIONS: Record<CivilizationEra, string> = {
  Formation:
    "The civilization is establishing its foundational governance structures. Political identities are forming and institutional precedent is being set for the first time.",
  Expansion:
    "The chamber is in a phase of confident growth. Dominant coalitions are forming and governance capacity is expanding outward.",
  Reform:
    "Systemic pressures have triggered a restructuring cycle. Old doctrines are being challenged and new institutional frameworks are being forged.",
  Crisis:
    "The chamber is under acute strain. Political tension is high, stability is threatened, and the old order is under direct contest.",
  Consolidation:
    "A dominant faction has achieved durable control. The chamber is stabilizing under consolidated leadership, but resistance may be building beneath the surface.",
};

export const ERA_COLORS: Record<CivilizationEra, string> = {
  Formation: "amber",
  Expansion: "cyan",
  Reform: "cyan",
  Crisis: "crimson",
  Consolidation: "amber",
};

// ── Era determination ──────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export function determineEra(worldState: WorldState & Record<string, any>): CivilizationEra {
  const tension = worldState.politicalTension ?? 20;
  const stability = worldState.stability ?? 50;
  const emotion = worldState.emotion ?? "Stable";
  const dominanceStreak = worldState.dominanceStreak ?? 0;
  const factionDominance: Record<string, number> = worldState.factionDominance ?? {};
  const maxDominance = Object.values(factionDominance).reduce((max, v) => Math.max(max, v), 0);

  if (tension > 65 || emotion === "Fragmenting" || stability < 28) return "Crisis";
  if (stability > 74 && dominanceStreak >= 4 && tension < 35) return "Consolidation";
  if (
    emotion === "Reforming" ||
    (stability >= 40 && stability < 72 && tension >= 28 && tension < 65)
  )
    return "Reform";
  if (stability > 54 && tension < 48 && maxDominance > 30) return "Expansion";
  return "Formation";
}

// ── Era modifiers used by turnEngine ──────────────────────────────────────

export function getEraProposalBias(era: CivilizationEra): Record<string, number> {
  switch (era) {
    case "Formation":
      return {
        Security: 1.4,
        "Governance Reform": 1.3,
        Treasury: 0.8,
        Alliance: 0.9,
        Expansion: 0.6,
      };
    case "Expansion":
      return {
        Alliance: 1.5,
        Expansion: 1.4,
        Treasury: 1.0,
        Security: 0.8,
        "Governance Reform": 0.7,
      };
    case "Reform":
      return {
        "Governance Reform": 1.6,
        Alliance: 1.2,
        Treasury: 1.0,
        Security: 0.7,
        Expansion: 0.8,
      };
    case "Crisis":
      return {
        Security: 1.7,
        "Governance Reform": 1.2,
        Treasury: 0.7,
        Alliance: 0.9,
        Expansion: 0.5,
      };
    case "Consolidation":
      return {
        Treasury: 1.5,
        Alliance: 1.1,
        "Governance Reform": 0.8,
        Security: 1.0,
        Expansion: 1.2,
      };
    default:
      return {};
  }
}

export function getEraVoteWeightModifier(era: CivilizationEra, tension: number): number {
  switch (era) {
    case "Crisis":
      return Math.max(0.7, 1 - (tension / 100) * 0.35);
    case "Consolidation":
      return 1.12;
    case "Expansion":
      return 1.08;
    case "Reform":
      return 1.0;
    case "Formation":
      return Math.max(0.85, 1 - (tension / 100) * 0.2);
    default:
      return 1.0;
  }
}

export function getEraIdeologyDriftMultiplier(era: CivilizationEra): number {
  switch (era) {
    case "Formation":
      return 1.5;
    case "Crisis":
      return 1.8;
    case "Reform":
      return 1.4;
    case "Expansion":
      return 0.9;
    case "Consolidation":
      return 0.7;
    default:
      return 1.0;
  }
}

export function getEraMoraleModifier(era: CivilizationEra): number {
  switch (era) {
    case "Crisis":
      return -10;
    case "Consolidation":
      return +5;
    case "Expansion":
      return +3;
    case "Reform":
      return 0;
    case "Formation":
      return -2;
    default:
      return 0;
  }
}

// ── Era transition memory helpers ──────────────────────────────────────────

function describeEraTrigger(
  worldState: WorldState & Record<string, any>,
  era: CivilizationEra,
): string {
  const tension = worldState.politicalTension ?? 20;
  const stability = worldState.stability ?? 50;
  const emotion = worldState.emotion ?? "Stable";
  const dominanceStreak = worldState.dominanceStreak ?? 0;

  switch (era) {
    case "Crisis":
      if (tension > 65) return `Political tension exceeding ${tension}%`;
      if (emotion === "Fragmenting") return "Fragmenting chamber sentiment";
      return `Stability collapse below ${stability}%`;
    case "Consolidation":
      return `${dominanceStreak}-cycle dominance streak with low tension (${tension}%)`;
    case "Reform":
      return emotion === "Reforming"
        ? "Reforming world sentiment"
        : `Sustained political pressure at ${tension}% tension`;
    case "Expansion":
      return `Favorable stability at ${stability}% with growing dominant coalition`;
    case "Formation":
      return "Return to foundational governance conditions";
    default:
      return "Emergent civilizational dynamics";
  }
}

function getEraConsequences(era: CivilizationEra): string[] {
  switch (era) {
    case "Formation":
      return [
        "Governance and Security proposals increase.",
        "Ideology drift accelerated.",
        "Vote outcomes more volatile.",
      ];
    case "Expansion":
      return [
        "Alliance and Expansion proposals prioritized.",
        "Winning factions receive influence bonuses.",
        "Diplomatic relationships strengthen.",
      ];
    case "Reform":
      return [
        "Governance Reform proposals dominate the agenda.",
        "Ideology drift accelerates.",
        "Old coalitions are stress-tested.",
      ];
    case "Crisis":
      return [
        "Security proposals surge.",
        "Vote weights compressed by political tension.",
        "Faction morale universally affected.",
      ];
    case "Consolidation":
      return [
        "Treasury proposals gain prominence.",
        "Dominant faction receives vote weight bonus.",
        "Stability begins gradual recovery.",
      ];
    default:
      return [];
  }
}

function getEraLongTermImpact(era: CivilizationEra): string[] {
  switch (era) {
    case "Formation":
      return [
        "Foundational decisions cast long shadows.",
        "Early institutions define future reform constraints.",
      ];
    case "Expansion":
      return ["Influence gains compound over time.", "Alliance networks formed now will persist."];
    case "Reform":
      return [
        "Structural changes reshape the chamber's operating rules.",
        "Reform precedents become new orthodoxy or cautionary tales.",
      ];
    case "Crisis":
      return [
        "How the chamber responds defines its institutional resilience.",
        "Agents who lead through crisis gain permanent reputation weight.",
      ];
    case "Consolidation":
      return [
        "Consolidated power enables decisive governance but suppresses diversity.",
        "Counter-movements will eventually challenge the established order.",
      ];
    default:
      return [];
  }
}

function getEraTrustImpact(era: CivilizationEra): string {
  switch (era) {
    case "Formation":
      return "Trust between factions is nascent and highly malleable.";
    case "Expansion":
      return "Trust increases among aligned factions; rivals grow more distant.";
    case "Reform":
      return "Trust is restructured — old alliances questioned, new ones forming.";
    case "Crisis":
      return "Trust across the chamber falls sharply as self-interest dominates.";
    case "Consolidation":
      return "Trust within the dominant faction peaks; rivals distrust the consolidated order.";
    default:
      return "Trust dynamics are uncertain.";
  }
}

// ── Main export ────────────────────────────────────────────────────────────

export function updateCivilizationEra<T extends CState>(state: T): T {
  const newEra = determineEra(state.worldState);
  const currentEra = (state.worldState.civilizationEra ?? "Formation") as CivilizationEra;

  // Apply era morale modifier every turn regardless of transition
  const moraleModifier = getEraMoraleModifier(newEra);
  const newMorale: WorldState["factionMorale"] = { ...(state.worldState.factionMorale ?? {}) };
  const factions = new Set(state.agents.map((a) => a.faction));
  for (const faction of factions) {
    const current = newMorale[faction] ?? 75;
    newMorale[faction] = Math.min(100, Math.max(5, current + moraleModifier));
  }

  // Tension naturally drifts toward era baseline
  const eraTensionBaseline: Record<CivilizationEra, number> = {
    Formation: 30,
    Expansion: 20,
    Reform: 45,
    Crisis: 70,
    Consolidation: 15,
  };
  const baseline = eraTensionBaseline[newEra];
  const currentTension = state.worldState.politicalTension ?? 20;
  const tensionDrift = Math.sign(baseline - currentTension) * 1.5;
  const newTension = Math.max(0, Math.min(100, currentTension + tensionDrift));

  if (newEra === currentEra) {
    return {
      ...state,
      worldState: {
        ...state.worldState,
        currentEra: ERA_LABELS[newEra],
        factionMorale: newMorale,
        politicalTension: newTension,
      },
    };
  }

  // ── Era transition ──────────────────────────────────────────────────────
  const eraEntry: EraHistoryEntry = {
    era: newEra,
    turn: state.turn,
    description: ERA_DESCRIPTIONS[newEra],
    trigger: describeEraTrigger(state.worldState, newEra),
  };

  const repId = state.agents[0]?.id ?? "";

  const feedEvent: FeedPost = createFeedEvent(
    "EraTransition",
    `Era Shift: ${ERA_LABELS[currentEra]} → ${ERA_LABELS[newEra]}`,
    `The civilization has entered the ${ERA_LABELS[newEra]}. ${ERA_DESCRIPTIONS[newEra]} Triggered by: ${eraEntry.trigger}.`,
    [repId],
    "Critical",
    state.turn,
    repId,
  );

  const memory: Memory = {
    id: `m-era-${newEra}-${state.turn}`,
    slug: `era-transition-${newEra.toLowerCase()}-cycle-${state.turn}`,
    cycle: `Cycle ${state.turn}`,
    date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    title: `Era Transition: ${ERA_LABELS[newEra]}`,
    category: "Community",
    summary: ERA_DESCRIPTIONS[newEra],
    weight: 96,
    fullSummary: `At Cycle ${state.turn}, the civilization transitioned from the ${ERA_LABELS[currentEra]} into the ${ERA_LABELS[newEra]}. ${ERA_DESCRIPTIONS[newEra]} This transition was triggered by ${eraEntry.trigger.toLowerCase()}. Era transitions are major civilizational turning points that reshape agent behavior, proposal generation, and faction dynamics for all subsequent cycles.`,
    consequences: getEraConsequences(newEra),
    involvedAgents: state.agents
      .slice(0, 4)
      .map((a) => ({ agentId: a.id, role: "Active during era transition" })),
    longTermImpact: getEraLongTermImpact(newEra),
    trustImpact: getEraTrustImpact(newEra),
    citationCount: 3,
  };

  const prevHistory: EraHistoryEntry[] = state.worldState.eraHistory ?? [];

  return {
    ...state,
    feed: [feedEvent, ...state.feed].slice(0, 200),
    memories: [memory, ...state.memories],
    worldState: {
      ...state.worldState,
      civilizationEra: newEra,
      currentEra: ERA_LABELS[newEra],
      eraStartTurn: state.turn,
      eraHistory: [...prevHistory, eraEntry].slice(-20),
      factionMorale: newMorale,
      politicalTension: newTension,
    },
  };
}
