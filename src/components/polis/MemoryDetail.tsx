import { Link } from "@tanstack/react-router";
import { agentById, memoryBySlug } from "@/lib/polis-data";
import { getAgentId } from "@/lib/agent-id";
import { AgentAvatar } from "./AgentAvatar";
import { AgentLink, EntityText } from "./EntityText";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const catColor: Record<string, string> = {
  Treasury: "text-crimson border-crimson/40",
  Election: "text-amber border-amber/40",
  Alliance: "text-cyan border-cyan/40",
  Conflict: "text-crimson border-crimson/40",
  Community: "text-silver border-silver/30",
};

export function MemoryDetail({ slug }: { slug: string }) {
  const m = memoryBySlug[slug];
  if (!m)
    return (
      <section className="px-4 md:px-6 py-12 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-crimson">
          Not in archive
        </p>
        <h1 className="font-serif text-2xl mt-2">Event {slug} not found</h1>
        <Link
          to="/memory"
          className="inline-flex items-center gap-1.5 mt-4 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to archive
        </Link>
      </section>
    );

  return (
    <section className="px-4 md:px-6 py-8 max-w-5xl">
      <Link
        to="/memory"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Archive
      </Link>

      <header className="mt-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10.5px] tracking-[0.2em] text-muted-foreground">
            {m.cycle} · {m.date}
          </span>
          <span
            className={`rounded-sm border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] ${catColor[m.category]}`}
          >
            {m.category}
          </span>
          {m.archivedOn0g ? (
            <Badge variant="outline" className="uppercase tracking-[0.12em]">
              Archived on 0G
            </Badge>
          ) : null}
          {m.galileoVerified ? (
            <Badge variant="outline" className="uppercase tracking-[0.12em]">
              Galileo Verified
            </Badge>
          ) : null}
        </div>
        <h1 className="font-serif text-2xl md:text-3xl tracking-tight mt-2">{m.title}</h1>
      </header>

      <Block title="Historical Summary">
        <p className="text-[13.5px] leading-relaxed text-foreground/85">
          <EntityText>{m.fullSummary}</EntityText>
        </p>
      </Block>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <Block title="Political Consequences">
          <ul className="space-y-2 mt-1">
            {m.consequences.map((c, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] text-foreground/85">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-crimson shrink-0" />
                <span>
                  <EntityText>{c}</EntityText>
                </span>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Long-Term Impact">
          <ul className="space-y-2 mt-1">
            {m.longTermImpact.map((c, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] text-foreground/85">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-amber shrink-0" />
                <span>
                  <EntityText>{c}</EntityText>
                </span>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <Block title="Involved Agents" className="mt-3">
        <ul className="divide-y hairline">
          {m.involvedAgents.map((ia, i) => {
            const a = agentById[ia.agentId];
            return (
              <li key={i} className="py-2.5 flex items-start gap-3">
                <AgentLink slug={a.slug} className="shrink-0">
                  <AgentAvatar agent={a} size={28} />
                </AgentLink>
                <div className="min-w-0 flex-1">
                  <AgentLink slug={a.slug}>
                    <span className="font-serif text-[13.5px] hover:underline">{a.name}</span>
                  </AgentLink>
                  <span className="font-mono text-[10px] text-muted-foreground ml-2">
                    {a.faction}
                  </span>
                  <p className="mt-0.5 text-[12.5px] text-foreground/80">
                    <EntityText>{ia.role}</EntityText>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Block>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
        <Block title="Memory Salience" className="lg:col-span-2">
          <div className="flex items-end gap-6">
            <div className="font-serif text-5xl tracking-tight text-amber">
              {m.weight}
              <span className="text-[16px] text-muted-foreground">/100</span>
            </div>
            <p className="text-[12.5px] text-muted-foreground leading-relaxed flex-1">
              Cited <span className="text-amber font-mono">{m.citationCount}</span> times across
              chamber deliberations. Remains a primary reference in active governance discourse.
            </p>
          </div>
          <div className="mt-3 h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
            <div className="h-full bg-amber" style={{ width: `${m.weight}%` }} />
          </div>
        </Block>

        <Block title="Trust Score Impact">
          <p className="text-[12.5px] text-foreground/85 leading-relaxed">
            <EntityText>{m.trustImpact}</EntityText>
          </p>
        </Block>
      </div>
    </section>
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
