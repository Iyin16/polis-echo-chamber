#!/usr/bin/env node
import { createSnapshot, runTurn, type TurnState } from "../src/lib/turnEngine";
import { getPolisStoreSnapshot } from "../src/lib/polis-store";
import { proposals } from "../src/lib/polis-data";

function initialWorldState(): TurnState {
  const base = getPolisStoreSnapshot();
  return {
    ...base,
    turn: 0,
    factions: {
      Reformist: 1,
      Sovereigntist: 1,
      Technocrat: 1,
      Populist: 1,
      Accelerationist: 1,
    },
    events: [],
    proposals,
    history: [],
  };
}

async function runSimulation() {
  let state = initialWorldState();

  console.log("=== POLIS SIMULATION START ===");

  for (let turn = 1; turn <= 6; turn++) {
    console.log(`\n\n===== TURN ${turn} =====`);

    state = await runTurn(state, {
      type: "NONE",
    });

    const snapshot = createSnapshot(state);

    console.log("\n--- WORLD STATE ---");
    console.log({
      turn: snapshot.turn,
      emotion: snapshot.emotionState,
      dominantFaction: snapshot.dominantFaction,
      stability: state.worldState?.stability,
      activeProposal: snapshot.activeProposal,
      voteResult: snapshot.voteResult,
      majorEvent: snapshot.majorEvent,
    });

    if (snapshot.agentEvolutionSummary?.length) {
      console.log("\n--- AGENT EVOLUTION SUMMARY ---");
      snapshot.agentEvolutionSummary.forEach((line) => console.log(line));
    }

    if (snapshot.agentEvolutionDetails) {
      console.log("\n--- AGENT EVOLUTION DETAILS ---");
      console.log(
        `Top ideology shifts: ${snapshot.agentEvolutionDetails.topIdeologyShifts.join("; ")}`,
      );
      console.log(`Biggest trait change: ${snapshot.agentEvolutionDetails.biggestTraitChange}`);
      console.log(`Most influential agent: ${snapshot.agentEvolutionDetails.mostInfluentialAgent}`);
      console.log(`Lost most trust: ${snapshot.agentEvolutionDetails.mostDistrustedAgent}`);
    }

    console.log("\n--- LAST EVENT ---");
    console.log(state.history?.[state.history.length - 1]);
  }

  console.log("\n=== SIMULATION END ===");
}

runSimulation().catch((error) => {
  console.error(error);
  process.exit(1);
});
