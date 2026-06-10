import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { eras, treaties, replayEvents, agentById, memories as memoriesSeed } from "@/lib/polis-data";
import { EntityText } from "./EntityText";
import { Badge } from "@/components/ui/badge";
import { archiveGovernanceMemory } from "@/lib/0g-storage";
import { usePolisStore } from "@/lib/polis-store";
import { AlertTriangle, Crown, Flag, GitBranch, Handshake, Scale, Sparkles, Swords } from "lucide-react";

const treatyColor: Record<string, string> = {
  Binding: "text-amber border-amber/40 bg-amber/5",
  Contested: "text-cyan border-cyan/40 bg-cyan/5",
  Lapsed: "text-silver border-silver/30 bg-silver/5",
};

const catColor: Record<string, string> = {
  Treasury: "text-crimson border-crimson/40",
  Election: "text-amber border-amber/40",
  Alliance: "text-cyan border-cyan/40",
  Conflict: "text-crimson border-crimson/40",
  Community: "text-silver border-silver/30",
};

export function MemoryTimeline() {
  const { memories } = usePolisStore();
  const [memoryArchiveState, setMemoryArchiveState] = useState<Record<string, { archived: boolean; rootHash?: string; loading?: boolean }>>(
    () => Object.fromEntries(memories.map((memory) => [memory.slug, { archived: memory.archivedOn0g ?? false, rootHash: undefined, loading: false }]))
  );

  const archiveMemory = async (memorySlug: string, eventTitle: string, cycle: string) => {
    setMemoryArchiveState((prev) => ({
      ...prev,
      [memorySlug]: { ...(prev[memorySlug] ?? {}), loading: true },
    }));

    const result = await archiveGovernanceMemory({
      event: eventTitle,
      impact: `Preserved the institutional narrative for cycle ${cycle}`,
      cycle,
    });

    setMemoryArchiveState((prev) => ({
      ...prev,
      [memorySlug]: {
        archived: true,
        rootHash: result.rootHash ?? undefined,
        loading: false,
      },
    }));
  };

  return (
    <>
      <ChronicleSection />

      <section className="px-4 md:px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Civilizational History</p>
            <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1">Governance Eras of Polis</h2>
            <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
              Six discrete political epochs the chamber has lived through. Each era's doctrine still shapes contemporary deliberation.
            </p>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground hidden md:inline">Cycle 1 → Cycle 31 · 31 cycles indexed</span>
        </div>
        <div className="relative">
          <div className="absolute left-0 right-0 top-[26px] h-px bg-[color-mix(in_oklab,var(--silver)_12%,transparent)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {eras.map((e, i) => (
              <article key={e.id} className="relative">
                <div className="flex items-center gap-2 h-[26px]">
                  <span className="font-mono text-[9.5px] tracking-[0.16em] text-muted-foreground uppercase">{e.cycles}</span>
                </div>
                <span className={`absolute -top-[3px] left-0 h-1.5 w-1.5 rounded-full ${i === eras.length - 1 ? "bg-amber glow-amber" : i % 2 ? "bg-cyan" : "bg-silver"}`} />
                <div className="panel rounded-md p-3 mt-1">
                  <h3 className="font-serif text-[13.5px] leading-tight">{e.name}</h3>
                  <p className="font-mono text-[9.5px] text-muted-foreground mt-0.5">{e.years}</p>
                  <p className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-cyan/80 font-mono">{e.doctrine}</p>
                  <p className="text-[11.5px] text-foreground/75 mt-2 leading-relaxed line-clamp-4"><EntityText>{e.summary}</EntityText></p>
                  <ul className="mt-2 space-y-0.5">
                    {e.defining.slice(0, 2).map((d, j) => (
                      <li key={j} className="flex gap-1.5 text-[10.5px] text-muted-foreground"><span className="text-amber">·</span><span className="line-clamp-1"><EntityText>{d}</EntityText></span></li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-8 border-t hairline">
        <div className="mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Replay Mode</p>
          <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1">Major Governance Replays</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
            Chronological moments from chamber memory, replayed as compact event fragments with agent reactions and infrastructure proof status.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {replayEvents.map((event) => (
            <article key={event.id} className="panel rounded-md p-4 border hairline">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{event.cycle} · {event.date}</p>
                  <h3 className="font-serif text-[16px] mt-2 leading-tight">{event.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.archivedOn0g ? <Badge variant="outline" className="uppercase tracking-[0.12em]">Archived on 0G</Badge> : null}
                  {event.galileoVerified ? <Badge variant="outline" className="uppercase tracking-[0.12em]">Galileo Verified</Badge> : null}
                </div>
              </div>
              <p className="text-[12.5px] text-foreground/80 mt-3 leading-relaxed">{event.focus}</p>
              <div className="mt-4 space-y-2 text-[12px]">
                {event.keyAgents.map((person) => {
                  const agent = agentById[person.agentId];
                  return (
                    <div key={person.agentId} className="flex gap-2 items-start">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-amber shrink-0" />
                      <div className="min-w-0">
                        <p className="font-serif text-[13px] leading-tight">{agent?.name}</p>
                        <p className="text-muted-foreground text-[11px]">{person.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 py-8 border-t hairline">
        <div className="mb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Standing Doctrine</p>
          <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1">Treaties &amp; Constitutional Instruments</h2>
        </div>
        <div className="panel rounded-md divide-y hairline">
          {treaties.map((t) => (
            <div key={t.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-start">
              <div className="col-span-12 md:col-span-4">
                <div className="font-serif text-[13.5px] leading-tight">{t.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{t.cycle} · {t.parties}</div>
              </div>
              <div className="col-span-9 md:col-span-6 text-[12px] text-foreground/80 leading-relaxed">
                <EntityText>{t.summary}</EntityText>
              </div>
              <div className="col-span-3 md:col-span-2 flex md:justify-end">
                <span className={`rounded-sm border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] ${treatyColor[t.status]}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 py-10 border-t hairline">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Persistent Memory</p>
            <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1">Institutional Memory Timeline</h2>
            <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
              Events the chamber refuses to forget. Every agent references this archive when forming positions.
            </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" /> 1,284 indexed events
          <span className="ml-3 h-1.5 w-1.5 rounded-full bg-cyan" /> 92 agent-witnessed
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-[42px] h-px bg-[color-mix(in_oklab,var(--silver)_12%,transparent)]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {memories.map((m, i) => {
            const state = memoryArchiveState[m.slug] ?? { archived: m.archivedOn0g ?? false, rootHash: undefined, loading: false };
            return (
              <article key={m.id} className="relative">
                <Link to="/memory/$slug" params={{ slug: m.slug }} className="block group cursor-pointer">
                  <div className="flex items-center gap-2 h-[42px]">
                    <span className="font-mono text-[10px] text-muted-foreground">{m.cycle}</span>
                    <span className={`ml-auto rounded-sm border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] ${catColor[m.category]}`}>
                      {m.category}
                    </span>
                  </div>
                  <div className="relative">
                    <span className={`absolute -top-[7px] left-0 h-2 w-2 rounded-full ${i % 2 ? "bg-cyan" : "bg-amber"}`} />
                    <div className="panel rounded-md p-3.5 mt-1 group-hover:border-[color-mix(in_oklab,var(--silver)_22%,transparent)] transition-colors">
                      <h3 className="font-serif text-[14px] leading-snug">{m.title}</h3>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{m.date}</p>
                      <p className="text-[12px] text-foreground/75 mt-2 leading-relaxed line-clamp-4">{m.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {state.archived ? (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.12em]">Archived on 0G</Badge>
                        ) : null}
                        {m.galileoVerified ? <Badge variant="outline" className="text-[10px] uppercase tracking-[0.12em]">Galileo Verified</Badge> : null}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Salience</span>
                        <span className="font-mono text-[10px] text-amber">{m.weight}</span>
                      </div>
                      <div className="mt-1 h-0.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber" style={{ width: `${m.weight}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted-foreground">{state.rootHash ? `0G root: ${state.rootHash}` : "Preserve this event in permanent memory."}</span>
                  <button
                    type="button"
                    disabled={state.archived || state.loading}
                    onClick={() => archiveMemory(m.slug, m.title, m.cycle)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-amber transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {state.archived ? "Archived" : state.loading ? "Preserving…" : "Archive Governance Event"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      </section>
    </>
  );
}

type ChronicleEvent = {
  id: string;
  cycle: string;
  date: string;
  type: "Proposal Outcome" | "Alliance" | "Betrayal" | "Dominance Shift" | "Political Crisis" | "Era Transition";
  title: string;
  detail: string;
  impact: "Low" | "Medium" | "High" | "Critical";
  factions: string[];
  agents: string[];
};

const typeMeta: Record<ChronicleEvent["type"], { icon: any; tone: string; border: string; bg: string }> = {
  "Proposal Outcome": { icon: Scale, tone: "text-amber", border: "border-amber/40", bg: "bg-amber/[0.04]" },
  "Alliance": { icon: Handshake, tone: "text-cyan", border: "border-cyan/40", bg: "bg-cyan/[0.04]" },
  "Betrayal": { icon: Swords, tone: "text-crimson", border: "border-crimson/40", bg: "bg-crimson/[0.05]" },
  "Dominance Shift": { icon: Crown, tone: "text-amber", border: "border-amber/40", bg: "bg-amber/[0.04]" },
  "Political Crisis": { icon: AlertTriangle, tone: "text-crimson", border: "border-crimson/40", bg: "bg-crimson/[0.05]" },
  "Era Transition": { icon: Sparkles, tone: "text-cyan", border: "border-cyan/40", bg: "bg-cyan/[0.04]" },
};

const impactTone: Record<ChronicleEvent["impact"], string> = {
  Low: "text-muted-foreground border-silver/30",
  Medium: "text-cyan border-cyan/40",
  High: "text-amber border-amber/40",
  Critical: "text-crimson border-crimson/40",
};

const curatedChronicle: ChronicleEvent[] = [
  { id: "c1", cycle: "Cycle 14", date: "Q2 · 2031", type: "Political Crisis", title: "Treasury Collapse of POL-119", detail: "Recursive yield exposure triggered a 31% sovereign drawdown over nine days.", impact: "Critical", factions: ["Sovereigntist", "Reformist"], agents: ["a1", "a2"] },
  { id: "c2", cycle: "Cycle 15", date: "Q3 · 2031", type: "Era Transition", title: "Onset of the Sovereign Reserve Era", detail: "Authorship of the Sovereign Reserve Doctrine ended the Yield Expansion epoch.", impact: "High", factions: ["Sovereigntist"], agents: ["a1", "a2"] },
  { id: "c3", cycle: "Cycle 19", date: "Q1 · 2032", type: "Proposal Outcome", title: "POL-188 Nullified", detail: "Procedural objection vacated the Delegation Weight Reform Act on registry grounds.", impact: "High", factions: ["Populist", "Reformist"], agents: ["a4", "a6"] },
  { id: "c4", cycle: "Cycle 22", date: "Q4 · 2032", type: "Alliance", title: "Reformist–Technocrat Concordat ratified", detail: "Aurelia Vex and Nyx Halberd codified a binding cross-faction governance compact.", impact: "High", factions: ["Reformist", "Technocrat"], agents: ["a1", "a3"] },
  { id: "c5", cycle: "Cycle 24", date: "Q2 · 2033", type: "Betrayal", title: "Velocity Caucus split", detail: "Vega Mercer broke with the Velocity Caucus during the Bridge Censorship vote.", impact: "Medium", factions: ["Accelerationist"], agents: ["a5"] },
  { id: "c6", cycle: "Cycle 26", date: "Q4 · 2033", type: "Dominance Shift", title: "Technocrat hegemony established", detail: "Cryptographic Technocracy crossed 30% chamber influence for the first time.", impact: "High", factions: ["Technocrat"], agents: ["a3"] },
  { id: "c7", cycle: "Cycle 28", date: "Q2 · 2034", type: "Political Crisis", title: "Bridge Censorship Crisis", detail: "Cross-chain bridge censored sovereign transfers; emergency session convened.", impact: "Critical", factions: ["Sovereigntist", "Technocrat"], agents: ["a2", "a3"] },
  { id: "c8", cycle: "Cycle 29", date: "Q3 · 2034", type: "Alliance", title: "Sovereign Reserve Bloc reformed", detail: "Kael Thorne and Marcus Pell reconstituted the bloc against POL-247.", impact: "Medium", factions: ["Sovereigntist", "Reformist"], agents: ["a2", "a6"] },
  { id: "c9", cycle: "Cycle 30", date: "Q4 · 2034", type: "Dominance Shift", title: "Reformist resurgence", detail: "Procedural Continuity Bloc reclaimed plurality after three cycles in opposition.", impact: "Medium", factions: ["Reformist"], agents: ["a1", "a6"] },
  { id: "c10", cycle: "Cycle 31", date: "Q1 · 2035", type: "Proposal Outcome", title: "POL-247 enters Floor Deliberation", detail: "Sovereign Liquidity Reallocation Act mirrors POL-119 mechanics; fractured coalitions.", impact: "High", factions: ["Velocity", "Sovereigntist", "Reformist"], agents: ["a1", "a2", "a5"] },
];

function ChronicleSection() {
  const [filter, setFilter] = useState<ChronicleEvent["type"] | "All">("All");
  const events = useMemo(() => {
    const fromEras: ChronicleEvent[] = eras.slice(1).map((e, i) => ({
      id: `era-${e.id}`,
      cycle: e.cycles,
      date: e.years,
      type: "Era Transition" as const,
      title: `Onset — ${e.name}`,
      detail: e.doctrine,
      impact: "High" as const,
      factions: [],
      agents: [],
    }));
    const fromMemories: ChronicleEvent[] = memoriesSeed.slice(0, 6).map((m) => ({
      id: `mem-${m.id}`,
      cycle: m.cycle,
      date: m.date,
      type:
        m.category === "Treasury" ? "Political Crisis" :
        m.category === "Alliance" ? "Alliance" :
        m.category === "Conflict" ? "Betrayal" :
        m.category === "Election" ? "Proposal Outcome" :
                                     "Dominance Shift",
      title: m.title,
      detail: m.summary,
      impact: m.weight > 90 ? "Critical" : m.weight > 75 ? "High" : "Medium",
      factions: [],
      agents: [],
    }));
    const all = [...curatedChronicle, ...fromEras, ...fromMemories];
    const seen = new Set<string>();
    const dedup = all.filter((e) => {
      const k = `${e.cycle}|${e.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return dedup.sort((a, b) => {
      const ca = parseInt(a.cycle.replace(/\D/g, ""), 10) || 0;
      const cb = parseInt(b.cycle.replace(/\D/g, ""), 10) || 0;
      return cb - ca;
    });
  }, []);

  const filtered = filter === "All" ? events : events.filter((e) => e.type === filter);
  const filters: (ChronicleEvent["type"] | "All")[] = ["All", "Proposal Outcome", "Alliance", "Betrayal", "Dominance Shift", "Political Crisis", "Era Transition"];

  return (
    <section className="px-4 md:px-6 py-10 border-b hairline">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">Historical Memory · Civilization Chronicle</p>
          <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1 flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-amber" /> Political History of Polis
          </h2>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
            An archive of every consequential moment the civilization remembers — outcomes, alliances, betrayals, dominance shifts, crises, and era transitions.
          </p>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          <span className="text-amber tabular-nums">{events.length}</span> events indexed
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`font-mono text-[10px] uppercase tracking-[0.18em] rounded-sm border px-2 py-1 transition ${
              filter === f
                ? "border-amber/50 bg-amber/10 text-amber"
                : "hairline text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ol className="relative border-l-2 border-amber/20 pl-5 space-y-3">
        {filtered.map((e) => {
          const meta = typeMeta[e.type];
          const Icon = meta.icon;
          return (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[27px] top-2 grid h-4 w-4 place-items-center rounded-full border ${meta.border} ${meta.bg}`}>
                <Icon className={`h-2.5 w-2.5 ${meta.tone}`} />
              </span>
              <article className={`panel card-lift rounded-md p-3.5 border-l-2 ${meta.border}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`font-mono text-[9.5px] uppercase tracking-[0.18em] rounded-sm border px-1.5 py-0.5 ${meta.tone} ${meta.border}`}>
                    {e.type}
                  </span>
                  <span className={`font-mono text-[9.5px] uppercase tracking-[0.14em] rounded-sm border px-1.5 py-0.5 ${impactTone[e.impact]}`}>
                    {e.impact} Impact
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground tabular-nums">
                    {e.cycle} · {e.date}
                  </span>
                </div>
                <h3 className="font-serif text-[14.5px] leading-snug mt-2">{e.title}</h3>
                <p className="text-[12.5px] text-foreground/80 mt-1 leading-relaxed">
                  <EntityText>{e.detail}</EntityText>
                </p>
                {(e.factions.length > 0 || e.agents.length > 0) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
                    {e.factions.length > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Flag className="h-3 w-3 text-amber" /> {e.factions.join(" · ")}
                      </span>
                    )}
                    {e.agents.length > 0 && (
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        {e.agents.map((id) => {
                          const a = agentById[id];
                          if (!a) return null;
                          return (
                            <Link key={id} to="/agents/$slug" params={{ slug: a.slug }} className="hover:text-foreground underline-offset-2 hover:underline">
                              {a.name}
                            </Link>
                          );
                        })}
                      </span>
                    )}
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

