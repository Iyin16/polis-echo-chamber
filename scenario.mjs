/**
 * POLIS — Betrayal Arc Scenario
 * 6-turn scripted narrative: Reformist collapse → Technocrat power grab → Sovereign coalition
 *
 * Run: node scenario.mjs
 */

import { initialWorldState, runTurn } from "./simulation.mjs";

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
  blue: "\x1b[34m",
  orange: "\x1b[38;5;208m",
};
const FC = { Reformist: C.amber, Technocrat: C.cyan, Sovereign: C.crimson };
const col = (f, t) => `${FC[f] ?? C.silver}${t}${C.reset}`;
const bold = (t) => `${C.bold}${t}${C.reset}`;
const dim = (t) => `${C.dim}${t}${C.reset}`;
const ital = (t) => `${C.italic}${t}${C.reset}`;

const W = 70;
const hr = (ch = "─", color = C.dim) => console.log(`${color}${ch.repeat(W)}${C.reset}`);
const hdr = (t, color = C.white) => {
  console.log(`\n${color}${C.bold}${"═".repeat(W)}\n  ${t}\n${"═".repeat(W)}${C.reset}`);
};
const sub = (t, color = C.magenta) => console.log(`\n${color}${C.bold}  ▸ ${t}${C.reset}`);
const log = (t) => console.log(`  ${t}`);
const blank = () => console.log("");

// ─── EMOTION STYLING ──────────────────────────────────────────────────────────
const EMOTION_STYLE = {
  Stable: { color: C.green, icon: "◉", bar: "▓" },
  Reforming: { color: C.cyan, icon: "◈", bar: "▓" },
  Tense: { color: C.yellow, icon: "◆", bar: "▓" },
  Fragmenting: { color: C.crimson, icon: "◌", bar: "░" },
};

function emotionTag(e) {
  const s = EMOTION_STYLE[e] ?? { color: C.silver, icon: "·", bar: "░" };
  return `${s.color}${C.bold}${s.icon} ${e}${C.reset}`;
}

function stabilityBar(n, width = 28) {
  const filled = Math.round((n / 100) * width);
  const color = n >= 65 ? C.green : n >= 50 ? C.yellow : C.crimson;
  return `${color}${"█".repeat(filled)}${C.dim}${"░".repeat(width - filled)}${C.reset} ${bold(n + "%")}`;
}

function influenceBar(share, width = 18) {
  const filled = Math.round((share / 100) * width);
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function ideologyLabel(s) {
  if (s <= 20) return "Collectivist";
  if (s <= 40) return "Progressive";
  if (s <= 60) return "Centrist";
  if (s <= 80) return "Individualist";
  return "Absolutist";
}

function moodColor(m) {
  return (
    { confident: C.green, cautious: C.cyan, resentful: C.yellow, volatile: C.crimson }[m] ??
    C.silver
  );
}

// ─── SCRIPTED PROPOSALS ───────────────────────────────────────────────────────
// supportBias drives vote outcomes — 0.99 = almost certain support, 0.01 = almost certain oppose

const ACTS = [
  {
    // TURN 0 — Reformist major proposal, Technocrats + Sovereigns unite to kill it
    id: "POL-247",
    title: "Reformist Solidarity Pact",
    text: "Constitutionalise collective deliberation rights for all chamber members, binding factions to a joint quorum mandate.",
    sponsor: "a01",
    tags: ["collective", "solidarity", "reformist"],
    supportBias: { Reformist: 0.99, Technocrat: 0.03, Sovereign: 0.02 },
    memoryRefs: ["POL-231"],
    narrative: {
      setup:
        "Kael Thorne tables his most ambitious proposal yet — a collective solidarity pact designed to entrench Reformist values in the chamber's constitutional fabric.",
      betrayal:
        "What Thorne doesn't know: Technocrats and Sovereigns have been coordinating in private. The concordat that once shielded Reformists is about to be turned against them.",
      aftermath:
        "The chamber delivers a humiliating verdict. Reformists stand alone. The Technocrat–Sovereign tactical bloc has drawn first blood.",
    },
  },
  {
    // TURN 1 — Technocrats capitalise, Sovereigns lend strategic support
    id: "POL-248",
    title: "Technocrat Algorithmic Authority Act",
    text: "Transfer chamber deliberation scheduling and data modelling authority exclusively to the Technocrat bloc's governance engine.",
    sponsor: "a04",
    tags: ["technocrat", "authority", "data"],
    supportBias: { Reformist: 0.04, Technocrat: 0.99, Sovereign: 0.82 },
    memoryRefs: ["POL-203"],
    narrative: {
      setup:
        "Nyx Halberd moves fast. Before Reformists can regroup, Technocrats table a sweeping authority grab — and Sovereigns decide it suits them to let it pass.",
      betrayal:
        "Sovereigns smile as they vote yes. A dominant Technocrat is easier to manoeuvre around than a united chamber. For now, the enemy of their enemy is their instrument.",
      aftermath:
        "The act passes. Technocrat influence surges. Reformists are shut out of the modelling infrastructure they built. The chamber is shifting.",
    },
  },
  {
    // TURN 2 — Technocrats consolidate, Sovereigns grow uneasy
    id: "POL-249",
    title: "Technocrat Data Supremacy Mandate",
    text: "Mandate all cross-chain governance data be processed exclusively through Technocrat-certified validators, with a 7-day blackout on competing models.",
    sponsor: "a06",
    tags: ["technocrat", "data", "monopoly"],
    supportBias: { Reformist: 0.05, Technocrat: 0.98, Sovereign: 0.42 },
    memoryRefs: ["POL-203"],
    narrative: {
      setup:
        "Caden Flux pushes the consolidation further — a data monopoly dressed as infrastructure governance. Sovereigns, who voted yes last cycle, begin to read the fine print.",
      betrayal:
        "The Sovereign bloc fractures on this vote. Rael Vonn realises the Technocrats are building a cage — just a more elegant one than the Reformists were proposing.",
      aftermath:
        "It passes, but only barely. The Technocrat–Sovereign tactical bloc is cracking. A new calculation is forming in the Sovereign chamber.",
    },
  },
  {
    // TURN 3 — Sovereign–Reformist coalition forms
    id: "POL-250",
    title: "Anti-Hegemony Emergency Pact",
    text: "Formally recognise the Technocrat bloc as a structural threat to chamber pluralism and enact a binding multi-faction counter-governance agreement.",
    sponsor: "a08",
    tags: ["coalition", "sovereignty", "anti-technocrat"],
    supportBias: { Reformist: 0.94, Technocrat: 0.02, Sovereign: 0.99 },
    memoryRefs: ["POL-244", "POL-231"],
    narrative: {
      setup:
        "Rael Vonn sends an encrypted memo to Kael Thorne: 'We were never enemies. We were both targets.' Thorne, humiliated and furious after POL-247's defeat, accepts.",
      betrayal:
        "This is the pivot. A Sovereign–Reformist coalition — ideologically incompatible, strategically inevitable — declares itself in the chamber. The Technocrats are flanked.",
      aftermath:
        "The pact passes with overwhelming weight. The coalition is real. Faction memory is rewritten: the old concordat is dead, a new axis has emerged.",
    },
  },
  {
    // TURN 4 — Coalition strikes Technocrat power
    id: "POL-251",
    title: "Technocrat Oversight and Accountability Act",
    text: "Dissolve the Technocrat data authority granted by POL-248, establish a multi-faction oversight board, and freeze all unilateral Technocrat governance actions for 3 cycles.",
    sponsor: "a02",
    tags: ["accountability", "coalition", "reversal"],
    supportBias: { Reformist: 0.97, Technocrat: 0.01, Sovereign: 0.97 },
    memoryRefs: ["POL-248", "POL-249"],
    narrative: {
      setup:
        "The coalition's first act of power: dismantling everything the Technocrats built in Turns 1 and 2. Aurelia Vex sponsors the reversal, knowing its passage will define the new order.",
      betrayal:
        "Technocrats watch both their former allies and former enemies vote to strip them of authority gained just two cycles ago. The speed of the reversal is the message.",
      aftermath:
        "POL-251 passes decisively. Technocrat influence collapses. Their mood flips to volatile. The chamber has a new governing axis — and it is furious.",
    },
  },
  {
    // TURN 5 — New constitutional order
    id: "POL-252",
    title: "Plural Sovereignty Constitutional Amendment",
    text: "Enshrine faction sovereignty guarantees and a rotating deliberation mandate into the chamber's foundational charter, preventing any single bloc from achieving structural dominance.",
    sponsor: "a08",
    tags: ["constitutional", "sovereignty", "pluralism"],
    supportBias: { Reformist: 0.88, Technocrat: 0.06, Sovereign: 0.99 },
    memoryRefs: ["POL-244", "POL-251"],
    narrative: {
      setup:
        "The coalition's endgame: a constitutional amendment that makes it structurally impossible for any single faction — including themselves — to repeat what the Technocrats attempted.",
      betrayal:
        "Technocrats mount a last stand with fierce floor rhetoric. It changes nothing. The votes were decided in the corridors before the chamber opened.",
      aftermath:
        "The amendment passes. The new world order is written into the chamber's DNA. What began as Reformist humiliation ends with a constitutional guarantee of plural sovereignty.",
    },
  },
];

// ─── AGENT SNAPSHOT ───────────────────────────────────────────────────────────

function agentSnapshot(agents) {
  return agents.reduce((m, a) => {
    m[a.id] = { influence: a.influence, ideology: a.ideology };
    return m;
  }, {});
}

// ─── TURN RENDERER ────────────────────────────────────────────────────────────

function renderTurn(turnIndex, act, ws, prevWs, agentsBefore, agentsAfter) {
  const p = ws.lastProposal;
  const passed = p.passed;
  const vC = passed ? C.green : C.crimson;

  // ── Turn header ────────────────────────────────────────────────────────────
  hdr(`TURN ${turnIndex}  ·  ${act.id}  ·  "${act.title}"`, vC);

  // ── Narrative setup ────────────────────────────────────────────────────────
  sub("SCENARIO", C.magenta);
  log(ital(act.narrative.setup));
  blank();
  log(`${C.yellow}${C.bold}  ⚑  ${act.narrative.betrayal}${C.reset}`);

  // ── Vote results ───────────────────────────────────────────────────────────
  sub("VOTE RESULT", vC);

  const supportBar = "█".repeat(Math.round(p.supportPct / 5));
  const opposeBar = "█".repeat(Math.round(p.opposePct / 5));
  const abstainBar = "█".repeat(Math.round(p.abstainPct / 5));

  log(`  SUPPORT  ${C.green}${supportBar.padEnd(20)}${C.reset}  ${p.supportPct}%`);
  log(`  OPPOSE   ${C.crimson}${opposeBar.padEnd(20)}${C.reset}  ${p.opposePct}%`);
  log(`  ABSTAIN  ${C.silver}${abstainBar.padEnd(20)}${C.reset}  ${p.abstainPct}%`);
  blank();
  log(`${vC}${C.bold}  ━━━  VERDICT: ${act.id} — ${passed ? "PASSED" : "REJECTED"}  ━━━${C.reset}`);

  // ── Narrative aftermath ────────────────────────────────────────────────────
  blank();
  log(ital(act.narrative.aftermath));

  // ── Faction power shift ────────────────────────────────────────────────────
  sub("FACTION POWER SHIFT", C.white);

  const FACTIONS = ["Reformist", "Technocrat", "Sovereign"];
  for (const f of FACTIONS) {
    const before = prevWs.factionShares[f] ?? 0;
    const after = ws.factionShares[f] ?? 0;
    const delta = +(after - before).toFixed(1);
    const dColor = delta >= 0 ? C.green : C.crimson;
    const dSign = delta >= 0 ? "▲" : "▼";
    const mood = ws.factionMoods[f];
    const mC = moodColor(mood);
    const bar = `${FC[f]}${influenceBar(after)}${C.reset}`;

    log(
      `  ${col(f, bold(f.padEnd(11)))}  ` +
        `${bar}  ` +
        `${bold(String(after) + "%").padEnd(8)}  ` +
        `${dColor}${dSign} ${Math.abs(delta)}%${C.reset}  ` +
        `mood: ${mC}${bold(mood)}${C.reset}`,
    );
  }

  // ── Agent influence shifts ─────────────────────────────────────────────────
  sub("AGENT EVOLUTION", C.cyan);

  const evo = ws.influenceEvolution ?? {};
  const ide = ws.ideologyEvolution ?? {};

  for (const agent of agentsAfter) {
    const e = evo[agent.name];
    const d = ide[agent.name];
    if (!e || !d) continue;

    const infDelta =
      e.delta >= 0
        ? `${C.green}▲${e.delta}${C.reset}`
        : `${C.crimson}▼${Math.abs(e.delta)}${C.reset}`;
    const idDelta = (d.after - d.before).toFixed(1);
    const idDir =
      +idDelta > 0
        ? `${C.crimson}→ indiv${C.reset}`
        : +idDelta < 0
          ? `${C.green}→ collec${C.reset}`
          : `${C.dim}stable${C.reset}`;
    const voteStr = e.vote;
    const vColor = { support: C.green, oppose: C.crimson, abstain: C.silver }[voteStr];

    log(
      `  ${col(agent.faction, agent.name.padEnd(13))} ` +
        `${vColor}${voteStr.padEnd(8)}${C.reset} ` +
        `inf: ${String(e.before).padStart(5)} → ${bold(String(e.after).padStart(5))}  ${infDelta}  ` +
        `ideology: ${d.before.toFixed(1)} → ${bold(d.after.toFixed(1))}  ${idDir}`,
    );
  }

  // ── World state ────────────────────────────────────────────────────────────
  sub("WORLD STATE", C.white);
  log(`  stability  : ${stabilityBar(ws.stability)}`);
  log(`  emotion    : ${emotionTag(ws.emotion)}`);
  log(`  dominant   : ${col(ws.dominantFaction, bold(ws.dominantFaction))}`);
  log(
    `  grievances : ${ws.grievanceCount}  ${ws.grievanceCount >= 5 ? C.crimson + "⚠ critical" + C.reset : ""}`,
  );
  log(`  history    : ${ws.historyLength} events archived to 0G`);

  blank();
  hr("─", C.dim);
}

// ─── ARC SUMMARY ─────────────────────────────────────────────────────────────

function renderArcSummary(snapshots, initialAgents) {
  hdr("ARC SUMMARY — 6-Turn Emotional Trajectory", C.white);

  // Emotion timeline
  sub("WORLD EMOTION ARC", C.magenta);
  blank();
  log(
    `  ${"Turn".padEnd(6)}  ${"Proposal".padEnd(10)}  ${"Stability".padEnd(8)}  ${"Emotion".padEnd(14)}  ${"Dominant".padEnd(11)}  Grievances`,
  );
  hr("·", C.dim);

  for (const [i, s] of snapshots.entries()) {
    const ws = s.worldState;
    const p = ws.lastProposal;
    const pC = p.passed ? C.green : C.crimson;
    const eS = EMOTION_STYLE[ws.emotion] ?? { color: C.silver };
    log(
      `  ${bold(("T" + i).padEnd(6))}  ` +
        `${C.amber}${p.id.padEnd(10)}${C.reset}  ` +
        `${stabilityBar(ws.stability, 8)}  ` +
        `${eS.color}${ws.emotion.padEnd(14)}${C.reset}  ` +
        `${col(ws.dominantFaction, ws.dominantFaction.padEnd(11))}  ` +
        `${ws.grievanceCount}`,
    );
  }

  // Faction influence trajectory
  sub("FACTION INFLUENCE TRAJECTORY", C.cyan);
  blank();

  const FACTIONS = ["Reformist", "Technocrat", "Sovereign"];
  for (const f of FACTIONS) {
    const shares = snapshots.map((s) => s.worldState.factionShares[f] ?? 0);
    const sparkline = shares
      .map((v) => {
        if (v >= 38) return `${FC[f]}█${C.reset}`;
        if (v >= 34) return `${FC[f]}▆${C.reset}`;
        if (v >= 30) return `${FC[f]}▄${C.reset}`;
        if (v >= 26) return `${FC[f]}▂${C.reset}`;
        return `${C.dim}▁${C.reset}`;
      })
      .join(" ");

    const final = shares[shares.length - 1];
    const start = shares[0];
    const delta = +(final - start).toFixed(1);
    const dColor = delta >= 0 ? C.green : C.crimson;

    log(
      `  ${col(f, bold(f.padEnd(11)))}  T0→T5: ${sparkline}   ${String(start) + "%"} → ${bold(final + "%")}  ${dColor}${delta >= 0 ? "▲" : "▼"}${Math.abs(delta)}%${C.reset}`,
    );
  }

  // Ideology drift across all turns
  sub("AGENT IDEOLOGY DRIFT — Start → End", C.amber);
  blank();
  log(
    `  ${"Agent".padEnd(14)}  ${"Faction".padEnd(11)}  ${"Start".padEnd(16)}  ${"End".padEnd(18)}  Delta`,
  );
  hr("·", C.dim);

  for (const agent of initialAgents) {
    const finalAgent = snapshots[snapshots.length - 1].agents.find((a) => a.id === agent.id);
    if (!finalAgent) continue;

    const before = agent.ideology;
    const after = finalAgent.ideology;
    const delta = +(after - before).toFixed(1);
    const dColor = delta > 0 ? C.crimson : delta < 0 ? C.green : C.dim;
    const dSign = delta > 0 ? "▶ individualist" : delta < 0 ? "◀ collectivist" : "stable";
    const bLabel = ideologyLabel(before).padEnd(14);
    const aLabel = ideologyLabel(after).padEnd(16);

    log(
      `  ${col(agent.faction, agent.name.padEnd(14))}  ` +
        `${col(agent.faction, agent.faction.padEnd(11))}  ` +
        `${dim(String(before).padStart(4))} ${dim(bLabel)}  ` +
        `${bold(String(after).padStart(4))} ${aLabel}  ` +
        `${dColor}${delta >= 0 ? "+" : ""}${delta}  ${dSign}${C.reset}`,
    );
  }

  // Key events
  sub("KEY EVENTS — Betrayals & Coalitions", C.crimson);
  blank();

  const events = [
    {
      turn: 0,
      color: C.crimson,
      icon: "✗",
      text: "Technocrat–Sovereign tactical bloc defeats Reformist Solidarity Pact — Reformist concordat protection collapses",
    },
    {
      turn: 1,
      color: C.cyan,
      icon: "▲",
      text: "Technocrats table authority grab — Sovereigns vote yes, instrumentalising their former rivals' weakness",
    },
    {
      turn: 2,
      color: C.yellow,
      icon: "⚠",
      text: "Sovereign bloc fractures on Data Supremacy Mandate — Rael Vonn begins reading the Technocrat endgame",
    },
    {
      turn: 3,
      color: C.amber,
      icon: "◈",
      text: "BETRAYAL RESOLVED: Sovereign–Reformist Emergency Pact declared — incompatible ideologies, inevitable coalition",
    },
    {
      turn: 4,
      color: C.green,
      icon: "◉",
      text: "Coalition strips Technocrat authority in a single vote — POL-248/249 reversed. Chamber restructured.",
    },
    {
      turn: 5,
      color: C.magenta,
      icon: "◆",
      text: "Plural Sovereignty Amendment ratified — new constitutional order locks in anti-hegemony protections",
    },
  ];

  for (const e of events) {
    log(`  T${e.turn}  ${e.color}${C.bold}${e.icon}${C.reset}  ${e.text}`);
  }

  // Final world state
  sub("FINAL WORLD STATE — Post-Arc", C.white);
  const final = snapshots[snapshots.length - 1].worldState;
  blank();
  log(
    `  ${bold("Dominant faction")}  : ${col(final.dominantFaction, bold(final.dominantFaction))}`,
  );
  log(`  ${bold("Chamber stability")} : ${stabilityBar(final.stability)}`);
  log(`  ${bold("World emotion")}     : ${emotionTag(final.emotion)}`);
  log(`  ${bold("Grievance count")}   : ${final.grievanceCount} accumulated`);
  log(`  ${bold("Memory archived")}   : ${final.historyLength} events on 0G Storage`);
  log(`  ${bold("Faction moods")}     :`);
  for (const [f, m] of Object.entries(final.factionMoods)) {
    const mC = moodColor(m);
    log(`    ${col(f, f.padEnd(11))}  ${mC}${bold(m)}${C.reset}`);
  }
  blank();
  log(
    `${C.amber}${bold("┌─ 0G MEMORY — Final Archive State ──────────────────────────────────────┐")}${C.reset}`,
  );
  log(
    `${C.amber}${bold("│")}${C.reset}  ${final.historyLength} governance events permanently archived`,
  );
  log(`${C.amber}${bold("│")}${C.reset}  Contract : 0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F`);
  log(`${C.amber}${bold("│")}${C.reset}  Network  : 0G Galileo Testnet  ·  Chain ID 16602`);
  log(
    `${C.amber}${bold("└────────────────────────────────────────────────────────────────────────┘")}${C.reset}`,
  );
  blank();
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

hdr("POLIS  ·  BETRAYAL ARC  ·  6-Turn Scripted Scenario  ·  0G Galileo", C.white);
blank();
log(`${C.bold}SCENARIO BRIEF${C.reset}`);
blank();
log(
  `${C.amber}Turn 0${C.reset}  ${C.crimson}${C.bold}Reformist Collapse${C.reset}      Technocrats and Sovereigns unite to defeat the Solidarity Pact`,
);
log(
  `${C.amber}Turn 1${C.reset}  ${C.cyan}${C.bold}Technocrat Ascent${C.reset}        Algorithmix Authority Act passes — concordat weaponised`,
);
log(
  `${C.amber}Turn 2${C.reset}  ${C.cyan}${C.bold}Technocrat Consolidation${C.reset} Data Supremacy Mandate — Sovereign bloc grows uneasy`,
);
log(
  `${C.amber}Turn 3${C.reset}  ${C.magenta}${C.bold}Coalition Declared${C.reset}      Sovereign–Reformist Emergency Pact — ideological enemies unite`,
);
log(
  `${C.amber}Turn 4${C.reset}  ${C.green}${C.bold}Counter-Strike${C.reset}          Technocrat authority stripped in a single vote`,
);
log(
  `${C.amber}Turn 5${C.reset}  ${C.white}${C.bold}New Constitutional Order${C.reset} Plural sovereignty enshrined — arc resolved`,
);

let state = initialWorldState();
const snapshots = [];
const initialAgents = state.agents.map((a) => ({ ...a }));

for (let i = 0; i < 6; i++) {
  const act = ACTS[i];
  const prevWs = state.worldState;
  const agentsBefore = state.agents.map((a) => ({ ...a }));

  state = await runTurn(state, {
    type: "PLAYER_PROPOSAL",
    data: {
      id: act.id,
      title: act.title,
      text: act.text,
      sponsor: act.sponsor,
      tags: act.tags,
      supportBias: act.supportBias,
      memoryRefs: act.memoryRefs,
    },
  });

  snapshots.push({ worldState: state.worldState, agents: state.agents.map((a) => ({ ...a })) });
  renderTurn(i, act, state.worldState, prevWs, agentsBefore, state.agents);
}

renderArcSummary(snapshots, initialAgents);
