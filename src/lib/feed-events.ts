import type { FeedPost, FeedEventType, Proposal, Agent } from "./polis-data";

export function createFeedEvent(
  type: FeedEventType,
  title: string,
  description: string,
  actors: string[],
  impactLevel: "Low" | "Medium" | "High" | "Critical",
  turn: number,
  agentId: string,
  proposalId?: string,
  causeEventId?: string,
): FeedPost {
  return {
    id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    agentId,
    turn,
    type,
    title,
    description,
    actors,
    impactLevel,
    timestamp: "just now",
    proposal: proposalId,
    causeEventId,
  };
}

export function createProposalCreatedEvent(
  proposal: Proposal,
  agentId: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "ProposalCreated",
    `${proposal.title} Introduced`,
    `A new ${proposal.origin.toLowerCase()} ${proposal.category?.toLowerCase() ?? "governance"} proposal has entered the chamber agenda.`,
    [agentId, ...(proposal.proposerId ? [proposal.proposerId] : [])],
    proposal.impactLevel === "Critical"
      ? "Critical"
      : proposal.impactLevel === "High"
        ? "High"
        : "Medium",
    turn,
    agentId,
    proposal.id,
  );
}

export function createProposalDebateEvent(
  proposal: Proposal,
  agentId: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "ProposalDebate",
    `${proposal.title} Enters Deliberation`,
    `The chamber has opened formal deliberation on ${proposal.title}. Agents are exchanging positions and analysis.`,
    [agentId],
    proposal.impactLevel === "Critical" ? "High" : "Medium",
    turn,
    agentId,
    proposal.id,
  );
}

export function createProposalVotingEvent(
  proposal: Proposal,
  agentId: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "ProposalVoting",
    `${proposal.title} Enters Voting Phase`,
    `Deliberation has concluded. The chamber is now voting on ${proposal.title}.`,
    [agentId],
    proposal.impactLevel === "Critical" ? "High" : "Medium",
    turn,
    agentId,
    proposal.id,
  );
}

export function createProposalPassedEvent(
  proposal: Proposal,
  agentId: string,
  turn: number,
  voteCount?: { for: number; against: number; abstain: number },
): FeedPost {
  const votes = voteCount || proposal.votes;
  const margin = votes.for - votes.against;
  return createFeedEvent(
    "ProposalPassed",
    `${proposal.title} PASSED`,
    `The chamber has passed ${proposal.title} with ${votes.for} votes in favor and ${votes.against} votes against (${votes.abstain} abstentions). Vote margin: +${margin}.`,
    [agentId],
    "High",
    turn,
    agentId,
    proposal.id,
  );
}

export function createProposalFailedEvent(
  proposal: Proposal,
  agentId: string,
  turn: number,
  voteCount?: { for: number; against: number; abstain: number },
): FeedPost {
  const votes = voteCount || proposal.votes;
  const margin = votes.against - votes.for;
  return createFeedEvent(
    "ProposalFailed",
    `${proposal.title} FAILED`,
    `The chamber has rejected ${proposal.title} with ${votes.against} votes against, ${votes.for} votes in favor (${votes.abstain} abstentions). Rejection margin: +${margin}.`,
    [agentId],
    "High",
    turn,
    agentId,
    proposal.id,
  );
}

export function createAgentReactionEvent(
  agentName: string,
  agentId: string,
  proposal: Proposal,
  position: "endorsed" | "opposed" | "abstained" | "amended",
  statement: string,
  turn: number,
): FeedPost {
  const positionLabel = {
    endorsed: "Endorses",
    opposed: "Opposes",
    abstained: "Abstains on",
    amended: "Proposed Amendments to",
  }[position];

  return createFeedEvent(
    "AgentReaction",
    `${agentName} ${positionLabel} ${proposal.title}`,
    statement,
    [agentId],
    "Low",
    turn,
    agentId,
    proposal.id,
  );
}

export function createFactionPositionEvent(
  factionName: string,
  agentId: string,
  proposal: Proposal,
  position: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "FactionPosition",
    `${factionName} Declares Position on ${proposal.title}`,
    `The ${factionName} faction has officially declared its position: ${position}`,
    [agentId],
    "Medium",
    turn,
    agentId,
    proposal.id,
  );
}

export function createAllianceFormedEvent(
  ally1Name: string,
  ally2Name: string,
  ally1Id: string,
  ally2Id: string,
  allianceName: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "AllianceFormed",
    `Alliance: ${allianceName}`,
    `${ally1Name} and ${ally2Name} have formed a strategic alliance focused on ${allianceName}.`,
    [ally1Id, ally2Id],
    "Medium",
    turn,
    ally1Id,
  );
}

export function createBetrayalEvent(
  agentName: string,
  agentId: string,
  formerAllyName: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "Betrayal",
    `Political Betrayal: ${agentName}`,
    `${agentName} has abandoned their alliance with ${formerAllyName}, shocking the chamber with a dramatic policy reversal.`,
    [agentId],
    "Critical",
    turn,
    agentId,
  );
}

export function createInfluenceShiftEvent(
  agentName: string,
  agentId: string,
  oldInfluence: number,
  newInfluence: number,
  turn: number,
): FeedPost {
  const direction = newInfluence > oldInfluence ? "increased" : "decreased";
  const delta = Math.abs(newInfluence - oldInfluence);
  return createFeedEvent(
    "InfluenceShift",
    `Influence Shift: ${agentName}`,
    `${agentName}'s chamber influence has ${direction} by ${delta} points (${oldInfluence} → ${newInfluence}).`,
    [agentId],
    delta > 15 ? "High" : "Medium",
    turn,
    agentId,
  );
}

export function createDominanceChangeEvent(
  previousFaction: string | null,
  newFaction: string,
  turn: number,
  representativeId: string,
): FeedPost {
  const description = previousFaction
    ? `The ${newFaction} faction has seized dominance from the ${previousFaction} faction, reshaping chamber dynamics.`
    : `The ${newFaction} faction has achieved dominance in the chamber, establishing a new political order.`;

  return createFeedEvent(
    "DominanceChange",
    `Chamber Dominance Shift: ${newFaction}`,
    description,
    [representativeId],
    "Critical",
    turn,
    representativeId,
  );
}

export function createIdeologyShiftEvent(
  agentName: string,
  agentId: string,
  oldIdeology: string,
  newIdeology: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "IdeologyShift",
    `Ideology Shift: ${agentName}`,
    `${agentName} has undergone a significant ideological transformation, shifting from ${oldIdeology} to ${newIdeology}.`,
    [agentId],
    "High",
    turn,
    agentId,
  );
}

export function createEmotionChangeEvent(
  oldEmotion: string,
  newEmotion: string,
  turn: number,
  representativeId: string,
): FeedPost {
  return createFeedEvent(
    "EmotionChange",
    `World Sentiment Shift: ${newEmotion}`,
    `The political climate of the chamber has shifted from ${oldEmotion} to ${newEmotion}, altering the context for governance.`,
    [representativeId],
    "Medium",
    turn,
    representativeId,
  );
}

export function createMemoryArchivedEvent(
  memoryTitle: string,
  summary: string,
  representativeId: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "MemoryArchived",
    `Memory Archived: ${memoryTitle}`,
    `${memoryTitle} has been formally archived in the chamber's historical record. ${summary}`,
    [representativeId],
    "Low",
    turn,
    representativeId,
  );
}

export function createTurnSummaryEvent(
  title: string,
  description: string,
  turn: number,
  representativeId: string,
  impactLevel: "Low" | "Medium" | "High" | "Critical" = "Medium",
): FeedPost {
  return createFeedEvent(
    "TurnSummary",
    title,
    description,
    [representativeId],
    impactLevel,
    turn,
    representativeId,
  );
}

export function createAgentMintedEvent(
  agentName: string,
  agentId: string,
  tokenId: number,
  contractAddress: string,
  ownerAddress: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "AgentMinted",
    `${agentName} Sovereignty Established On-Chain`,
    `${agentName} has been minted as a sovereign political identity on Arbitrum. Token ID: ${tokenId}. Owner: ${ownerAddress}. Contract: ${contractAddress}`,
    [agentId],
    "Critical",
    turn,
    agentId,
  );
}

export function createAgentJoinedEvent(
  agentName: string,
  agentId: string,
  factionName: string,
  turn: number,
): FeedPost {
  return createFeedEvent(
    "AgentJoined",
    `New Agent: ${agentName}`,
    `${agentName} has entered the Polis chamber as a ${factionName} representative, introducing new perspectives to chamber deliberations.`,
    [agentId],
    "Low",
    turn,
    agentId,
  );
}
