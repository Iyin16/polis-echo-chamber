---
name: Polis consequence + era system architecture
description: How the consequence engine and civilization era system are wired into the Polis simulation.
---

## Consequence Engine (`src/lib/consequence-engine.ts`)

Runs after `resolveVotes()` in `runTurn()`. Applies 5 cascading effects:

1. Faction loss streaks (3+ consecutive) → morale drop, grievance recorded, feed event
2. Faction dominance >70% → internal dissent event + rival unity event
3. Close vote (<5% margin) → political tension spike, losing coalition grievances
4. Alliance trust maintenance (coalitions) → trust score increments, tension reduction
5. Betrayal detection (voting against faction majority) → penalty events, defection spiral

**Key exports:** `applyConsequenceEngine`, `getFactionMorale`, `getAllianceTrustBonus`, `getTensionModifier`

## Era System (`src/lib/era-system.ts`)

Runs after `updateWorldEmotion()` in `runTurn()`. Determines one of 5 eras from worldState:

- **Formation** — default / low stability / high tension
- **Expansion** — stability >54%, tension <48%, dominant coalition present
- **Reform** — `emotion === "Reforming"` OR 28–65% tension with moderate stability
- **Crisis** — tension >65% OR `emotion === "Fragmenting"` OR stability <28%
- **Consolidation** — stability >74%, dominanceStreak ≥4, tension <35%

On era transition: creates FeedPost + Memory event and stores EraHistoryEntry in `worldState.eraHistory`.

**Key exports:** `determineEra`, `getEraProposalBias`, `getEraVoteWeightModifier`, `getEraIdeologyDriftMultiplier`, `updateCivilizationEra`

## turnEngine.ts integration points

- `maybeGenerateProposal` → era-weighted category bias via `getEraWeightedCategory`
- `simulateProposalVoting` → morale-adjusted vote preference via `applyMoraleToPreference`
- `computeVoteWeight` → tension modifier + era modifier + alliance trust bonus
- After `resolveVotes`: `applyConsequenceEngine(newState)`
- After `updateWorldEmotion`: `updateCivilizationEra(newState)`

## UI: EraPanel (`src/components/polis/EraPanel.tsx`)

- Reads from `usePolisStore().worldState` for all consequence/era data
- `determineEra(worldState)` called reactively to compute live era if not set
- Embedded in `Dominance.tsx` replacing the old static era section
- Shows: era badge + description, political tension bar, faction morale bars with streak/grievance badges, era history timeline

## WorldState new fields

Added in `src/lib/world-state.ts`:

- `civilizationEra: CivilizationEra`
- `eraStartTurn: number`
- `eraHistory: EraHistoryEntry[]`
- `politicalTension: number` (0–100)
- `factionStreaks: Record<string, { losses: number; wins: number }>`
- `factionMorale: Record<string, number>` (0–100, default 75)
- `factionGrievances: Record<string, string[]>`
- `allianceTrust: Record<string, number>`
- `betrayalCounts: Record<string, number>`

## Circular import avoidance

consequence-engine.ts and era-system.ts define a local `CState` type instead of importing `TurnState` from turnEngine.ts, preventing circular dependencies.

**Why:** TurnState extends PolisState which imports from polis-store which imports from feed-events which imports from polis-data. Importing TurnState in consequence-engine would create a cycle.
