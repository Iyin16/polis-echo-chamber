import { agents, factionInfluence, factionTrends, chamberSignals, eras, proposals } from "@/lib/polis-data";
import { EraPanel } from "./EraPanel";
import { AgentAvatar } from "./AgentAvatar";
import { driftedValue, useTick, rotatingIndex } from "@/lib/use-live-pulse";
import { Activity, BrainCircuit, Crown, Flame, Gauge, HeartPulse, Radio, ShieldAlert, Sparkles } from "lucide-react";

export function Dominance() {
  const t = useTick();

  // Live faction influence
  const liveFactions = factionInfluence
    .map((f) => {
      const trend = factionTrends.find((x) => x.name === f.name)!;
      const live = driftedValue(`dom-fac-${f.name}`, f.value, trend.volatility * 0.6, 1);
      return { ...f, live, delta: +(live - f.value).toFixed(1) };
    })
    .sort((a, b) => b.live - a.live);

  const dominant = liveFactions[0];
  const runnerUp = liveFactions[1];
  const lead = +(dominant.live - runnerUp.live).toFixed(1);

  const tension = driftedValue("dom-tension", 62, 4, 0);
  const stability = driftedValue("dom-stability", 71, 3, 0);

  const leaderboard = [...agents]
    .map((a) => ({
      a,
      power: driftedValue(`dom-power-${a.slug}`, (a.influence + a.reputation) / 2, 1.2, 1),
    }))
    .sort((x, y) => y.power - x.power)
    .slice(0, 8);

  const events = [
    { time: "00:42", level: "alert", text: chamberSignals[2] },
    { time: "01:18", level: "shift", text: chamberSignals[4] },
    { time: "02:03", level: "info", text: chamberSignals[11] },
    { time: "03:47", level: "shift", text: chamberSignals[14] },
    { time: "05:21", level: "alert", text: chamberSignals[9] },
    { time: "07:02", level: "info", text: chamberSignals[6] },
    { time: "08:55", level: "shift", text: chamberSignals[16] },
  ];

  const tickerIdx = rotatingIndex(chamberSignals.length, 3);

  const activeProposals = proposals.filter((p) => /Active|Deliberation|Voting/i.test(p.statusTag + " " + p.status)).length;
  const emotion = tension > 70 ? "Fragmenting" : tension > 50 ? "Tense" : stability > 70 ? "Stable" : "Reforming";
  const emotionTone = emotion === "Fragmenting" ? "text-crimson" : emotion === "Tense" ? "text-amber" : emotion === "Stable" ? "text-cyan" : "text-silver";
  const health = Math.round(Math.max(0, Math.min(100, stability * 0.6 + (100 - tension) * 0.4)));
  const healthTone = health > 70 ? "text-cyan" : health > 50 ? "text-amber" : "text-crimson";
  const turnNumber = 31;

  return (
    <section className="px-4 md:px-6 py-10">
      {/* Command Center Hero */}
      <div className="panel rounded-md p-5 md:p-6 mb-6 relative overflow-hidden border-l-4 border-l-amber">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">World State · Command Center</p>
              <h1 className="font-serif text-2xl md:text-3xl tracking-tight mt-1">Civilization Vitals</h1>
              <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
                Live telemetry of the chamber's political climate, faction balance, and civilizational health.
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber glow-amber animate-pulse" /> LIVE</span>
              <span>TICK {String(t).padStart(4, "0")}</span>
              <span>TURN <span className="text-amber tabular-nums">{turnNumber}</span></span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
            <VitalTile
              label="World Stability"
              value={`${stability.toFixed(0)}`}
              suffix="/100"
              icon={<ShieldAlert className="h-3 w-3" />}
              tone="amber"
              bar={stability}
            />
            <VitalTile
              label="Political Tension"
              value={`${tension.toFixed(0)}`}
              suffix="/100"
              icon={<Flame className="h-3 w-3" />}
              tone="crimson"
              bar={tension}
            />
            <VitalTile
              label="World Emotion"
              value={emotion}
              icon={<BrainCircuit className="h-3 w-3" />}
              tone="cyan"
              textTone={emotionTone}
            />
            <VitalTile
              label="Current Era"
              value={currentEra.name}
              icon={<Sparkles className="h-3 w-3" />}
              tone="cyan"
              compact
            />
            <VitalTile
              label="Dominant Faction"
              value={dominant.name}
              icon={<Crown className="h-3 w-3" />}
              tone="amber"
              valueStyle={{ color: dominant.color }}
              compact
            />
            <VitalTile
              label="Active Proposals"
              value={String(activeProposals)}
              icon={<Gauge className="h-3 w-3" />}
              tone="amber"
            />
            <VitalTile
              label="Civilization Health"
              value={`${health}`}
              suffix="%"
              icon={<HeartPulse className="h-3 w-3" />}
              tone="cyan"
              bar={health}
              textTone={healthTone}
            />
          </div>

          {/* Faction dominance bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>Faction Dominance</span>
              <span className="text-amber tabular-nums">{dominant.live.toFixed(1)}% lead +{lead}</span>
            </div>
            <div className="flex h-2.5 w-full overflow-hidden rounded-sm">
              {liveFactions.map((f) => (
                <span
                  key={f.name}
                  className="transition-all duration-1000"
                  style={{ width: `${f.live}%`, background: f.color }}
                  title={`${f.name} ${f.live.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-muted-foreground">
              {liveFactions.map((f) => (
                <span key={f.name} className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-sm" style={{ background: f.color }} />
                  <span style={{ color: f.color }}>{f.name}</span>
                  <span className="tabular-nums">{f.live.toFixed(1)}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Command Layer · Live</p>
          <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1">Faction Dominance</h2>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
            Real-time monitoring of civilizational power balance across the chamber.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber glow-amber animate-pulse" /> LIVE
          </span>
          <span>TICK {String(t).padStart(4, "0")}</span>
        </div>
      </div>

      {/* Top: Dominant + Era */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="panel rounded-md p-5 lg:col-span-7 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Crown className="h-3 w-3 text-amber" /> Dominant Faction
            </div>
            <div className="mt-3 flex items-end gap-4 flex-wrap">
              <div>
                <h2
                  className="font-serif text-4xl md:text-5xl tracking-tight"
                  style={{ color: dominant.color }}
                >
                  {dominant.name}
                </h2>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                  Hegemony · Cycle 31 · Lead +{lead}% over {runnerUp.name}
                </p>
              </div>
              <div className="ml-auto text-right">
                <div className="font-serif text-3xl text-amber tabular-nums">
                  {dominant.live.toFixed(1)}%
                </div>
                <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  Influence Share
                </div>
              </div>
            </div>
            <div className="mt-5 flex h-2 w-full overflow-hidden rounded-sm">
              {liveFactions.map((f) => (
                <span
                  key={f.name}
                  className="transition-all duration-1000"
                  style={{ width: `${f.live}%`, background: f.color }}
                  title={`${f.name} ${f.live.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[10px]">
              {liveFactions.map((f) => (
                <div
                  key={f.name}
                  className="rounded-sm border hairline px-2 py-1.5 bg-background/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate" style={{ color: f.color }}>
                      {f.name}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{f.live.toFixed(1)}</span>
                  </div>
                  <div
                    className={`text-[9px] tabular-nums ${f.delta > 0 ? "text-amber" : f.delta < 0 ? "text-crimson" : "text-muted-foreground"}`}
                  >
                    {f.delta > 0 ? "▲" : f.delta < 0 ? "▼" : "·"} {Math.abs(f.delta).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <EraPanel />
        </div>

        {/* Meters */}
        <div className="panel rounded-md p-5 lg:col-span-6">
          <Meter
            icon={<Flame className="h-3 w-3 text-crimson" />}
            label="Political Tension"
            value={tension}
            scaleLeft="Concord"
            scaleRight="Rupture"
            accent="crimson"
            status={
              tension > 75
                ? "Crisis-adjacent · escalation likely"
                : tension > 55
                  ? "Elevated · cross-faction friction"
                  : tension > 35
                    ? "Moderate · routine deliberation"
                    : "Subdued · cooperative drift"
            }
          />
          <div className="my-5 h-px bg-foreground/5" />
          <Meter
            icon={<ShieldAlert className="h-3 w-3 text-amber" />}
            label="World Stability"
            value={stability}
            scaleLeft="Collapse"
            scaleRight="Stable"
            accent="amber"
            status={
              stability > 78
                ? "Stable · institutional confidence holding"
                : stability > 60
                  ? "Elevated but cautious"
                  : stability > 45
                    ? "Weakening · monitoring"
                    : "Destabilizing · review"
            }
          />
        </div>

        {/* Leaderboard */}
        <div className="panel rounded-md p-5 lg:col-span-6">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <Activity className="h-3 w-3 text-amber" /> Agent Leaderboard · Composite Power
          </div>
          <ul className="mt-3 divide-y hairline">
            {leaderboard.map((row, i) => (
              <li key={row.a.id} className="flex items-center gap-3 py-2">
                <span className="font-mono text-[10px] text-muted-foreground w-5 tabular-nums">
                  {(i + 1).toString().padStart(2, "0")}
                </span>
                <AgentAvatar agent={row.a} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] truncate">{row.a.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">
                    {row.a.faction} · {row.a.ideology}
                  </p>
                </div>
                <div className="w-28 hidden sm:block">
                  <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber transition-all duration-1000"
                      style={{ width: `${row.power}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[11px] tabular-nums text-amber w-10 text-right">
                  {row.power.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent events */}
        <div className="panel rounded-md p-5 lg:col-span-12">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <Radio className="h-3 w-3 text-cyan" /> Recent Political Events
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate max-w-[60%]">
              LIVE FEED · {chamberSignals[tickerIdx]}
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {events.map((e, i) => {
              const color =
                e.level === "alert" ? "crimson" : e.level === "shift" ? "amber" : "cyan";
              const colorClass =
                color === "crimson"
                  ? "text-crimson border-crimson/30"
                  : color === "amber"
                    ? "text-amber border-amber/30"
                    : "text-cyan border-cyan/30";
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-sm border hairline bg-background/30 px-3 py-2"
                >
                  <span
                    className={`shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] border rounded-sm px-1.5 py-0.5 ${colorClass}`}
                  >
                    T−{e.time}
                  </span>
                  <span className="text-[12.5px] text-foreground/85">{e.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Meter({
  icon,
  label,
  value,
  scaleLeft,
  scaleRight,
  accent,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  scaleLeft: string;
  scaleRight: string;
  accent: "amber" | "crimson" | "cyan";
  status: string;
}) {
  const colorVar =
    accent === "amber" ? "var(--amber)" : accent === "crimson" ? "var(--crimson)" : "var(--cyan)";
  const textClass =
    accent === "amber" ? "text-amber" : accent === "crimson" ? "text-crimson" : "text-cyan";
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {icon} {label}
        </div>
        <span className={`font-serif text-2xl tabular-nums ${textClass}`}>
          {value.toFixed(1)}
          <span className="text-muted-foreground text-[12px]">/100</span>
        </span>
      </div>
      <div className="mt-3 relative h-2 rounded-full bg-foreground/5 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-1000"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${colorVar}55, ${colorVar})`,
          }}
        />
        {[25, 50, 75].map((m) => (
          <span
            key={m}
            className="absolute top-0 bottom-0 w-px bg-background/60"
            style={{ left: `${m}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{scaleLeft}</span>
        <span>{scaleRight}</span>
      </div>
      <p className={`mt-2 text-[12px] ${textClass}`}>{status}</p>
    </div>
  );
}

function VitalTile({
  label, value, suffix, icon, tone, bar, compact, valueStyle, textTone,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  tone: "amber" | "crimson" | "cyan";
  bar?: number;
  compact?: boolean;
  valueStyle?: React.CSSProperties;
  textTone?: string;
}) {
  const colorVar = tone === "amber" ? "var(--amber)" : tone === "crimson" ? "var(--crimson)" : "var(--cyan)";
  const tc = textTone ?? (tone === "amber" ? "text-amber" : tone === "crimson" ? "text-crimson" : "text-cyan");
  return (
    <div className="rounded-sm border hairline bg-background/40 px-2.5 py-2">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className={tc}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-1.5 font-serif ${compact ? "text-[15px]" : "text-[20px]"} tabular-nums truncate ${tc}`} style={valueStyle}>
        {value}{suffix ? <span className="text-muted-foreground text-[11px] ml-0.5">{suffix}</span> : null}
      </div>
      {typeof bar === "number" ? (
        <div className="mt-2 h-1 rounded-full bg-foreground/5 overflow-hidden">
          <div className="h-full transition-all duration-1000" style={{ width: `${bar}%`, background: `linear-gradient(90deg, ${colorVar}55, ${colorVar})` }} />
        </div>
      ) : null}
    </div>
  );
}

