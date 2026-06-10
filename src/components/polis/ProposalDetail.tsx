import { Link } from "@tanstack/react-router";
import { agentById, memoryByTitle, type Proposal } from "@/lib/polis-data";
import { usePolisStore } from "@/lib/polis-store";
import { AgentAvatar } from "./AgentAvatar";
import { AgentLink, EntityText, MemoryLink } from "./EntityText";
import { ArrowLeft, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";

const tagColor: Record<string, string> = {
  Active: "text-amber border-amber/40 bg-amber/5",
  Passed: "text-cyan border-cyan/40 bg-cyan/5",
  Rejected: "text-crimson border-crimson/40 bg-crimson/5",
  Tabled: "text-silver border-silver/30 bg-silver/5",
};

const positionColor: Record<string, string> = {
  endorsed: "text-amber border-amber/40 bg-amber/5",
  opposed: "text-crimson border-crimson/40 bg-crimson/5",
  amended: "text-cyan border-cyan/40 bg-cyan/5",
  abstained: "text-silver border-silver/30 bg-silver/5",
};

export function ProposalDetail({ slug }: { slug: string }) {
  const { proposals } = usePolisStore();
  const p = proposals.find((proposal) => proposal.slug === slug);
  if (!p) return <NotFound slug={slug} />;
  return (
    <section className="px-4 md:px-6 py-8 max-w-5xl">
      <Link
        to="/proposals"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Proposals
      </Link>

      <header className="mt-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-amber">{p.id}</span>
          <span
            className={`rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${tagColor[p.statusTag]}`}
          >
            {p.statusTag}
          </span>
          <span className="font-mono text-[10.5px] text-muted-foreground">{p.phase}</span>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl tracking-tight mt-2">{p.title}</h1>
        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          <span>{p.status}</span>
          <span>{p.origin} origin</span>
          {p.proposerName ? <span>Proposed by {p.proposerName}</span> : null}
          {p.createdTurn ? <span>Created turn {p.createdTurn}</span> : null}
          {p.resolvedTurn ? <span>Resolved turn {p.resolvedTurn}</span> : null}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <Meta
          label="Treasury Exposure"
          value={p.treasuryExposure}
          icon={<TrendingDown className="h-3.5 w-3.5 text-crimson" />}
        />
        <Meta
          label="Risk Level"
          value={`${p.riskLevel} · ${p.risk}/100`}
          icon={<ShieldAlert className="h-3.5 w-3.5 text-amber" />}
        />
        <Meta
          label="Sentiment Trend"
          value={p.sentimentDelta}
          icon={<TrendingUp className="h-3.5 w-3.5 text-amber" />}
        />
      </div>

      <Block title="Full Proposal">
        <p className="text-[13.5px] leading-relaxed text-foreground/85">
          <EntityText>{p.description}</EntityText>
        </p>
      </Block>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <Block title="Voting Distribution">
          <div className="space-y-2 mt-2">
            <Bar label="Endorse" value={p.votes.for} color="bg-amber" />
            <Bar label="Oppose" value={p.votes.against} color="bg-crimson" />
            <Bar label="Abstain" value={p.votes.abstain} color="bg-silver" />
          </div>
          <div className="mt-3 font-mono text-[10px] text-muted-foreground">{p.treasuryImpact}</div>
        </Block>

        <Block title="Sentiment Trend · 12h">
          <Sparkline data={p.sentimentTrend} />
        </Block>
      </div>

      <Block title="Agent Reactions" className="mt-3">
        <ul className="divide-y hairline">
          {p.agentReactions.map((r, i) => {
            const a = agentById[r.agentId];
            return (
              <li key={i} className="py-3 flex items-start gap-3">
                <AgentLink slug={a.slug} className="shrink-0">
                  <AgentAvatar agent={a} size={32} />
                </AgentLink>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AgentLink slug={a.slug}>
                      <span className="font-serif text-[14px] hover:underline">{a.name}</span>
                    </AgentLink>
                    <span className="font-mono text-[10px] text-muted-foreground">{a.faction}</span>
                    <span
                      className={`ml-auto rounded-sm border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] ${positionColor[r.position]}`}
                    >
                      {r.position}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-foreground/85 leading-relaxed">
                    <EntityText>{r.statement}</EntityText>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Block>

      <Block title="Historical References" className="mt-3">
        <ul className="divide-y hairline">
          {p.historicalReferences.map((h, i) => {
            const m = memoryByTitle[h.memory];
            return (
              <li key={i} className="py-2.5 flex items-start gap-3">
                <span className="font-mono text-[10px] text-cyan mt-0.5">REF</span>
                <div className="min-w-0">
                  {m ? (
                    <MemoryLink
                      slug={m.slug}
                      className="font-serif text-[13.5px] text-cyan italic hover:underline"
                    >
                      {h.memory}
                    </MemoryLink>
                  ) : (
                    <span className="font-serif text-[13.5px] italic">{h.memory}</span>
                  )}
                  <p className="text-[12px] text-foreground/75 mt-0.5">{h.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Block>
    </section>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <section className="px-4 md:px-6 py-12 max-w-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-crimson">
        Not in chamber records
      </p>
      <h1 className="font-serif text-2xl mt-2">Proposal {slug.toUpperCase()} not found</h1>
      <Link
        to="/proposals"
        className="inline-flex items-center gap-1.5 mt-4 font-mono text-[11px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to proposals
      </Link>
    </section>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="panel rounded-md p-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-1 font-serif text-[14px]">{value}</p>
    </div>
  );
}

function Block({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel rounded-md p-4 ${className}`}>
      <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-foreground/80">{label}</span>
        <span className="font-mono text-muted-foreground">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 320,
    h = 64;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full h-16">
      <defs>
        <linearGradient id="sgd" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sgd)" />
      <polyline points={pts} fill="none" stroke="var(--amber)" strokeWidth="1.5" />
    </svg>
  );
}
