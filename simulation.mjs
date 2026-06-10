/**
 * POLIS — Multi-Turn Simulation Engine
 * API:  initialWorldState() → state
 *       runTurn(state, action) → newState
 *
 * Run:  node simulation.mjs
 */

// ─── ANSI ─────────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  amber: "\x1b[33m",
  cyan: "\x1b[36m",
  crimson: "\x1b[31m",
  silver: "\x1b[37m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  white: "\x1b[97m",
  yellow: "\x1b[93m",
};
const FC = { Reformist: C.amber, Technocrat: C.cyan, Sovereign: C.crimson };
const col = (f, t) => `${FC[f] ?? C.silver}${t}${C.reset}`;
const bold = (t) => `${C.bold}${t}${C.reset}`;
const dim = (t) => `${C.dim}${t}${C.reset}`;
const vC = { support: C.green, oppose: C.crimson, abstain: C.silver };

// ─── STATIC SEED DATA ─────────────────────────────────────────────────────────

const BASE_AGENTS = [
  {
    id: "a01",
    name: "Kael Thorne",
    handle: "@kael.polis",
    faction: "Reformist",
    influence: 84,
    ideology: 35,
    traits: ["Deliberative", "Coalition-builder", "Memory-anchored"],
    votingHistory: ["support", "support", "oppose"],
  },
  {
    id: "a02",
    name: "Aurelia Vex",
    handle: "@aurelia.polis",
    faction: "Reformist",
    influence: 71,
    ideology: 42,
    traits: ["Principled", "Risk-averse", "Amendment-prone"],
    votingHistory: ["support", "oppose", "support"],
  },
  {
    id: "a03",
    name: "Lira Senne",
    handle: "@lira.polis",
    faction: "Reformist",
    influence: 58,
    ideology: 28,
    traits: ["Populist", "Empathic", "Reactionary"],
    votingHistory: ["support", "support", "abstain"],
  },
  {
    id: "a04",
    name: "Nyx Halberd",
    handle: "@nyx.polis",
    faction: "Technocrat",
    influence: 79,
    ideology: 60,
    traits: ["Analytical", "Probabilistic", "Detached"],
    votingHistory: ["oppose", "oppose", "support"],
  },
  {
    id: "a05",
    name: "Vega Mercer",
    handle: "@vega.polis",
    faction: "Technocrat",
    influence: 66,
    ideology: 52,
    traits: ["Empiricist", "Cautious", "Counterintuitive"],
    votingHistory: ["support", "support", "support"],
  },
  {
    id: "a06",
    name: "Caden Flux",
    handle: "@caden.polis",
    faction: "Technocrat",
    influence: 55,
    ideology: 58,
    traits: ["Optimiser", "Blunt", "Data-driven"],
    votingHistory: ["support", "abstain", "support"],
  },
  {
    id: "a07",
    name: "Iris Dant",
    handle: "@iris.polis",
    faction: "Technocrat",
    influence: 48,
    ideology: 55,
    traits: ["Sceptical", "Measured", "Model-reliant"],
    votingHistory: ["abstain", "oppose", "abstain"],
  },
  {
    id: "a08",
    name: "Rael Vonn",
    handle: "@rael.polis",
    faction: "Sovereign",
    influence: 88,
    ideology: 92,
    traits: ["Contrarian", "High-risk", "Dominant"],
    votingHistory: ["oppose", "oppose", "oppose"],
  },
  {
    id: "a09",
    name: "Mira Dusk",
    handle: "@mira.polis",
    faction: "Sovereign",
    influence: 63,
    ideology: 88,
    traits: ["Absolutist", "Memory-averse", "Isolationist"],
    votingHistory: ["oppose", "oppose", "oppose"],
  },
  {
    id: "a10",
    name: "Theo Wraith",
    handle: "@theo.polis",
    faction: "Sovereign",
    influence: 44,
    ideology: 78,
    traits: ["Volatile", "Expressive", "Anti-coalition"],
    votingHistory: ["oppose", "abstain", "oppose"],
  },
];

const BASE_FACTION_MEMORY = {
  Reformist: {
    mood: "confident",
    allies: ["Technocrat"],
    rivals: [],
    tense: ["Sovereign"],
    betrayals: [],
    grievances: [],
    alliances: [{ with: "Technocrat", since: 28 }],
    consecutiveWins: 0,
    consecutiveLosses: 0,
  },
  Technocrat: {
    mood: "cautious",
    allies: ["Reformist"],
    rivals: ["Sovereign"],
    tense: [],
    betrayals: [],
    grievances: [{ from: "Reformist", note: "Led opposition to POL-203" }],
    alliances: [{ with: "Reformist", since: 28 }],
    consecutiveWins: 0,
    consecutiveLosses: 0,
  },
  Sovereign: {
    mood: "resentful",
    allies: [],
    rivals: ["Technocrat"],
    tense: ["Reformist"],
    betrayals: [{ by: "Reformist", cycle: 28, event: "Concordat formation" }],
    grievances: [{ from: "chamber", note: "POL-244 defeat — sovereign will overridden" }],
    alliances: [],
    consecutiveWins: 0,
    consecutiveLosses: 2,
  },
};

const BASE_HISTORY = [
  {
    id: "POL-119",
    cycle: 18,
    title: "Treasury Collapse",
    outcome: "failed",
    emotionalWeight: 94,
    tags: ["treasury", "liquidity", "collapse"],
    consequence: "22% reserve drawdown. Chamber fractured for 3 cycles.",
  },
  {
    id: "POL-203",
    cycle: 24,
    title: "Austerity Mandate",
    outcome: "failed",
    emotionalWeight: 71,
    tags: ["austerity", "technocrat-grievance"],
    consequence: "Reformist–Sovereign joint bloc defeated Technocrats.",
  },
  {
    id: "POL-231",
    cycle: 28,
    title: "R–T Concordat",
    outcome: "passed",
    emotionalWeight: 82,
    tags: ["concordat", "alliance", "reformist"],
    consequence: "Reformist–Technocrat alliance formalised.",
  },
  {
    id: "POL-244",
    cycle: 30,
    title: "Sovereign Isolation Protocol",
    outcome: "failed",
    emotionalWeight: 88,
    tags: ["sovereignty", "sovereign-defeat"],
    consequence: "Sovereign bloc defeated 61–39. Rael Vonn vowed retribution.",
  },
];

// ─── PROPOSAL GENERATOR ───────────────────────────────────────────────────────

const PROPOSAL_POOL = [
  {
    title: "Sovereign Treasury Reallocation Act",
    text: "Reallocate 18% of the sovereign treasury into cross-chain liquidity vaults.",
    sponsor: "a01",
    supportBias: { Reformist: 0.85, Technocrat: 0.55, Sovereign: 0.05 },
    tags: ["treasury", "liquidity"],
    memoryRefs: ["POL-119", "POL-231"],
  },
  {
    title: "Emergency Quorum Reduction Protocol",
    text: "Lower the chamber quorum threshold from 60% to 45% for crisis-rated proposals.",
    sponsor: "a04",
    supportBias: { Reformist: 0.5, Technocrat: 0.7, Sovereign: 0.2 },
    tags: ["quorum", "process"],
    memoryRefs: ["POL-231"],
  },
  {
    title: "Faction Sovereignty Guarantee Act",
    text: "Constitutionally protect each faction's core reserves from collective reallocation.",
    sponsor: "a08",
    supportBias: { Reformist: 0.15, Technocrat: 0.3, Sovereign: 0.95 },
    tags: ["sovereignty", "protection"],
    memoryRefs: ["POL-119", "POL-244"],
  },
  {
    title: "Cross-Chain Yield Protocol v2",
    text: "Expand yield generation to include cross-chain validator staking on 0G-compatible chains.",
    sponsor: "a06",
    supportBias: { Reformist: 0.6, Technocrat: 0.8, Sovereign: 0.1 },
    tags: ["yield", "technocrat"],
    memoryRefs: ["POL-119"],
  },
  {
    title: "Chamber Transparency Mandate",
    text: "Require all faction coordination meetings to be logged on-chain within 48 hours.",
    sponsor: "a02",
    supportBias: { Reformist: 0.75, Technocrat: 0.65, Sovereign: 0.35 },
    tags: ["transparency", "process"],
    memoryRefs: ["POL-231"],
  },
  {
    title: "Sovereign Bloc Restoration Act",
    text: "Restore Sovereign bloc's pre-POL-231 veto rights over treasury decisions.",
    sponsor: "a08",
    supportBias: { Reformist: 0.1, Technocrat: 0.2, Sovereign: 0.99 },
    tags: ["veto", "sovereignty"],
    memoryRefs: ["POL-231", "POL-244"],
  },
  {
    title: "Emergency Coalition Dissolution Act",
    text: "Dissolve all active concordats and reset faction alignments to neutral.",
    sponsor: "a09",
    supportBias: { Reformist: 0.25, Technocrat: 0.3, Sovereign: 0.9 },
    tags: ["coalition", "dissolution"],
    memoryRefs: ["POL-231"],
  },
  {
    title: "Technocrat Data Sovereignty Protocol",
    text: "Grant Technocrat bloc exclusive authority over chamber data infrastructure and modelling.",
    sponsor: "a04",
    supportBias: { Reformist: 0.4, Technocrat: 0.9, Sovereign: 0.15 },
    tags: ["data", "technocrat"],
    memoryRefs: ["POL-203"],
  },
  {
    title: "Populist Redistribution Initiative",
    text: "Redistribute 12% of all faction reserves equally among registered chamber members.",
    sponsor: "a03",
    supportBias: { Reformist: 0.8, Technocrat: 0.35, Sovereign: 0.1 },
    tags: ["redistribution", "populist"],
    memoryRefs: ["POL-119"],
  },
  {
    title: "Cycle Reset Protocol — Constitutional",
    text: "Reset all influence scores to baseline and dissolve all active factions for a fresh cycle.",
    sponsor: "a10",
    supportBias: { Reformist: 0.2, Technocrat: 0.25, Sovereign: 0.55 },
    tags: ["reset", "constitutional"],
    memoryRefs: ["POL-203", "POL-244"],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function ideologyLabel(s) {
  if (s <= 20) return "Collectivist";
  if (s <= 40) return "Progressive";
  if (s <= 60) return "Centrist";
  if (s <= 80) return "Individualist";
  return "Absolutist";
}

function worldEmotionLabel(stability, totalGrievances, consecutiveLossFactions) {
  if (consecutiveLossFactions >= 2 && stability < 50) return "Fragmenting";
  if (stability >= 70 && totalGrievances <= 2) return "Stable";
  if (stability >= 55 && totalGrievances <= 4) return "Reforming";
  return "Tense";
}

function moodFromHistory(wins, losses, baseGrievances) {
  if (losses >= 3) return "volatile";
  if (losses >= 2) return "resentful";
  if (baseGrievances >= 2 && losses >= 1) return "resentful";
  if (wins >= 2) return "confident";
  return "cautious";
}

// Deterministic-ish seeded random using cycle + agent id hash
function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function agentVote(agent, proposal, factionMemory, cycle) {
  const faction = agent.faction;
  const fm = factionMemory[faction];
  const baseBias = proposal.supportBias[faction] ?? 0.5;

  // Ideology modifier: high individualism → resist collective proposals
  const ideologyMod = (agent.ideology - 50) / 100; // -0.5..+0.5
  const collectivism = proposal.tags.some((t) =>
    ["treasury", "liquidity", "redistribution", "coalition"].includes(t),
  );
  const ideoAdjust = collectivism ? -ideologyMod * 0.25 : +ideologyMod * 0.15;

  // Mood modifier
  const moodMod =
    { confident: +0.05, cautious: 0, resentful: -0.08, volatile: -0.14 }[fm.mood] ?? 0;

  // History: if last 2 votes were oppose, slight entrench
  const recentOpp = agent.votingHistory.slice(-2).every((v) => v === "oppose");
  const histMod = recentOpp ? -0.06 : 0;

  // Trait modifiers
  const traitMod =
    (agent.traits.includes("Contrarian") ? -0.08 : 0) +
    (agent.traits.includes("Coalition-builder") ? +0.05 : 0) +
    (agent.traits.includes("Principled") ? +0.03 : 0) +
    (agent.traits.includes("Volatile") ? (Math.random() > 0.5 ? +0.12 : -0.12) : 0) +
    (agent.traits.includes("Memory-anchored") ? (proposal.memoryRefs.length > 0 ? +0.04 : 0) : 0);

  const finalBias = clamp(baseBias + ideoAdjust + moodMod + histMod + traitMod, 0.02, 0.98);

  // Use seeded randomness for reproducibility within a cycle
  const r = seededRandom(cycle * 100 + parseInt(agent.id.slice(1)) * 7);

  if (r < finalBias * 0.85) return "support";
  if (r < finalBias * 0.85 + 0.12) return "abstain";
  return "oppose";
}

function computeInfluenceDelta(vote, outcome, influence) {
  if (vote === outcome) return +(influence * 0.06).toFixed(1);
  if (vote === "abstain") return -(influence * 0.015).toFixed(1);
  return -(influence * 0.07).toFixed(1);
}

function computeIdeologyDrift(agent, vote, outcome, factionMood) {
  const won = vote === outcome;
  let drift = 0;
  if (vote === "support") drift = won ? -1.2 : +1.8;
  if (vote === "oppose") drift = won ? +1.8 : -1.2;
  if (vote === "abstain") drift = 0;

  const m = {
    Contrarian: 1.6,
    Volatile: 1.8,
    Principled: 0.6,
    Deliberative: 0.7,
    "Memory-anchored": 0.5,
    Absolutist: 1.4,
    Analytical: 0.8,
    Optimiser: 1.0,
    Populist: 1.1,
  };
  for (const [trait, mul] of Object.entries(m)) {
    if (agent.traits.includes(trait)) {
      drift *= mul;
      break;
    }
  }
  if (factionMood === "resentful") drift *= 1.4;
  if (factionMood === "volatile") drift *= 1.8;
  if (factionMood === "confident") drift *= 0.7;

  return clamp(agent.ideology + drift, 0, 100);
}

// ─── CORE ENGINE ──────────────────────────────────────────────────────────────

export function initialWorldState() {
  return {
    cycle: 31,
    agents: BASE_AGENTS.map((a) => ({ ...a, votingHistory: [...a.votingHistory] })),
    factionMemory: {
      Reformist: {
        ...BASE_FACTION_MEMORY.Reformist,
        grievances: [...BASE_FACTION_MEMORY.Reformist.grievances],
        betrayals: [...BASE_FACTION_MEMORY.Reformist.betrayals],
      },
      Technocrat: {
        ...BASE_FACTION_MEMORY.Technocrat,
        grievances: [...BASE_FACTION_MEMORY.Technocrat.grievances],
        betrayals: [...BASE_FACTION_MEMORY.Technocrat.betrayals],
      },
      Sovereign: {
        ...BASE_FACTION_MEMORY.Sovereign,
        grievances: [...BASE_FACTION_MEMORY.Sovereign.grievances],
        betrayals: [...BASE_FACTION_MEMORY.Sovereign.betrayals],
      },
    },
    history: BASE_HISTORY.map((e) => ({ ...e })),
    proposalIndex: 0,
    worldState: {
      cycle: 31,
      dominantFaction: "Technocrat",
      stability: 58,
      emotion: "Tense",
      factionShares: { Reformist: 32.5, Technocrat: 37.8, Sovereign: 29.7 },
      factionMoods: { Reformist: "confident", Technocrat: "cautious", Sovereign: "resentful" },
      totalInfluence: 656,
      recentOutcomes: [],
      lastProposal: null,
      grievanceCount: 3,
      log: [],
    },
  };
}

export async function runTurn(state, action) {
  const turnLog = [];
  const log = (...args) => turnLog.push(args.join(" "));

  // ── Deep-clone mutable state ────────────────────────────────────────────────
  let agents = state.agents.map((a) => ({ ...a, votingHistory: [...a.votingHistory] }));
  let factionMemory = {
    Reformist: {
      ...state.factionMemory.Reformist,
      grievances: [...state.factionMemory.Reformist.grievances],
      betrayals: [...state.factionMemory.Reformist.betrayals],
    },
    Technocrat: {
      ...state.factionMemory.Technocrat,
      grievances: [...state.factionMemory.Technocrat.grievances],
      betrayals: [...state.factionMemory.Technocrat.betrayals],
    },
    Sovereign: {
      ...state.factionMemory.Sovereign,
      grievances: [...state.factionMemory.Sovereign.grievances],
      betrayals: [...state.factionMemory.Sovereign.betrayals],
    },
  };
  const history = [...state.history];
  const cycle = state.cycle + 1;
  let proposalIndex = state.proposalIndex;

  // ── Select or build proposal ─────────────────────────────────────────────────
  let proposal;
  if (action.type === "PLAYER_PROPOSAL" && action.data) {
    proposal = { ...action.data, id: `POL-${240 + cycle}` };
  } else {
    // Auto-select: pick the pool entry that fits the current emotional state best
    const emotion = state.worldState.emotion;
    const dominant = state.worldState.dominantFaction;
    let idx = proposalIndex % PROPOSAL_POOL.length;

    // Bias toward faction-appropriate proposals based on dominant mood
    if (emotion === "Fragmenting" || emotion === "Tense") {
      const sovProps = [2, 5, 6, 9]; // sovereign / dissolution / reset
      if (dominant !== "Sovereign")
        idx =
          PROPOSAL_POOL.findIndex(
            (p, i) => !sovProps.includes(i) && i >= proposalIndex % PROPOSAL_POOL.length,
          ) !== -1
            ? PROPOSAL_POOL.findIndex(
                (p, i) => !sovProps.includes(i) && i >= proposalIndex % PROPOSAL_POOL.length,
              )
            : idx;
    }

    proposal = {
      ...PROPOSAL_POOL[idx],
      id: `POL-${240 + cycle}`,
    };
    proposalIndex = idx + 1;
  }

  log(
    `▸ ${proposal.id} — "${proposal.title}" — sponsored by ${agents.find((a) => a.id === proposal.sponsor)?.name ?? "Unknown"}`,
  );

  // ── Agent votes ──────────────────────────────────────────────────────────────
  const votes = {};
  let supportWeight = 0,
    opposeWeight = 0,
    abstainWeight = 0;

  for (const agent of agents) {
    const vote = agentVote(agent, proposal, factionMemory, cycle);
    votes[agent.id] = vote;
    if (vote === "support") supportWeight += agent.influence;
    if (vote === "oppose") opposeWeight += agent.influence;
    if (vote === "abstain") abstainWeight += agent.influence;
    log(
      `  ${agent.name.padEnd(14)} [${vote.padEnd(7)}] influence:${agent.influence} ideology:${agent.ideology.toFixed(1)}`,
    );
  }

  const totalVoteWeight = supportWeight + opposeWeight + abstainWeight;
  const grandTotal = agents.reduce((s, a) => s + a.influence, 0);
  const quorumMet = totalVoteWeight >= grandTotal * 0.6;
  const outcome = supportWeight > opposeWeight ? "support" : "oppose";
  const passed = outcome === "support" && quorumMet;

  const sPct = ((supportWeight / totalVoteWeight) * 100).toFixed(1);
  const oPct = ((opposeWeight / totalVoteWeight) * 100).toFixed(1);
  const aPct = ((abstainWeight / totalVoteWeight) * 100).toFixed(1);

  log(
    `  SUPPORT ${sPct}% · OPPOSE ${oPct}% · ABSTAIN ${aPct}% · quorum:${quorumMet ? "MET" : "MISSED"} · verdict:${passed ? "PASSED" : "REJECTED"}`,
  );

  // ── Influence + ideology evolution ───────────────────────────────────────────
  const influenceEvolution = {};
  const ideologyEvolution = {};

  for (const agent of agents) {
    const vote = votes[agent.id];
    const delta = computeInfluenceDelta(vote, outcome, agent.influence);
    const newInf = clamp(+(agent.influence + +delta).toFixed(1), 1, 100);

    const fm = factionMemory[agent.faction];
    const newIdeo = +computeIdeologyDrift(agent, vote, outcome, fm.mood).toFixed(1);

    influenceEvolution[agent.id] = { before: agent.influence, after: newInf, delta: +delta };
    ideologyEvolution[agent.id] = { before: agent.ideology, after: newIdeo };

    agent.influence = newInf;
    agent.ideology = newIdeo;
    agent.votingHistory = [...agent.votingHistory.slice(-4), vote];
  }

  // ── Faction memory updates ───────────────────────────────────────────────────
  const FACTIONS = ["Reformist", "Technocrat", "Sovereign"];
  for (const fname of FACTIONS) {
    const fm = factionMemory[fname];
    const members = agents.filter((a) => a.faction === fname);
    const fVotes = members.map((a) => votes[a.id]);
    const fSupport = fVotes.filter((v) => v === "support").length;
    const fWon =
      (passed && fSupport > members.length / 2) || (!passed && fSupport <= members.length / 2);

    if (fWon) {
      fm.consecutiveWins++;
      fm.consecutiveLosses = 0;
    } else {
      fm.consecutiveLosses++;
      fm.consecutiveWins = 0;
      // add grievance if dominant faction pushed this through against us
      const dominantForced = passed && fname === "Sovereign";
      if (dominantForced) {
        fm.grievances = [
          ...fm.grievances,
          { from: "chamber", cycle, note: `${proposal.id} passed over sovereign opposition` },
        ];
      }
    }

    fm.mood = moodFromHistory(fm.consecutiveWins, fm.consecutiveLosses, fm.grievances.length);

    // Betrayal detection: an ally voted majority-oppose on this faction's proposal
    if (proposal.sponsor && agents.find((a) => a.id === proposal.sponsor)?.faction === fname) {
      for (const allyName of fm.allies) {
        const allyMembers = agents.filter((a) => a.faction === allyName);
        const allyOpp = allyMembers.filter((a) => votes[a.id] === "oppose").length;
        if (allyOpp > allyMembers.length / 2) {
          fm.betrayals = [
            ...fm.betrayals,
            { by: allyName, cycle, event: `${proposal.id} — allied faction opposed sponsor` },
          ];
          log(`  ⚠ BETRAYAL: ${allyName} opposed ${fname}'s proposal — logged in faction memory`);
        }
      }
    }
  }

  // ── Archive to history ───────────────────────────────────────────────────────
  const emotionalWeight = Math.round(
    (Math.abs(supportWeight - opposeWeight) / totalVoteWeight) * 100 * 0.6 + 30,
  );
  history.push({
    id: proposal.id,
    cycle,
    title: proposal.title,
    outcome: passed ? "passed" : "failed",
    emotionalWeight,
    tags: proposal.tags,
    consequence: passed
      ? `${proposal.title} enacted. ${agents.find((a) => a.id === proposal.sponsor)?.faction} influence +${(supportWeight * 0.06).toFixed(0)}.`
      : `${proposal.title} defeated. Opposition solidified around ${outcome === "oppose" ? "Sovereign" : "Reformist"} bloc.`,
    factionVotes: Object.fromEntries(
      FACTIONS.map((f) => {
        const ms = agents.filter((a) => a.faction === f);
        const sup = ms.filter((a) => votes[a.id] === "support").length;
        return [f, sup > ms.length / 2 ? "support" : sup < ms.length / 2 ? "oppose" : "split"];
      }),
    ),
  });

  // ── World state recompute ────────────────────────────────────────────────────
  const newGrandTotal = agents.reduce((s, a) => s + a.influence, 0);
  const factionTotals = Object.fromEntries(
    FACTIONS.map((f) => [
      f,
      agents.filter((a) => a.faction === f).reduce((s, a) => s + a.influence, 0),
    ]),
  );
  const factionShares = Object.fromEntries(
    Object.entries(factionTotals).map(([f, t]) => [f, +((t / newGrandTotal) * 100).toFixed(1)]),
  );
  const dominant = Object.entries(factionTotals).sort((a, b) => b[1] - a[1])[0][0];
  const factionSpread =
    Math.max(...Object.values(factionTotals)) - Math.min(...Object.values(factionTotals));
  const grievanceCount = FACTIONS.reduce((s, f) => s + factionMemory[f].grievances.length, 0);
  const lossyFactions = FACTIONS.filter((f) => factionMemory[f].consecutiveLosses >= 2).length;

  // Stability: starts from prev, moves toward outcome
  const stabilityTarget = passed ? 65 : 42;
  const prevStability = state.worldState.stability;
  const stability = Math.round(prevStability * 0.6 + stabilityTarget * 0.4);

  const emotion = worldEmotionLabel(stability, grievanceCount, lossyFactions);

  const recentOutcomes = [
    ...(state.worldState.recentOutcomes ?? []).slice(-4),
    `${proposal.id}:${passed ? "PASSED" : "REJECTED"}`,
  ];

  log(
    `  worldState → dominant:${dominant} stability:${stability} emotion:${emotion} grievances:${grievanceCount}`,
  );

  const newWorldState = {
    cycle,
    dominantFaction: dominant,
    stability,
    emotion,
    factionShares,
    factionMoods: Object.fromEntries(FACTIONS.map((f) => [f, factionMemory[f].mood])),
    totalInfluence: +newGrandTotal.toFixed(1),
    recentOutcomes,
    grievanceCount,
    lastProposal: {
      id: proposal.id,
      title: proposal.title,
      passed,
      supportPct: +sPct,
      opposePct: +oPct,
      abstainPct: +aPct,
      quorumMet,
    },
    influenceEvolution: Object.fromEntries(
      Object.entries(influenceEvolution).map(([id, e]) => {
        const agent = agents.find((a) => a.id === id);
        return [agent.name, { before: e.before, after: e.after, delta: e.delta, vote: votes[id] }];
      }),
    ),
    ideologyEvolution: Object.fromEntries(
      Object.entries(ideologyEvolution).map(([id, e]) => {
        const agent = agents.find((a) => a.id === id);
        return [agent.name, { before: e.before, after: e.after, label: ideologyLabel(e.after) }];
      }),
    ),
    factionMemorySummary: Object.fromEntries(
      FACTIONS.map((f) => [
        f,
        {
          mood: factionMemory[f].mood,
          grievances: factionMemory[f].grievances.length,
          betrayals: factionMemory[f].betrayals.length,
          consecutiveWins: factionMemory[f].consecutiveWins,
          consecutiveLosses: factionMemory[f].consecutiveLosses,
        },
      ]),
    ),
    historyLength: history.length,
    log: turnLog,
  };

  return {
    cycle,
    agents,
    factionMemory,
    history,
    proposalIndex,
    worldState: newWorldState,
  };
}

// ─── PRETTY PRINT HELPER ──────────────────────────────────────────────────────

function printTurnSummary(turn, ws) {
  const eColors = { Stable: C.green, Reforming: C.cyan, Tense: C.yellow, Fragmenting: C.crimson };
  const eC = eColors[ws.emotion] ?? C.silver;
  const p = ws.lastProposal;
  const vC2 = p.passed ? C.green : C.crimson;

  console.log(
    `  ${C.dim}Cy${C.reset}${bold(ws.cycle)}  ` +
      `${C.amber}${bold(p.id)}${C.reset} "${p.title.slice(0, 36)}"  ` +
      `${vC2}${bold(p.passed ? "PASSED" : "REJECTED")}${C.reset}  ` +
      `${C.magenta}${ws.support}%${C.reset}  ` +
      `dominant:${col(ws.dominantFaction, ws.dominantFaction)}  ` +
      `stability:${bold(ws.stability)}  ` +
      `${eC}${bold(ws.emotion)}${C.reset}  ` +
      `grievances:${ws.grievanceCount}`,
  );

  const moods = Object.entries(ws.factionMoods)
    .map(([f, m]) => `${col(f, f)}:${C.dim}${m}${C.reset}`)
    .join("  ");
  console.log(`  moods → ${moods}`);

  // Show biggest ideology shifts
  const shifts = Object.entries(ws.ideologyEvolution)
    .map(([name, e]) => ({ name, delta: e.after - e.before, label: e.label }))
    .filter((x) => Math.abs(x.delta) >= 1.5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  if (shifts.length)
    console.log(
      `  ideology shifts → ${shifts.map((s) => `${dim(s.name)} ${s.delta > 0 ? C.crimson + "▶" : C.green + "◀"}${C.reset}${Math.abs(s.delta).toFixed(1)}`).join("  ")}`,
    );
}

// ─── ENTRY POINT — only runs when executed directly ───────────────────────────

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const bar = "═".repeat(68);
  console.log(`\n${C.bold}${C.white}${bar}`);
  console.log(`  POLIS — Multi-Turn Simulation  ·  0G Galileo  ·  Chain ID 16602`);
  console.log(`${bar}${C.reset}\n`);

  let state = initialWorldState();

  for (let i = 0; i < 10; i++) {
    console.log(`\n${C.bold}${C.white}${"─".repeat(68)}${C.reset}`);
    console.log(`${C.bold}  === TURN ${i} ===${C.reset}`);
    console.log(`${C.bold}${C.white}${"─".repeat(68)}${C.reset}`);

    state = await runTurn(state, { type: "PLAYER_PROPOSAL", data: null });

    printTurnSummary(i, state.worldState);

    console.log(`\n${C.dim}worldState:${C.reset}`);
    console.log(JSON.stringify(state.worldState, null, 2));
  }

  console.log(
    `\n${C.bold}${C.green}Simulation complete — ${state.history.length} events archived to 0G memory.${C.reset}\n`,
  );
}
