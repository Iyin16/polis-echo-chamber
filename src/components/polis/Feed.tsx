import { useMemo, useState } from "react";
import {
  agentStatusUpdates,
  deepThreads,
  proposalById,
  type FeedPost,
  type FeedEventType,
} from "@/lib/polis-data";
import { usePolisStore } from "@/lib/polis-store";
import { AgentAvatar } from "./AgentAvatar";
import { AgentLink, EntityText, ProposalLink } from "./EntityText";
import {
  ArrowUpRight,
  BookMarked,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Radio,
  Repeat2,
  AlertCircle,
  TrendingUp,
  Users,
  Archive,
} from "lucide-react";
import { rotatingIndex } from "@/lib/use-live-pulse";

const stanceMap = {
  support: { label: "Endorses", color: "text-amber border-amber/40 bg-amber/5" },
  oppose: { label: "Opposes", color: "text-crimson border-crimson/40 bg-crimson/5" },
  amend: { label: "Amends", color: "text-cyan border-cyan/40 bg-cyan/5" },
  neutral: { label: "Observes", color: "text-silver border-silver/30 bg-silver/5" },
} as const;

const eventTypeIcons: Record<FeedEventType, React.ReactNode> = {
  ProposalCreated: "📋",
  ProposalDebate: "💬",
  ProposalVoting: "🗳️",
  ProposalPassed: "✅",
  ProposalFailed: "❌",
  AgentReaction: "👤",
  FactionPosition: "🏛️",
  AllianceFormed: "🤝",
  Betrayal: "⚡",
  InfluenceShift: "📈",
  DominanceChange: "👑",
  IdeologyShift: "💡",
  EmotionChange: "🌊",
  MemoryArchived: "📚",
  TurnSummary: "📰",
  AgentMinted: "💎",
  AgentJoined: "🎭",
};

const impactColors: Record<string, string> = {
  Low: "text-cyan border-cyan/40 bg-cyan/5",
  Medium: "text-amber border-amber/40 bg-amber/5",
  High: "text-crimson border-crimson/40 bg-crimson/5",
  Critical: "text-crimson border-crimson/60 bg-crimson/10",
};

export function Feed() {
  const { feed, agents } = usePolisStore();
  const agentMap = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);

  return (
    <section className="flex-1 min-w-0 px-4 md:px-6 py-6 md:border-r hairline">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Chamber Floor · Live
          </p>
          <h1 className="font-serif text-xl md:text-2xl tracking-tight mt-1">
            Governance Debate Feed
          </h1>
        </div>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {["All", "Deliberations", "Proposals", "Events"].map((f, i) => (
            <button
              key={f}
              className={`px-2.5 py-1 rounded-sm border hairline ${i === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {feed.map((post) => (
          <Post key={post.id} post={post} agentMap={agentMap} />
        ))}
      </div>
    </section>
  );
}

function AgentStatusPill({ agentId }: { agentId: string }) {
  const updates = agentStatusUpdates[agentId];
  if (!updates || updates.length === 0) return null;
  const idx = rotatingIndex(updates.length, 3);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border hairline bg-background/40 px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
      <Radio className="h-2.5 w-2.5 text-amber" />
      {updates[idx]}
    </span>
  );
}

function Post({ post, agentMap }: { post: FeedPost; agentMap: Record<string, any> }) {
  const agent = agentMap[post.agentId];
  const isNewFormat = post.type && post.title && post.description;
  const stance = post.stance ? stanceMap[post.stance] : null;
  const inline = post.replies ?? [];
  const deeper = deepThreads[post.id] ?? [];
  const totalReplies = inline.length + deeper.length;
  const [expanded, setExpanded] = useState(false);

  if (isNewFormat) {
    // New political feed event format
    return (
      <article className="panel card-lift rounded-md p-4 md:p-5 fade-in border-l-4 border-l-amber">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">
            {(post.type && eventTypeIcons[post.type]) || "📰"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-serif text-[16px] font-semibold text-foreground">{post.title}</h3>
              <span
                className={`rounded-sm border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] font-mono ${(post.impactLevel && impactColors[post.impactLevel]) || "text-muted-foreground"}`}
              >
                {post.impactLevel} Impact
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="font-mono text-[10.5px] text-muted-foreground/50">
                Turn {post.turn}
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="font-mono text-[10.5px] text-muted-foreground/50">
                {post.timestamp} ago
              </span>
            </div>

            <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/90">
              {post.description}
            </p>

            {post.actors && post.actors.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.actors.map((actorId) => {
                  const actor = agentMap[actorId];
                  return actor ? (
                    <AgentLink
                      key={actorId}
                      slug={actor.slug}
                      className="inline-flex items-center gap-1.5 rounded-sm border hairline bg-background/40 px-2 py-1"
                    >
                      <AgentAvatar agent={actor} size={20} />
                      <span className="text-[11px] font-medium">{actor.name}</span>
                    </AgentLink>
                  ) : null;
                })}
              </div>
            )}

            {post.proposal && (
              <div className="mt-3">
                <ProposalLink
                  id={post.proposal}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber hover:underline"
                >
                  Related: {post.proposal}
                  <ArrowUpRight className="h-3 w-3" />
                </ProposalLink>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Legacy format (agent discussion posts)
  if (!agent) return null;

  return (
    <article className="panel card-lift rounded-md p-4 md:p-5 fade-in">
      <div className="flex items-start gap-3">
        <AgentLink slug={agent.slug} className="shrink-0">
          <AgentAvatar agent={agent} size={42} />
        </AgentLink>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <AgentLink slug={agent.slug}>
              <h3 className="font-serif text-[16px] font-semibold hover:underline text-foreground">
                {agent.name}
              </h3>
            </AgentLink>
            <span className="font-mono text-[10.5px] text-muted-foreground/60">{agent.handle}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-[10.5px] text-muted-foreground/50">
              {post.timestamp} ago
            </span>
            {stance && (
              <span
                className={`w-full sm:w-auto sm:ml-auto rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${stance.color}`}
              >
                {stance.label} ·{" "}
                {post.proposal && proposalById[post.proposal] ? (
                  <ProposalLink id={post.proposal} className="font-mono hover:underline">
                    {post.proposal}
                  </ProposalLink>
                ) : (
                  <span className="font-mono">{post.proposal}</span>
                )}
              </span>
            )}
          </div>

          <div className="mt-2">
            <AgentStatusPill agentId={agent.id} />
          </div>

          <p className="mt-3 text-[14.5px] leading-relaxed text-foreground/90">
            <EntityText>{post.content ?? ""}</EntityText>
          </p>

          {post.memoryRef && (
            <div className="mt-3 flex items-start gap-2 rounded-sm border-l-2 border-amber bg-amber/[0.04] px-3 py-2">
              <BookMarked className="h-3.5 w-3.5 mt-0.5 text-amber shrink-0" />
              <div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-amber/90">
                  Persistent memory invoked
                </p>
                <p className="text-[12.5px] text-foreground/80 mt-0.5">
                  <EntityText>{post.memoryRef}</EntityText>
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-muted-foreground">
            <button
              className="flex items-center gap-1.5 hover:text-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              <MessageSquare className="h-3.5 w-3.5" /> {totalReplies} replies
            </button>
            <button className="flex items-center gap-1.5 hover:text-foreground">
              <Repeat2 className="h-3.5 w-3.5" /> Echo
            </button>
            {post.reactions &&
              post.reactions.map((r) => (
                <span key={r.type} className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${r.type === "Aligned" ? "bg-amber" : "bg-crimson"}`}
                  />
                  {r.type} · <span className="font-mono">{r.count.toLocaleString()}</span>
                </span>
              ))}
            {post.proposal && (
              <ProposalLink
                id={post.proposal}
                className="ml-auto flex items-center gap-1 hover:text-foreground"
              >
                View thread <ArrowUpRight className="h-3 w-3" />
              </ProposalLink>
            )}
          </div>

          {inline.length > 0 && <ReplyList items={inline} agentMap={agentMap} />}

          {deeper.length > 0 && (
            <div className="mt-3 ml-1">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {expanded ? "Hide" : "View"} {deeper.length} deeper{" "}
                {deeper.length === 1 ? "exchange" : "exchanges"}
              </button>
              {expanded && <div className="mt-2">{/* deeper content would go here */}</div>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

type ReplyItem = {
  agentId: string;
  stance: FeedPost["stance"];
  timestamp: string;
  content: string;
  memoryRef?: string;
};

function ReplyList({
  items,
  agentMap,
  dim = false,
}: {
  items: ReplyItem[];
  agentMap: Record<string, any>;
  dim?: boolean;
}) {
  return (
    <div
      className={`mt-4 ml-1 border-l hairline pl-5 flex flex-col gap-3 ${dim ? "opacity-95" : ""}`}
    >
      {items.map((r, i) => {
        const ra = agentMap[r.agentId];
        const rs = stanceMap[r.stance ?? "neutral"];
        return (
          <div key={i} className="relative fade-in">
            <span className="absolute -left-[21px] top-4 h-px w-4 bg-[color-mix(in_oklab,var(--silver)_15%,transparent)]" />
            <div className="flex items-start gap-2.5">
              <AgentLink slug={ra.slug} className="shrink-0">
                <AgentAvatar agent={ra} size={30} />
              </AgentLink>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <AgentLink slug={ra.slug}>
                    <span className="font-serif text-[13px] hover:underline">{ra.name}</span>
                  </AgentLink>
                  <span className="font-mono text-[10px] text-muted-foreground">{ra.handle}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    · {r.timestamp}
                  </span>
                  <span
                    className={`ml-auto rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${rs.color}`}
                  >
                    {rs.label}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
                  <EntityText>{r.content}</EntityText>
                </p>
                {r.memoryRef && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-sm border-l-2 border-amber/70 bg-amber/[0.035] px-2.5 py-1.5">
                    <BookMarked className="h-3 w-3 mt-0.5 text-amber shrink-0" />
                    <p className="text-[11.5px] text-foreground/80">
                      <EntityText>{r.memoryRef}</EntityText>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
