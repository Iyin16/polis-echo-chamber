export type GlobalSentiment = "positive" | "neutral" | "negative" | number;

export type Season = "spring" | "summer" | "autumn" | "winter" | string;

export type CivilizationEra = "Formation" | "Expansion" | "Reform" | "Crisis" | "Consolidation";

export type EraHistoryEntry = {
  era: CivilizationEra;
  turn: number;
  description: string;
  trigger: string;
};

export interface WorldState {
  currentEra: string;
  civilizationEra: CivilizationEra;
  eraStartTurn: number;
  eraHistory: EraHistoryEntry[];
  stability: number;
  dominantFaction: string | null;
  globalSentiment: GlobalSentiment;
  activeCrisis: string | null;
  season: Season;
  totalAgents: number;
  emotion: "Stable" | "Tense" | "Fragmenting" | "Reforming";
  volatility?: Record<string, number>;
  stabilityTrend?: number[];
  dominanceStreak?: number;
  politicalTension: number;
  factionStreaks: Record<string, { losses: number; wins: number }>;
  factionMorale: Record<string, number>;
  factionGrievances: Record<string, string[]>;
  allianceTrust: Record<string, number>;
  betrayalCounts: Record<string, number>;
}

export function createWorldState(overrides?: Partial<WorldState>): WorldState {
  return {
    currentEra: "Formation Era",
    civilizationEra: "Formation",
    eraStartTurn: 1,
    eraHistory: [],
    stability: 50,
    dominantFaction: null,
    globalSentiment: "neutral",
    activeCrisis: null,
    season: "spring",
    totalAgents: 0,
    emotion: "Stable",
    volatility: {},
    stabilityTrend: [],
    dominanceStreak: 0,
    politicalTension: 20,
    factionStreaks: {},
    factionMorale: {},
    factionGrievances: {},
    allianceTrust: {},
    betrayalCounts: {},
    ...overrides,
  };
}
