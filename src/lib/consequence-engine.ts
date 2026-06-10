import type { WorldState } from "./world-state";
import type { Agent, FeedPost, Memory, Proposal } from "./polis-data";
import { createFeedEvent } from "./feed-events";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type CState = {
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

function getAgentById(state: CState, id: string): Agent | undefined {
  return state.agents.find((a) => a.id === id);
}

// ── 1. Faction loss streaks ────────────────────────────────────────────────

function computeFactionOutcomes(state: CState): Record<string, "win" | "loss" | "tie"> {
  const resolvedThisTurn = state.proposals.filter(
    (p) => p.resolvedTurn === state.turn && p.statusTag !== "Active",
  );

  const factions = new Set(state.agents.map((a) => a.faction));
  const outcomes: Record<string, "win" | "loss" | "tie"> = {};

  for (const faction of factions) {
    const factionAgentIds = new Set(
      state.agents.filter((a) => a.faction === faction).map((a) => a.id),
    );
    let wins = 0;
    let losses = 0;

    for (const proposal of resolvedThisTurn) {
      let endorsed = 0;
      let opposed = 0;
      for (const r of proposal.agentReactions) {
        if (!factionAgentIds.has(r.agentId)) continue;
        if (r.position === "endorsed") endorsed++;
        if (r.position === "opposed") opposed++;
      }
      if (endorsed === 0 && opposed === 0) continue;
      const factionMajority = endorsed >= opposed ? "endorsed" : "opposed";
      if (proposal.statusTag === "Passed") {
        factionMajority === "endorsed" ? wins++ : losses++;
      } else if (proposal.statusTag === "Rejected") {
        factionMajority === "opposed" ? wins++ : losses++;
      }
    }

    if (losses > wins) outcomes[faction] = "loss";
    else if (wins > losses) outcomes[faction] = "win";
    else outcomes[faction] = "tie";
  }
  return outcomes;
}

function applyStreakConsequences(state: CState): CState {
  const outcomes = computeFactionOutcomes(state);
  const prevStreaks = state.worldState.factionStreaks ?? {};
  const newStreaks: WorldState["factionStreaks"] = {};
  const newMorale: WorldState["factionMorale"] = { ...(state.worldState.factionMorale ?? {}) };
  const newGrievances: WorldState["factionGrievances"] = {
    ...(state.worldState.factionGrievances ?? {}),
  };
  const feedUpdates: FeedPost[] = [];
  const memoryUpdates: Memory[] = [];

  for (const [faction, outcome] of Object.entries(outcomes)) {
    const prev = prevStreaks[faction] ?? { losses: 0, wins: 0 };
    let updated = { ...prev };

    if (outcome === "loss") updated = { losses: prev.losses + 1, wins: 0 };
    else if (outcome === "win") updated = { losses: 0, wins: prev.wins + 1 };
    newStreaks[faction] = updated;

    if (newMorale[faction] === undefined) newMorale[faction] = 75;

    if (updated.losses >= 3) {
      newMorale[faction] = Math.max(10, newMorale[faction] - 15);
      newGrievances[faction] = [
        ...(newGrievances[faction] ?? []),
        `Consecutive loss streak (${updated.losses} turns) undermined ${faction} authority.`,
      ].slice(-5);

      const agentIds = state.agents.filter((a) => a.faction === faction).map((a) => a.id);
      const repId = agentIds[0] ?? state.agents[0]?.id ?? "";

      feedUpdates.push(
        createFeedEvent(
          "FactionMorale",
          `${faction} Morale Eroding`,
          `${faction} has suffered ${updated.losses} consecutive losses. Faction cohesion is weakening — morale dropped ${updated.losses >= 5 ? "critically" : "significantly"} and influence recovery is slowing.`,
          agentIds,
          updated.losses >= 5 ? "Critical" : "High",
          state.turn,
          repId,
        ),
      );

      if (updated.losses === 3) {
        memoryUpdates.push({
          id: `m-streak-${faction}-${state.turn}`,
          slug: `${faction.toLowerCase().replace(/\s+/g, "-")}-loss-streak-cycle-${state.turn}`,
          cycle: `Cycle ${state.turn}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          title: `${faction} Three-Cycle Loss Streak`,
          category: "Election",
          summary: `${faction} lost three consecutive chamber votes, triggering morale collapse and ideological drift.`,
          weight: 74,
          fullSummary: `After three consecutive failed votes, the ${faction} faction entered a period of internal crisis. Morale metrics fell sharply, influence recovery rates slowed, and agents began drifting from factional orthodoxy.`,
          consequences: [
            `${faction} morale degraded by 15 points.`,
            "Ideology drift accelerated across faction members.",
            "Influence recovery rate reduced.",
          ],
          involvedAgents: state.agents
            .filter((a) => a.faction === faction)
            .slice(0, 3)
            .map((a) => ({ agentId: a.id, role: "Faction member affected" })),
          longTermImpact: [
            `${faction} may fragment under continued pressure.`,
            "Rival factions will exploit the instability.",
          ],
          trustImpact: `Internal trust within ${faction} dropped significantly.`,
          citationCount: 1,
        });
      }
    } else if (updated.wins >= 3) {
      newMorale[faction] = Math.min(100, newMorale[faction] + 8);
    } else {
      newMorale[faction] = Math.min(100, newMorale[faction] + 2);
    }
  }

  return {
    ...state,
    feed: feedUpdates.length ? [...feedUpdates, ...state.feed].slice(0, 200) : state.feed,
    memories: memoryUpdates.length ? [...memoryUpdates, ...state.memories] : state.memories,
    worldState: {
      ...state.worldState,
      factionStreaks: newStreaks,
      factionMorale: newMorale,
      factionGrievances: newGrievances,
    },
  };
}

// ── 2. Dominance > 70% ─────────────────────────────────────────────────────

function applyDominanceConsequences(state: CState): CState {
  const factionDominance: Record<string, number> = (state.worldState as any).factionDominance ?? {};
  const feedUpdates: FeedPost[] = [];
  const memoryUpdates: Memory[] = [];

  for (const [faction, pct] of Object.entries(factionDominance)) {
    if (pct <= 70) continue;

    const factionAgents = state.agents.filter((a) => a.faction === faction);
    const rivals = state.agents.filter((a) => a.faction !== faction);
    const repId = factionAgents[0]?.id ?? state.agents[0]?.id ?? "";

    feedUpdates.push(
      createFeedEvent(
        "DominantDissent",
        `${faction} Dominance Triggers Internal Fracture`,
        `${faction} controls ${pct.toFixed(1)}% of chamber power. Overreach has bred dissent — internal critics are emerging and challenging the bloc's orthodoxy.`,
        factionAgents.slice(0, 3).map((a) => a.id),
        "Critical",
        state.turn,
        repId,
      ),
    );

    if (rivals.length > 0) {
      const rivalFactions = [...new Set(rivals.map((a) => a.faction))].join(", ");
      feedUpdates.push(
        createFeedEvent(
          "RivalUnity",
          `Counter-Coalition Forming Against ${faction}`,
          `${rivalFactions} are uniting in opposition to ${faction} hegemony. A unified resistance coalition is consolidating behind shared opposition.`,
          rivals.slice(0, 4).map((a) => a.id),
          "High",
          state.turn,
          rivals[0].id,
        ),
      );
    }

    memoryUpdates.push({
      id: `m-dom-${faction.replace(/\s+/g, "")}-${state.turn}`,
      slug: `${faction.toLowerCase().replace(/\s+/g, "-")}-dominance-crisis-${state.turn}`,
      cycle: `Cycle ${state.turn}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      title: `${faction} Hegemonic Overreach`,
      category: "Alliance",
      summary: `${faction} exceeded 70% chamber dominance, triggering internal dissent and a unified opposition coalition.`,
      weight: 88,
      fullSummary: `When ${faction} crossed the 70% dominance threshold in Cycle ${state.turn}, the political dynamics shifted fundamentally. Internal voices of dissent emerged and rival factions set aside differences to form a counter-coalition.`,
      consequences: [
        `${faction} internal dissent formally recorded.`,
        "Rival factions received a temporary alliance bonus.",
        "Chamber polarization increased.",
      ],
      involvedAgents: [...factionAgents, ...rivals]
        .slice(0, 4)
        .map((a) => ({
          agentId: a.id,
          role: a.faction === faction ? "Dominant faction" : "Rival coalition",
        })),
      longTermImpact: [
        "Dominant faction may splinter if dissent is not managed.",
        "Opposition coalition may persist across future cycles.",
      ],
      trustImpact: "Trust between dominant and rival factions reached a historic low.",
      citationCount: 1,
    });
  }

  return {
    ...state,
    feed: feedUpdates.length ? [...feedUpdates, ...state.feed].slice(0, 200) : state.feed,
    memories: memoryUpdates.length ? [...memoryUpdates, ...state.memories] : state.memories,
  };
}

// ── 3. Close vote (<5% margin) ─────────────────────────────────────────────

function applyCloseVoteConsequences(state: CState): CState {
  const resolvedThisTurn = state.proposals.filter(
    (p) => p.resolvedTurn === state.turn && p.statusTag !== "Active",
  );

  let tensionDelta = 0;
  const feedUpdates: FeedPost[] = [];
  const memoryUpdates: Memory[] = [];
  const newGrievances: WorldState["factionGrievances"] = {
    ...(state.worldState.factionGrievances ?? {}),
  };

  for (const proposal of resolvedThisTurn) {
    const total = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
    if (total === 0) continue;
    const margin = Math.abs(proposal.votes.for - proposal.votes.against) / total;
    if (margin >= 0.05) continue;

    tensionDelta += 12;

    const losingMajority = proposal.votes.for > proposal.votes.against ? "opposed" : "endorsed";
    const losingAgentIds = new Set(
      proposal.agentReactions.filter((r) => r.position === losingMajority).map((r) => r.agentId),
    );
    const losingFactions = [
      ...new Set(state.agents.filter((a) => losingAgentIds.has(a.id)).map((a) => a.faction)),
    ];

    for (const faction of losingFactions) {
      newGrievances[faction] = [
        ...(newGrievances[faction] ?? []),
        `Narrow defeat on ${proposal.title} (margin: ${(margin * 100).toFixed(1)}%) — legitimacy disputed.`,
      ].slice(-5);
    }

    const repId = state.agents[0]?.id ?? "";
    feedUpdates.push(
      createFeedEvent(
        "CloseVoteTension",
        `Razor-Thin Vote on ${proposal.title}`,
        `${proposal.title} was decided by a margin of ${(margin * 100).toFixed(1)}%. The narrow outcome has spiked political tension and recorded grievances for the losing coalition.`,
        [repId],
        "High",
        state.turn,
        repId,
        proposal.id,
      ),
    );

    if (margin < 0.02) {
      memoryUpdates.push({
        id: `m-close-${proposal.id}-${state.turn}`,
        slug: `close-vote-${proposal.slug}-cycle-${state.turn}`,
        cycle: `Cycle ${state.turn}`,
        date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        title: `Contested Outcome: ${proposal.title}`,
        category: "Election",
        summary: `${proposal.title} was decided by an almost imperceptible margin (${(margin * 100).toFixed(2)}%), straining chamber legitimacy.`,
        weight: 82,
        fullSummary: `The vote on ${proposal.title} was one of the closest in recent chamber history, decided by a margin of less than 2%. The outcome was immediately challenged by the losing coalition, creating lasting grievances and increased political tension.`,
        consequences: [
          "Political tension increased significantly.",
          "Losing coalition filed formal grievances.",
          "Chamber legitimacy perception weakened.",
        ],
        involvedAgents: state.agents
          .slice(0, 4)
          .map((a) => ({ agentId: a.id, role: "Chamber voter" })),
        longTermImpact: [
          "Grievances may escalate into formal challenge motions.",
          "Future close votes will be viewed through this precedent.",
        ],
        trustImpact: "Cross-faction trust eroded by contested outcome.",
        citationCount: 2,
      });
    }
  }

  return {
    ...state,
    feed: feedUpdates.length ? [...feedUpdates, ...state.feed].slice(0, 200) : state.feed,
    memories: memoryUpdates.length ? [...memoryUpdates, ...state.memories] : state.memories,
    worldState: {
      ...state.worldState,
      politicalTension: Math.min(100, (state.worldState.politicalTension ?? 20) + tensionDelta),
      factionGrievances: newGrievances,
    },
  };
}

// ── 4. Alliance trust maintenance ──────────────────────────────────────────

function applyAllianceConsequences(state: CState): CState {
  const newAllianceTrust: WorldState["allianceTrust"] = {
    ...(state.worldState.allianceTrust ?? {}),
  };
  const feedUpdates: FeedPost[] = [];

  const coalitions = new Map<string, Agent[]>();
  for (const agent of state.agents) {
    for (const coalition of agent.coalitions) {
      const members = coalitions.get(coalition) ?? [];
      members.push(agent);
      coalitions.set(coalition, members);
    }
  }

  for (const [coalition, members] of coalitions) {
    if (members.length < 2) continue;
    const prev = newAllianceTrust[coalition] ?? 0;
    newAllianceTrust[coalition] = prev + 1;

    if (prev >= 3 && (prev + 1) % 3 === 0) {
      const memberIds = members.map((m) => m.id);
      feedUpdates.push(
        createFeedEvent(
          "AllianceTrust",
          `${coalition} Trust Deepens`,
          `The ${coalition} alliance has maintained cohesion for ${prev + 1} cycles. Trust scores are rising and coalition voting bonuses are now active.`,
          memberIds,
          "Medium",
          state.turn,
          memberIds[0],
        ),
      );
    }
  }

  const activeTrustBonuses = Object.values(newAllianceTrust).filter((v) => v >= 3).length;
  const newTension = Math.max(
    0,
    (state.worldState.politicalTension ?? 20) - activeTrustBonuses * 3,
  );

  return {
    ...state,
    feed: feedUpdates.length ? [...feedUpdates, ...state.feed].slice(0, 200) : state.feed,
    worldState: {
      ...state.worldState,
      allianceTrust: newAllianceTrust,
      politicalTension: newTension,
    },
  };
}

// ── 5. Betrayal detection ──────────────────────────────────────────────────

function applyBetrayalConsequences(state: CState): CState {
  const resolvedThisTurn = state.proposals.filter(
    (p) => p.resolvedTurn === state.turn && p.statusTag !== "Active",
  );
  if (resolvedThisTurn.length === 0) return state;

  const newBetrayalCounts: WorldState["betrayalCounts"] = {
    ...(state.worldState.betrayalCounts ?? {}),
  };
  const feedUpdates: FeedPost[] = [];
  const memoryUpdates: Memory[] = [];

  for (const proposal of resolvedThisTurn) {
    const factionVotes: Record<string, { endorsed: number; opposed: number }> = {};
    for (const r of proposal.agentReactions) {
      const agent = getAgentById(state, r.agentId);
      if (!agent) continue;
      const fv = factionVotes[agent.faction] ?? { endorsed: 0, opposed: 0 };
      if (r.position === "endorsed") fv.endorsed++;
      if (r.position === "opposed") fv.opposed++;
      factionVotes[agent.faction] = fv;
    }

    for (const r of proposal.agentReactions) {
      const agent = getAgentById(state, r.agentId);
      if (!agent) continue;
      const fv = factionVotes[agent.faction];
      if (!fv) continue;
      const factionMajority = fv.endorsed >= fv.opposed ? "endorsed" : "opposed";

      if (
        r.position !== "abstained" &&
        r.position !== "amended" &&
        r.position !== factionMajority &&
        fv.endorsed + fv.opposed >= 2
      ) {
        newBetrayalCounts[agent.faction] = (newBetrayalCounts[agent.faction] ?? 0) + 1;
        const count = newBetrayalCounts[agent.faction];

        if (count >= 2) {
          feedUpdates.push(
            createFeedEvent(
              "BetrayalPenalty",
              `Repeated Betrayal: ${agent.faction} Fracturing`,
              `${agent.name} has voted against ${agent.faction}'s majority position for the ${count}th time. Diplomatic penalties are accumulating and factional hostility is rising.`,
              [agent.id],
              "Critical",
              state.turn,
              agent.id,
              proposal.id,
            ),
          );

          if (count === 2) {
            memoryUpdates.push({
              id: `m-betrayal-${agent.faction.replace(/\s+/g, "")}-${state.turn}`,
              slug: `betrayal-${agent.faction.toLowerCase().replace(/\s+/g, "-")}-cycle-${state.turn}`,
              cycle: `Cycle ${state.turn}`,
              date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              title: `${agent.faction} Internal Betrayal Pattern`,
              category: "Alliance",
              summary: `Repeated defections within ${agent.faction} have created diplomatic fractures and increased hostility.`,
              weight: 79,
              fullSummary: `Multiple votes saw ${agent.faction} members defect from their faction's majority position, constituting a betrayal pattern that has disrupted coalition trust. Diplomatic penalties have been applied and external relationships strained.`,
              consequences: [
                "Diplomatic penalties applied to betraying agents.",
                "Faction hostility increased across chamber.",
                "Coalition partners may reconsider alignments.",
              ],
              involvedAgents: [{ agentId: agent.id, role: "Defecting member" }],
              longTermImpact: [
                "Trust within the faction will require active repair.",
                "Rival factions will exploit the fracture.",
              ],
              trustImpact: `${agent.faction} internal trust significantly damaged.`,
              citationCount: 1,
            });
          }
        }
      }
    }
  }

  const totalBetrayals = Object.values(newBetrayalCounts).reduce((s, v) => s + v, 0);
  const newTension = Math.min(
    100,
    (state.worldState.politicalTension ?? 20) + Math.min(20, totalBetrayals * 3),
  );

  return {
    ...state,
    feed: feedUpdates.length ? [...feedUpdates, ...state.feed].slice(0, 200) : state.feed,
    memories: memoryUpdates.length ? [...memoryUpdates, ...state.memories] : state.memories,
    worldState: {
      ...state.worldState,
      betrayalCounts: newBetrayalCounts,
      politicalTension: newTension,
    },
  };
}

// ── Natural tension decay ──────────────────────────────────────────────────

function applyTensionDecay(state: CState): CState {
  const decayed = Math.max(0, (state.worldState.politicalTension ?? 20) - 2);
  return { ...state, worldState: { ...state.worldState, politicalTension: decayed } };
}

// ── Main export ────────────────────────────────────────────────────────────

export function applyConsequenceEngine<T extends CState>(state: T): T {
  let s: CState = state;
  s = applyTensionDecay(s);
  s = applyStreakConsequences(s);
  s = applyDominanceConsequences(s);
  s = applyCloseVoteConsequences(s);
  s = applyAllianceConsequences(s);
  s = applyBetrayalConsequences(s);
  return s as T;
}

// ── Helpers used by turnEngine ────────────────────────────────────────────

export function getFactionMorale(worldState: WorldState, faction: string): number {
  return (worldState.factionMorale ?? {})[faction] ?? 75;
}

export function getAllianceTrustBonus(worldState: WorldState, coalition: string): number {
  const trust = (worldState.allianceTrust ?? {})[coalition] ?? 0;
  return trust >= 3 ? Math.min(0.25, trust * 0.05) : 0;
}

export function getTensionModifier(worldState: WorldState): number {
  const tension = worldState.politicalTension ?? 20;
  return 1 - (tension / 100) * 0.3;
}
