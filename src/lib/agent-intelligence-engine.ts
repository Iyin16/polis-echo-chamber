/**
 * Agent Intelligence Engine
 * 
 * Comprehensive system for generating unique agent profiles based on user inputs.
 * All user choices directly influence the generated political profile and behavior.
 * 
 * Generates:
 * 1. Personality traits affecting proposal reactions and voting
 * 2. Cognitive radar scores (Diplomacy, Strategy, Governance, etc.)
 * 3. Faction compatibility scores
 * 4. Behavior predictions and governance tendencies
 * 5. Ideology anchor for persistent ideological positioning
 * 6. Growth potential projections
 */

/**
 * User inputs that shape agent profile
 */
export interface AgentCreationInputs {
  // Leadership style
  leadershipStyle: "Authoritarian" | "Democratic" | "Pragmatic" | "Visionary";

  // Governance philosophy
  governancePhilosophy:
    | "Centralized"
    | "Decentralized"
    | "Hybrid"
    | "Technocratic";

  // Risk tolerance
  riskTolerance: "Conservative" | "Balanced" | "Aggressive" | "Radical";

  // Communication style
  communicationStyle: "Persuasive" | "Analytical" | "Collaborative" | "Commanding";

  // Strategic focus
  strategicFocus:
    | "Economic"
    | "Social"
    | "Military"
    | "Diplomatic"
    | "Cultural";

  // Ethical alignment
  ethicalAlignment: "Pragmatic" | "Idealistic" | "Neutral" | "Individualistic";

  // Political temperament
  politicalTemperament: "Cooperative" | "Competitive" | "Neutral" | "Radical";
}

/**
 * Generated personality traits
 */
export interface PersonalityTraits {
  pragmatic: number; // 0-100
  idealistic: number;
  opportunistic: number;
  authoritarian: number;
  cooperative: number;
  visionary: number;
  conservative: number;
  expansionist: number;
}

/**
 * Cognitive ability scores
 */
export interface CognitiveScores {
  diplomacy: number; // 0-100
  strategy: number;
  governance: number;
  influence: number;
  negotiation: number;
  stabilityPreference: number;
}

/**
 * Faction compatibility assessment
 */
export interface FactionCompatibility {
  factionName: string;
  compatibilityScore: number; // 0-100
  reasoning: string;
}

/**
 * Predicted governance role
 */
export type GovernanceRole =
  | "Consensus Builder"
  | "Coalition Broker"
  | "Political Radical"
  | "Institutional Defender"
  | "Strategic Opportunist"
  | "Diplomatic Mediator"
  | "Reform Advocate";

/**
 * Projected political role
 */
export type PoliticalRole =
  | "Field Strategist"
  | "Diplomat"
  | "Legislator"
  | "Reformer"
  | "Power Broker"
  | "Coalition Architect"
  | "Ideological Champion"
  | "Consensus Seeker";

/**
 * Full generated agent intelligence profile
 */
export interface AgentIntelligenceProfile {
  // Raw inputs
  inputs: AgentCreationInputs;

  // 1. Personality traits
  personalityTraits: PersonalityTraits;

  // 2. Cognitive scores
  cognitiveScores: CognitiveScores;

  // 3. Faction alignment
  factionCompatibilities: FactionCompatibility[];
  recommendedFaction: string;

  // 4. Behavior profile
  behaviorProfile: string; // Natural language description

  // 5. Governance tendency
  governanceTendency: GovernanceRole;

  // 6. Projected role
  projectedRole: PoliticalRole;

  // 7. Ideology anchor
  ideologyAnchor: {
    primaryIdeology: string;
    ideologyStrength: number; // 0-100
    ideologyVector: number; // -100 (leftist) to +100 (rightist)
  };

  // 8. Growth potential
  growthPotential: {
    projectedInfluence: number; // 0-100
    projectedReputation: number; // 0-100
    growthRate: number; // -0.5 to +0.5 per turn
  };

  // Metadata
  generatedAt: string;
  generationSeed: number; // For reproducibility
}

/**
 * Available factions in POLIS
 */
const POLIS_FACTIONS = [
  "Technocrats",
  "Reformists",
  "Sovereigns",
  "Collectivists",
  "Progressives",
];

/**
 * Agent Intelligence Engine - Main class
 */
export class AgentIntelligenceEngine {
  /**
   * Generate complete agent intelligence profile from user inputs
   */
  static generateProfile(inputs: AgentCreationInputs): AgentIntelligenceProfile {
    const seed = Date.now(); // For reproducibility

    return {
      inputs,
      personalityTraits: this.generatePersonalityTraits(inputs),
      cognitiveScores: this.generateCognitiveScores(inputs),
      factionCompatibilities: this.generateFactionCompatibilities(inputs),
      recommendedFaction: this.recommendFaction(inputs),
      behaviorProfile: this.generateBehaviorProfile(inputs),
      governanceTendency: this.predictGovernanceTendency(inputs),
      projectedRole: this.predictPoliticalRole(inputs),
      ideologyAnchor: this.generateIdeologyAnchor(inputs),
      growthPotential: this.projectGrowthPotential(inputs),
      generatedAt: new Date().toISOString(),
      generationSeed: seed,
    };
  }

  /**
   * 1. Generate personality traits based on inputs
   * Traits directly affect proposal reactions and voting behavior
   */
  private static generatePersonalityTraits(
    inputs: AgentCreationInputs
  ): PersonalityTraits {
    const traits: PersonalityTraits = {
      pragmatic: 0,
      idealistic: 0,
      opportunistic: 0,
      authoritarian: 0,
      cooperative: 0,
      visionary: 0,
      conservative: 0,
      expansionist: 0,
    };

    // Leadership style influences traits
    if (inputs.leadershipStyle === "Authoritarian") {
      traits.authoritarian = 80;
      traits.pragmatic = 60;
      traits.opportunistic = 40;
    } else if (inputs.leadershipStyle === "Democratic") {
      traits.cooperative = 80;
      traits.idealistic = 60;
      traits.pragmatic = 40;
    } else if (inputs.leadershipStyle === "Pragmatic") {
      traits.pragmatic = 80;
      traits.opportunistic = 70;
      traits.cooperative = 30;
    } else if (inputs.leadershipStyle === "Visionary") {
      traits.visionary = 80;
      traits.idealistic = 70;
      traits.expansionist = 60;
    }

    // Governance philosophy
    if (inputs.governancePhilosophy === "Centralized") {
      traits.authoritarian += 30;
      traits.expansionist += 20;
    } else if (inputs.governancePhilosophy === "Decentralized") {
      traits.cooperative += 30;
      traits.idealistic += 20;
    } else if (inputs.governancePhilosophy === "Technocratic") {
      traits.pragmatic += 30;
      traits.conservative += 20;
    }

    // Risk tolerance
    if (inputs.riskTolerance === "Conservative") {
      traits.conservative += 40;
      traits.pragmatic += 20;
    } else if (inputs.riskTolerance === "Aggressive") {
      traits.expansionist += 40;
      traits.opportunistic += 30;
    } else if (inputs.riskTolerance === "Radical") {
      traits.visionary += 30;
      traits.expansionist += 40;
      traits.idealistic += 20;
    }

    // Communication style
    if (inputs.communicationStyle === "Persuasive") {
      traits.opportunistic += 30;
      traits.visionary += 20;
    } else if (inputs.communicationStyle === "Collaborative") {
      traits.cooperative += 40;
      traits.pragmatic += 10;
    }

    // Normalize to 0-100
    Object.keys(traits).forEach((key) => {
      traits[key as keyof PersonalityTraits] = Math.min(
        100,
        traits[key as keyof PersonalityTraits]
      );
    });

    return traits;
  }

  /**
   * 2. Generate cognitive ability scores
   * These scores influence voting decisions and proposal success
   */
  private static generateCognitiveScores(
    inputs: AgentCreationInputs
  ): CognitiveScores {
    const scores: CognitiveScores = {
      diplomacy: 50,
      strategy: 50,
      governance: 50,
      influence: 50,
      negotiation: 50,
      stabilityPreference: 50,
    };

    // Communication style directly affects diplomacy/negotiation
    if (inputs.communicationStyle === "Persuasive") {
      scores.diplomacy += 25;
      scores.influence += 20;
    } else if (inputs.communicationStyle === "Collaborative") {
      scores.diplomacy += 30;
      scores.negotiation += 25;
    } else if (inputs.communicationStyle === "Analytical") {
      scores.strategy += 30;
      scores.governance += 25;
    } else if (inputs.communicationStyle === "Commanding") {
      scores.influence += 30;
      scores.strategy += 15;
    }

    // Strategic focus
    if (inputs.strategicFocus === "Diplomatic") {
      scores.diplomacy += 30;
      scores.negotiation += 25;
    } else if (inputs.strategicFocus === "Economic") {
      scores.governance += 25;
      scores.strategy += 20;
    } else if (inputs.strategicFocus === "Military") {
      scores.strategy += 30;
      scores.influence += 20;
    } else if (inputs.strategicFocus === "Social") {
      scores.diplomacy += 25;
      scores.governance += 15;
    }

    // Risk tolerance affects stability preference
    if (inputs.riskTolerance === "Conservative") {
      scores.stabilityPreference += 30;
    } else if (inputs.riskTolerance === "Radical") {
      scores.stabilityPreference -= 30;
    }

    // Ethical alignment
    if (inputs.ethicalAlignment === "Pragmatic") {
      scores.strategy += 20;
      scores.influence += 15;
    } else if (inputs.ethicalAlignment === "Idealistic") {
      scores.diplomacy += 20;
      scores.governance += 15;
    }

    // Normalize
    Object.keys(scores).forEach((key) => {
      scores[key as keyof CognitiveScores] = Math.max(
        0,
        Math.min(100, scores[key as keyof CognitiveScores])
      );
    });

    return scores;
  }

  /**
   * 3. Calculate faction compatibility scores
   */
  private static generateFactionCompatibilities(
    inputs: AgentCreationInputs
  ): FactionCompatibility[] {
    const compatibilities: FactionCompatibility[] = [];

    // Technocrats: favor pragmatism, strategy, centralization
    let techScore = 50;
    if (inputs.governancePhilosophy === "Technocratic") techScore += 30;
    if (inputs.ethicalAlignment === "Pragmatic") techScore += 20;
    if (inputs.strategicFocus === "Economic") techScore += 15;
    if (inputs.riskTolerance === "Conservative") techScore += 10;

    compatibilities.push({
      factionName: "Technocrats",
      compatibilityScore: Math.min(100, techScore),
      reasoning:
        inputs.governancePhilosophy === "Technocratic"
          ? "Strong alignment with technocratic governance"
          : "Moderate pragmatism and strategic thinking",
    });

    // Reformists: favor democratic, idealistic, social focus
    let reformScore = 50;
    if (inputs.leadershipStyle === "Democratic") reformScore += 30;
    if (inputs.ethicalAlignment === "Idealistic") reformScore += 20;
    if (inputs.strategicFocus === "Social") reformScore += 15;
    if (inputs.governancePhilosophy === "Decentralized") reformScore += 15;

    compatibilities.push({
      factionName: "Reformists",
      compatibilityScore: Math.min(100, reformScore),
      reasoning:
        inputs.leadershipStyle === "Democratic"
          ? "Strong democratic values alignment"
          : "Shared interest in social progress",
    });

    // Sovereigns: favor visionary, radical, expansionist
    let sovereignScore = 50;
    if (inputs.leadershipStyle === "Visionary") sovereignScore += 30;
    if (inputs.riskTolerance === "Radical") sovereignScore += 25;
    if (inputs.politicalTemperament === "Competitive") sovereignScore += 15;

    compatibilities.push({
      factionName: "Sovereigns",
      compatibilityScore: Math.min(100, sovereignScore),
      reasoning:
        inputs.leadershipStyle === "Visionary"
          ? "Visionary leadership philosophy"
          : "Independent and bold approach",
    });

    // Collectivists: favor cooperative, idealistic, decentralized
    let collectScore = 50;
    if (inputs.governancePhilosophy === "Decentralized") collectScore += 25;
    if (inputs.ethicalAlignment === "Idealistic") collectScore += 25;
    if (inputs.politicalTemperament === "Cooperative") collectScore += 20;

    compatibilities.push({
      factionName: "Collectivists",
      compatibilityScore: Math.min(100, collectScore),
      reasoning:
        inputs.politicalTemperament === "Cooperative"
          ? "Strong cooperative orientation"
          : "Shared communal values",
    });

    // Progressives: favor radical, visionary, cultural/social focus
    let progressScore = 50;
    if (inputs.riskTolerance === "Radical") progressScore += 25;
    if (
      inputs.strategicFocus === "Social" ||
      inputs.strategicFocus === "Cultural"
    )
      progressScore += 20;
    if (inputs.ethicalAlignment === "Idealistic") progressScore += 15;

    compatibilities.push({
      factionName: "Progressives",
      compatibilityScore: Math.min(100, progressScore),
      reasoning:
        inputs.riskTolerance === "Radical"
          ? "Progressive and radical orientation"
          : "Forward-thinking approach",
    });

    return compatibilities;
  }

  /**
   * Recommend the highest compatibility faction
   */
  private static recommendFaction(inputs: AgentCreationInputs): string {
    const compatibilities = this.generateFactionCompatibilities(inputs);
    return compatibilities.reduce((best, current) =>
      current.compatibilityScore > best.compatibilityScore ? current : best
    ).factionName;
  }

  /**
   * 4. Generate behavior profile (natural language)
   */
  private static generateBehaviorProfile(
    inputs: AgentCreationInputs
  ): string {
    const elements: string[] = [];

    // Leadership style
    if (inputs.leadershipStyle === "Authoritarian") {
      elements.push("This agent tends to consolidate power and enforce clear hierarchies");
    } else if (inputs.leadershipStyle === "Democratic") {
      elements.push("This agent values input from diverse voices and builds consensus");
    } else if (inputs.leadershipStyle === "Pragmatic") {
      elements.push("This agent focuses on practical outcomes over ideological purity");
    } else if (inputs.leadershipStyle === "Visionary") {
      elements.push("This agent champions ambitious long-term transformations");
    }

    // Policy approach
    if (inputs.strategicFocus === "Diplomatic") {
      elements.push(
        "They prefer coalition-building and diplomatic solutions to conflicts"
      );
    } else if (inputs.strategicFocus === "Economic") {
      elements.push("They prioritize economic growth and efficient resource allocation");
    } else if (inputs.strategicFocus === "Social") {
      elements.push(
        "They advocate for social welfare and equity-focused policies"
      );
    }

    // Risk posture
    if (inputs.riskTolerance === "Conservative") {
      elements.push("likely to oppose radical institutional changes");
    } else if (inputs.riskTolerance === "Radical") {
      elements.push("inclined to support bold experimental governance approaches");
    }

    // Political temperament
    if (inputs.politicalTemperament === "Competitive") {
      elements.push("views politics as competitive and may form selective alliances");
    } else if (inputs.politicalTemperament === "Cooperative") {
      elements.push("seeks broad-based coalitions and shared governance");
    }

    return elements.join(", and ") + ".";
  }

  /**
   * 5. Predict governance tendency (role)
   */
  private static predictGovernanceTendency(
    inputs: AgentCreationInputs
  ): GovernanceRole {
    // Decision tree for governance role
    if (inputs.politicalTemperament === "Cooperative" &&
        inputs.communicationStyle === "Collaborative") {
      return "Consensus Builder";
    } else if (inputs.leadershipStyle === "Democratic" &&
               inputs.strategicFocus === "Diplomatic") {
      return "Diplomatic Mediator";
    } else if (inputs.leadershipStyle === "Pragmatic" &&
               inputs.strategicFocus === "Economic") {
      return "Coalition Broker";
    } else if (inputs.riskTolerance === "Radical" &&
               inputs.ethicalAlignment === "Idealistic") {
      return "Political Radical";
    } else if (inputs.governancePhilosophy === "Technocratic" ||
               inputs.governancePhilosophy === "Centralized") {
      return "Institutional Defender";
    } else if (inputs.ethicalAlignment === "Pragmatic" &&
               inputs.politicalTemperament === "Competitive") {
      return "Strategic Opportunist";
    } else {
      return "Reform Advocate";
    }
  }

  /**
   * 6. Predict projected political role
   */
  private static predictPoliticalRole(
    inputs: AgentCreationInputs
  ): PoliticalRole {
    if (inputs.strategicFocus === "Diplomatic") {
      return "Diplomat";
    } else if (inputs.strategicFocus === "Military" ||
               inputs.strategicFocus === "Economic") {
      return "Field Strategist";
    } else if (inputs.leadershipStyle === "Democratic") {
      return "Consensus Seeker";
    } else if (inputs.leadershipStyle === "Visionary") {
      return inputs.strategicFocus === "Social"
        ? "Reformer"
        : "Coalition Architect";
    } else if (inputs.riskTolerance === "Radical") {
      return "Reform Advocate";
    } else if (inputs.ethicalAlignment === "Pragmatic") {
      return "Power Broker";
    } else {
      return "Legislator";
    }
  }

  /**
   * 7. Generate ideology anchor
   * Persistent ideological position for voting and alliance formation
   */
  private static generateIdeologyAnchor(
    inputs: AgentCreationInputs
  ): { primaryIdeology: string; ideologyStrength: number; ideologyVector: number } {
    // Determine primary ideology
    let primaryIdeology = "Centrist";
    let ideologyVector = 0; // -100 (leftist) to +100 (rightist)
    let ideologyStrength = 50;

    if (inputs.ethicalAlignment === "Idealistic" &&
        inputs.governancePhilosophy === "Decentralized") {
      primaryIdeology = "Progressive";
      ideologyVector = -70;
      ideologyStrength = 80;
    } else if (inputs.ethicalAlignment === "Pragmatic" &&
               inputs.governancePhilosophy === "Centralized") {
      primaryIdeology = "Conservative";
      ideologyVector = 70;
      ideologyStrength = 75;
    } else if (inputs.governancePhilosophy === "Technocratic") {
      primaryIdeology = "Technocratic";
      ideologyVector = 10;
      ideologyStrength = 70;
    } else if (inputs.leadershipStyle === "Democratic") {
      primaryIdeology = "Democratic";
      ideologyVector = -40;
      ideologyStrength = 65;
    } else if (inputs.leadershipStyle === "Authoritarian") {
      primaryIdeology = "Authoritarian";
      ideologyVector = 60;
      ideologyStrength = 75;
    }

    return {
      primaryIdeology,
      ideologyStrength,
      ideologyVector,
    };
  }

  /**
   * 8. Project growth potential
   */
  private static projectGrowthPotential(
    inputs: AgentCreationInputs
  ): { projectedInfluence: number; projectedReputation: number; growthRate: number } {
    // Base on cognitive scores and risk tolerance
    const cognitiveScores = this.generateCognitiveScores(inputs);
    const avgCognitive =
      (cognitiveScores.strategy +
        cognitiveScores.governance +
        cognitiveScores.influence) /
      3;

    let projectedInfluence = 30 + avgCognitive * 0.5;
    let projectedReputation = 40 + cognitiveScores.diplomacy * 0.4;
    let growthRate = -0.1; // Default slight decline

    // Risk tolerance affects growth potential
    if (inputs.riskTolerance === "Aggressive") {
      growthRate += 0.3;
      projectedInfluence += 15;
    } else if (inputs.riskTolerance === "Radical") {
      growthRate += 0.4;
      projectedInfluence += 25;
    } else if (inputs.riskTolerance === "Conservative") {
      growthRate -= 0.1;
      projectedReputation += 10;
    }

    // Leadership style affects trajectory
    if (inputs.leadershipStyle === "Visionary") {
      growthRate += 0.2;
    }

    return {
      projectedInfluence: Math.min(100, projectedInfluence),
      projectedReputation: Math.min(100, projectedReputation),
      growthRate: Math.max(-0.5, Math.min(0.5, growthRate)),
    };
  }
}

/**
 * Format intelligence profile for display
 */
export function formatIntelligenceProfile(
  profile: AgentIntelligenceProfile
): {
  traits: string;
  scores: string;
  compatibility: string;
  behavior: string;
  role: string;
  ideology: string;
  growth: string;
} {
  const traits = Object.entries(profile.personalityTraits)
    .filter(([, value]) => value > 60)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  const scores = Object.entries(profile.cognitiveScores)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  const topFactions = profile.factionCompatibilities
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 3)
    .map((f) => `${f.factionName}: ${f.compatibilityScore}%`)
    .join(", ");

  const growth = `Influence: ${profile.growthPotential.projectedInfluence}%, Reputation: ${profile.growthPotential.projectedReputation}%, Growth Rate: ${profile.growthPotential.growthRate.toFixed(2)}/turn`;

  return {
    traits,
    scores,
    compatibility: topFactions,
    behavior: profile.behaviorProfile,
    role: `${profile.governanceTendency} / ${profile.projectedRole}`,
    ideology: `${profile.ideologyAnchor.primaryIdeology} (${profile.ideologyAnchor.ideologyStrength}% strength)`,
    growth,
  };
}
