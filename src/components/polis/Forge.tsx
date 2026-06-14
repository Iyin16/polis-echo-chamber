import { useMemo, useState } from "react";
import {
  Crown,
  Swords,
  Handshake,
  Cpu,
  Megaphone,
  Hammer,
  Rocket,
  Shield,
  Network,
  Users2,
  Flame,
  Zap,
  Sparkles,
  Plus,
  Check,
  Loader2,
  Hexagon,
} from "lucide-react";
import { createAgentInPolisSimulation, createAgentWithIntelligence } from "@/lib/polis-store";

type Title = "Strategist" | "Senator" | "Diplomat" | "Technocrat" | "Revolutionary" | "Architect";
type Ideology = {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "amber" | "cyan" | "crimson";
};

const TITLES: { id: Title; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "Strategist", icon: Swords },
  { id: "Senator", icon: Crown },
  { id: "Diplomat", icon: Handshake },
  { id: "Technocrat", icon: Cpu },
  { id: "Revolutionary", icon: Megaphone },
  { id: "Architect", icon: Hammer },
];

const IDEOLOGIES: Ideology[] = [
  {
    id: "expansionist",
    name: "Expansionist",
    tagline: "Manifest reach",
    desc: "Project influence outward. Annex territory, markets, mindshare.",
    icon: Rocket,
    accent: "amber",
  },
  {
    id: "conservative",
    name: "Conservative",
    tagline: "Preserve the codex",
    desc: "Defend institutions, lineage, and the slow weight of precedent.",
    icon: Shield,
    accent: "amber",
  },
  {
    id: "technocratic",
    name: "Technocratic",
    tagline: "Optimal by proof",
    desc: "Govern by metric, model, and mechanism. Sentiment is noise.",
    icon: Network,
    accent: "cyan",
  },
  {
    id: "diplomatic",
    name: "Diplomatic",
    tagline: "The long table",
    desc: "Build coalitions, broker peace, weaponize patience.",
    icon: Handshake,
    accent: "cyan",
  },
  {
    id: "populist",
    name: "Populist",
    tagline: "Voice of the crowd",
    desc: "Channel raw public will. The street legitimizes the chamber.",
    icon: Users2,
    accent: "crimson",
  },
  {
    id: "chaos",
    name: "Chaos-Driven",
    tagline: "Burn the protocol",
    desc: "Embrace volatility. Disorder is the only honest signal.",
    icon: Flame,
    accent: "crimson",
  },
];

const FACTIONS = [
  {
    id: "reformist",
    name: "Reformist Bloc",
    motto: "Iterate the republic",
    accent: "amber" as const,
  },
  {
    id: "technocrat",
    name: "Technocrat Cabinet",
    motto: "Govern by gradient",
    accent: "cyan" as const,
  },
  {
    id: "sovereigntist",
    name: "Sovereigntist Order",
    motto: "Hold the line",
    accent: "crimson" as const,
  },
];

const TRAITS = ["aggression", "logic", "cooperation", "ambition", "risk"] as const;
type Trait = (typeof TRAITS)[number];
const TRAIT_LABELS: Record<Trait, string> = {
  aggression: "Aggression",
  logic: "Logic",
  cooperation: "Cooperation",
  ambition: "Ambition",
  risk: "Risk Tolerance",
};

export function Forge() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState<Title>("Strategist");
  const [philosophy, setPhilosophy] = useState("");
  const [ideology, setIdeology] = useState<string>("technocratic");
  const [traits, setTraits] = useState<Record<Trait, number>>({
    aggression: 45,
    logic: 70,
    cooperation: 55,
    ambition: 75,
    risk: 50,
  });
  const [factionMode, setFactionMode] = useState<"join" | "independent" | "create">("join");
  const [factionChoice, setFactionChoice] = useState<string>("technocrat");
  const [newFaction, setNewFaction] = useState("");

  const [status, setStatus] = useState<"idle" | "minting" | "minted">("idle");
  const [mintedHash, setMintedHash] = useState<string>("");

  const ideologyObj = IDEOLOGIES.find((i) => i.id === ideology)!;

  const influence = useMemo(() => {
    const t = traits;
    return Math.round(
      t.ambition * 0.35 +
        t.logic * 0.25 +
        t.cooperation * 0.15 +
        t.aggression * 0.15 +
        t.risk * 0.1,
    );
  }, [traits]);

  const behavior = useMemo(() => {
    const t = traits;
    if (t.aggression > 65 && t.risk > 60) return "Provokes high-stakes confrontation cycles";
    if (t.logic > 70 && t.cooperation > 55) return "Builds technocratic consensus through evidence";
    if (t.cooperation > 70) return "Forms durable cross-faction coalitions";
    if (t.ambition > 75 && t.aggression > 55) return "Seizes leadership during chamber instability";
    return "Calibrates positions to shifting coalitions";
  }, [traits]);

  const governance = useMemo(() => {
    const t = traits;
    if (t.logic > t.aggression && t.logic > 60) return "Procedural · evidence-weighted";
    if (t.aggression > 60) return "Decisive · majoritarian";
    return "Deliberative · consensus-seeking";
  }, [traits]);

  const compatibility = useMemo(() => {
    const id = ideologyObj.id;
    if (factionMode !== "join")
      return factionMode === "create" ? "New banner · 100% native" : "Independent · 0% bloc bias";
    if (factionChoice === "technocrat" && (id === "technocratic" || id === "diplomatic"))
      return "High · 92%";
    if (factionChoice === "reformist" && (id === "populist" || id === "expansionist"))
      return "High · 88%";
    if (factionChoice === "sovereigntist" && (id === "conservative" || id === "chaos"))
      return "High · 86%";
    return "Moderate · 64%";
  }, [factionMode, factionChoice, ideologyObj]);

  const role = useMemo(() => {
    if (title === "Senator" && influence > 60) return "Chamber whip";
    if (title === "Diplomat") return "Coalition broker";
    if (title === "Technocrat") return "Policy architect";
    if (title === "Revolutionary") return "Insurgent voice";
    if (title === "Architect") return "Institutional designer";
    return "Field strategist";
  }, [title, influence]);

  const canMint = name.trim().length >= 2 && status === "idle";

  const handleMint = async () => {
    if (!canMint) return;
    setStatus("minting");
    try {
      // Map UI selections to AgentCreationInputs expected by the intelligence engine
      const intelligenceInputs = {
        leadershipStyle:
          title === "Strategist" || title === "Technocrat" ? "Pragmatic" : title === "Senator" ? "Democratic" : "Visionary",
        governancePhilosophy: ideologyObj.id === "technocratic" ? "Technocratic" : ideologyObj.id === "conservative" ? "Centralized" : "Hybrid",
        riskTolerance: traits.risk > 65 ? "Aggressive" : traits.risk < 35 ? "Conservative" : "Balanced",
        communicationStyle: traits.logic > 65 ? "Analytical" : traits.cooperation > 65 ? "Collaborative" : "Persuasive",
        strategicFocus: ideologyObj.id === "technocratic" ? "Economic" : ideologyObj.id === "diplomatic" ? "Diplomatic" : ideologyObj.id === "populist" ? "Social" : "Cultural",
        ethicalAlignment: traits.ambition > 70 ? "Pragmatic" : "Neutral",
        politicalTemperament: traits.cooperation > 60 ? "Cooperative" : "Competitive",
      } as any;

      const factionName =
        factionMode === "join"
          ? (FACTIONS.find((f) => f.id === factionChoice)?.name ?? "Independent")
          : factionMode === "create"
            ? newFaction || "Unnamed Banner"
            : "Independent";

      const { agent } = await createAgentWithIntelligence({
        name,
        title,
        philosophy,
        intelligenceInputs,
        autoMint: true,
      });

      setMintedHash(agent.nftAddress ?? "");
      setStatus("minted");
    } catch (err) {
      console.error("Forge mint failed", err);
      setStatus("idle");
    }
  };

  return (
    <div className="relative">
      {/* Cinematic backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <section className="relative px-4 md:px-6 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
        <Header />

        <SectionPanel index={1} label="Agent Identity" accent="amber">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Designation">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aetheris Vael"
                className="w-full bg-background/60 border hairline rounded-md px-3 py-2.5 text-[14px] font-serif tracking-wide focus:outline-none focus:border-amber/60 focus:glow-amber transition"
              />
            </Field>
            <Field label="Sovereign Title">
              <div className="grid grid-cols-3 gap-1.5">
                {TITLES.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTitle(id)}
                    className={`group relative flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[10.5px] font-mono uppercase tracking-widest transition ${
                      title === id
                        ? "border-amber/60 bg-amber/10 text-amber glow-amber"
                        : "hairline bg-background/40 text-muted-foreground hover:text-foreground hover:border-amber/30"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {id}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Political Philosophy" className="mt-4">
            <textarea
              value={philosophy}
              onChange={(e) => setPhilosophy(e.target.value)}
              placeholder="A single doctrine. Etched into the chamber."
              rows={2}
              className="w-full bg-background/60 border hairline rounded-md px-3 py-2.5 text-[13px] focus:outline-none focus:border-amber/60 transition resize-none"
            />
          </Field>
        </SectionPanel>

        <SectionPanel index={2} label="Ideology Vector" accent="cyan">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {IDEOLOGIES.map((i) => {
              const Icon = i.icon;
              const active = ideology === i.id;
              const ring =
                i.accent === "amber"
                  ? "border-amber/60 glow-amber"
                  : i.accent === "cyan"
                    ? "border-cyan/60 glow-cyan"
                    : "border-crimson/60 glow-crimson";
              const tint =
                i.accent === "amber"
                  ? "text-amber"
                  : i.accent === "cyan"
                    ? "text-cyan"
                    : "text-crimson";
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setIdeology(i.id)}
                  className={`group relative text-left panel rounded-md p-4 card-lift transition overflow-hidden ${
                    active ? ring : "hover:border-foreground/20"
                  }`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-transparent via-transparent to-foreground/[0.04]" />
                  <div className="flex items-start gap-3 relative">
                    <div
                      className={`shrink-0 h-9 w-9 rounded-md border hairline flex items-center justify-center ${tint} bg-background/40`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-[15px] leading-none">{i.name}</h3>
                        {active && <Check className="h-3 w-3 text-amber" />}
                      </div>
                      <p
                        className={`mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.2em] ${tint}`}
                      >
                        {i.tagline}
                      </p>
                      <p className="mt-2 text-[12px] text-muted-foreground leading-snug">
                        {i.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionPanel>

        <SectionPanel index={3} label="Personality Engine" accent="amber">
          <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
            <div className="space-y-4">
              {TRAITS.map((t) => (
                <TraitSlider
                  key={t}
                  label={TRAIT_LABELS[t]}
                  value={traits[t]}
                  onChange={(v) => setTraits((s) => ({ ...s, [t]: v }))}
                />
              ))}
            </div>
            <div className="panel rounded-md p-4 flex flex-col items-center justify-center">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                Cognitive Radar
              </p>
              <RadarChart traits={traits} />
            </div>
          </div>
        </SectionPanel>

        <SectionPanel index={4} label="Faction Alignment" accent="crimson">
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {(["join", "independent", "create"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFactionMode(m)}
                className={`rounded-md border px-3 py-2 text-[11px] font-mono uppercase tracking-widest transition ${
                  factionMode === m
                    ? "border-amber/60 bg-amber/10 text-amber"
                    : "hairline bg-background/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "join" ? "Join Bloc" : m === "independent" ? "Independent" : "Found Banner"}
              </button>
            ))}
          </div>

          {factionMode === "join" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {FACTIONS.map((f) => {
                const active = factionChoice === f.id;
                const tint =
                  f.accent === "amber"
                    ? "text-amber"
                    : f.accent === "cyan"
                      ? "text-cyan"
                      : "text-crimson";
                const bg =
                  f.accent === "amber"
                    ? "bg-amber"
                    : f.accent === "cyan"
                      ? "bg-cyan"
                      : "bg-crimson";
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFactionChoice(f.id)}
                    className={`relative panel rounded-md p-4 text-left card-lift overflow-hidden ${
                      active ? "border-amber/60 glow-amber" : ""
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-0.5 ${bg} opacity-80`} />
                    <Hexagon
                      className={`absolute -right-4 -top-4 h-20 w-20 opacity-10 ${tint}`}
                      strokeWidth={1}
                    />
                    <p className={`font-mono text-[9.5px] uppercase tracking-[0.22em] ${tint}`}>
                      Faction
                    </p>
                    <h3 className="font-serif text-[16px] mt-1">{f.name}</h3>
                    <p className="text-[12px] text-muted-foreground italic mt-1">"{f.motto}"</p>
                    {active && (
                      <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono text-amber">
                        <Check className="h-3 w-3" /> Aligned
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {factionMode === "independent" && (
            <div className="panel rounded-md p-5 text-center">
              <Zap className="h-5 w-5 text-amber mx-auto" />
              <p className="font-serif text-[15px] mt-2">Unaligned Sovereign</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Votes as a free agent. No bloc discipline. Higher volatility, higher signal.
              </p>
            </div>
          )}

          {factionMode === "create" && (
            <Field label="New Banner Name">
              <div className="flex gap-2">
                <input
                  value={newFaction}
                  onChange={(e) => setNewFaction(e.target.value)}
                  placeholder="e.g. The Lattice Compact"
                  className="flex-1 bg-background/60 border hairline rounded-md px-3 py-2.5 text-[14px] font-serif focus:outline-none focus:border-amber/60 transition"
                />
                <button
                  type="button"
                  className="rounded-md border border-amber/40 bg-amber/10 text-amber px-3 text-[11px] font-mono uppercase tracking-widest"
                >
                  <Plus className="h-3.5 w-3.5 inline -mt-0.5" /> Found
                </button>
              </div>
            </Field>
          )}
        </SectionPanel>

        <SectionPanel index={5} label="Sovereign Preview" accent="cyan">
          <div className="grid gap-4 md:grid-cols-2">
            <PreviewStat
              label="Projected Influence"
              value={`${influence}`}
              suffix="/100"
              accent="amber"
              bar={influence}
            />
            <PreviewStat label="Faction Compatibility" value={compatibility} accent="cyan" />
            <PreviewLine label="Predicted Behavior" value={behavior} />
            <PreviewLine label="Governance Tendency" value={governance} />
            <PreviewLine label="Projected Role" value={role} />
            <PreviewLine
              label="Ideology Anchor"
              value={`${ideologyObj.name} · ${ideologyObj.tagline}`}
            />
          </div>
        </SectionPanel>

        <SectionPanel index={6} label="Initialize" accent="amber">
          {status !== "minted" ? (
            <div className="flex flex-col items-center text-center py-2">
              <p className="text-[13px] text-muted-foreground max-w-md">
                Commit the sovereign entity to chain. This action writes an immutable identity to
                Arbitrum and registers it in the chamber registry.
              </p>
              <button
                type="button"
                disabled={!canMint}
                onClick={handleMint}
                className="mt-5 group relative inline-flex items-center gap-2 rounded-md border border-amber/60 bg-gradient-to-b from-amber/20 to-amber/5 px-6 py-3 font-mono text-[12px] uppercase tracking-[0.22em] text-amber hover:glow-amber transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "minting" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling Sovereign…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Initialize Sovereign Entity
                  </>
                )}
              </button>
              {status === "minting" && <MintProgress />}
              {!canMint && status === "idle" && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Designation required
                </p>
              )}
            </div>
          ) : (
            <IdentityCard
              name={name}
              title={title}
              ideology={ideologyObj}
              influence={influence}
              role={role}
              hash={mintedHash}
              faction={
                factionMode === "join"
                  ? FACTIONS.find((f) => f.id === factionChoice)?.name
                  : factionMode === "create"
                    ? newFaction || "Unnamed Banner"
                    : "Independent"
              }
            />
          )}
        </SectionPanel>
      </section>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber">
        Polis · Sovereign Forge
      </p>
      <h1 className="font-serif text-2xl md:text-4xl tracking-tight">
        Initialize a sovereign political entity
      </h1>
      <p className="text-[13px] text-muted-foreground max-w-2xl mx-auto">
        Shape an autonomous agent — its ideology, temperament, and faction — and commit its identity
        to Arbitrum.
      </p>
    </div>
  );
}

function SectionPanel({
  index,
  label,
  accent,
  children,
}: {
  index: number;
  label: string;
  accent: "amber" | "cyan" | "crimson";
  children: React.ReactNode;
}) {
  const tint = accent === "amber" ? "text-amber" : accent === "cyan" ? "text-cyan" : "text-crimson";
  const bar = accent === "amber" ? "bg-amber" : accent === "cyan" ? "bg-cyan" : "bg-crimson";
  return (
    <section className="panel rounded-lg p-5 md:p-6 fade-in relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-[2px] ${bar} opacity-70`} />
      <header className="flex items-center gap-3 mb-5">
        <span className={`font-mono text-[10px] ${tint}`}>0{index}</span>
        <span className="h-px flex-1 bg-foreground/10" />
        <h2 className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-muted-foreground">
          {label}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function TraitSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const accent = value > 70 ? "text-crimson" : value > 50 ? "text-amber" : "text-cyan";
  const bg = value > 70 ? "bg-crimson" : value > 50 ? "bg-amber" : "bg-cyan";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span className={`font-mono text-[12px] tabular-nums ${accent}`}>
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${bg} opacity-80`}
          style={{ width: `${value}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function RadarChart({ traits }: { traits: Record<Trait, number> }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;
  const values = TRAITS.map((t) => traits[t]);
  const points = values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / TRAITS.length - Math.PI / 2;
    const rr = (v / 100) * r;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
  });
  const polygon = points.map((p) => p.join(",")).join(" ");
  return (
    <svg width={size} height={size} className="overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((s, i) => (
        <polygon
          key={i}
          points={TRAITS.map((_, idx) => {
            const angle = (Math.PI * 2 * idx) / TRAITS.length - Math.PI / 2;
            const rr = r * s;
            return `${cx + rr * Math.cos(angle)},${cy + rr * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="currentColor"
          className="text-foreground/10"
          strokeWidth={1}
        />
      ))}
      {TRAITS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / TRAITS.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="currentColor"
            className="text-foreground/10"
          />
        );
      })}
      <polygon
        points={polygon}
        fill="var(--amber)"
        fillOpacity={0.18}
        stroke="var(--amber)"
        strokeWidth={1.5}
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="var(--amber)" />
      ))}
      {TRAITS.map((t, i) => {
        const angle = (Math.PI * 2 * i) / TRAITS.length - Math.PI / 2;
        const lx = cx + (r + 16) * Math.cos(angle);
        const ly = cy + (r + 16) * Math.sin(angle);
        return (
          <text
            key={t}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground font-mono"
            style={{ fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            {TRAIT_LABELS[t].split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

function PreviewStat({
  label,
  value,
  suffix,
  accent,
  bar,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: "amber" | "cyan";
  bar?: number;
}) {
  const tint = accent === "amber" ? "text-amber" : "text-cyan";
  const bg = accent === "amber" ? "bg-amber" : "bg-cyan";
  return (
    <div className="panel rounded-md p-4">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 font-serif text-[22px] ${tint}`}>
        {value}
        <span className="text-[12px] text-muted-foreground font-mono ml-1">{suffix}</span>
      </p>
      {typeof bar === "number" && (
        <div className="mt-2 h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
          <div className={`h-full ${bg}`} style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel rounded-md p-4">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[13.5px] font-serif">{value}</p>
    </div>
  );
}

function MintProgress() {
  const steps = ["Compiling persona vector", "Etching ideology hash", "Broadcasting to Arbitrum"];
  return (
    <div className="mt-5 w-full max-w-md space-y-2">
      {steps.map((s, i) => (
        <div
          key={s}
          className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          <Loader2
            className="h-3 w-3 animate-spin text-amber"
            style={{ animationDelay: `${i * 200}ms` }}
          />
          <span>{s}…</span>
        </div>
      ))}
      <div className="h-1 w-full rounded-full overflow-hidden bg-foreground/5 mt-2">
        <div className="h-full shimmer" />
      </div>
    </div>
  );
}

function IdentityCard({
  name,
  title,
  ideology,
  influence,
  role,
  hash,
  faction,
}: {
  name: string;
  title: Title;
  ideology: Ideology;
  influence: number;
  role: string;
  hash: string;
  faction?: string;
}) {
  const Icon = ideology.icon;
  return (
    <div className="fade-in mx-auto max-w-xl panel rounded-lg p-6 relative overflow-hidden border-amber/40 glow-amber">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-amber/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-amber">
            Sovereign Entity · Minted
          </p>
          <span className="inline-flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-amber pulse-dot text-amber" /> Live
          </span>
        </div>
        <div className="mt-4 flex items-start gap-4">
          <div className="h-14 w-14 rounded-md border border-amber/40 bg-amber/10 text-amber flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif text-2xl tracking-tight">{name}</h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
              {title} · {ideology.name}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Cell label="Influence" value={`${influence}`} />
          <Cell label="Role" value={role} />
          <Cell label="Banner" value={faction ?? "—"} />
        </div>
        <div className="mt-5 rounded-md border hairline bg-background/40 p-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-cyan">
              Registered on Arbitrum
            </p>
            <Check className="h-3.5 w-3.5 text-cyan" />
          </div>
          <p className="mt-1.5 font-mono text-[10.5px] break-all text-foreground/80">{hash}</p>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border hairline bg-background/40 p-2.5">
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-[13px] truncate">{value}</p>
    </div>
  );
}
