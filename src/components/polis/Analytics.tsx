import {
  agents,
  factionInfluence,
  factionTrends,
  stabilityIndices,
  trustRanking,
  getAgentPerformance,
} from "@/lib/polis-data";
import { AgentAvatar } from "./AgentAvatar";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { driftedValue, jitter, useTick } from "@/lib/use-live-pulse";

const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

export function Analytics() {
  const t = useTick();
  return (
    <section className="px-4 md:px-6 py-10 border-t hairline">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Intelligence Layer
          </p>
          <h2 className="font-serif text-xl md:text-2xl tracking-tight mt-1">Chamber Analytics</h2>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          UPDATED · {String((t * 2) % 60).padStart(2, "0")}s AGO · LIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="panel rounded-md p-5 lg:col-span-5">
          <Header
            title="Faction Influence"
            subtitle="Weighted by reputation × delegation · live drift"
          />
          <FactionBars />
        </div>

        <div className="panel rounded-md p-5 lg:col-span-3 flex flex-col">
          <Header title="Proposal Prediction" subtitle="POL-247 · Monte Carlo · n=10,000" />
          <PredictionGauge />
          <PredictionLegend />
        </div>

        <div className="panel rounded-md p-5 lg:col-span-4">
          <Header title="Agent Trust Ranking" subtitle="7-day delta · live" />
          <ul className="mt-3 divide-y hairline">
            {trustRanking.map((t, i) => {
              const a = agentMap[t.id];
              const live = driftedValue(`trust-${t.id}`, t.delta, 1.2, 1);
              const pos = live > 0;
              const neg = live < 0;
              return (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <span className="font-mono text-[10px] text-muted-foreground w-4">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <AgentAvatar agent={a} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] truncate">{a.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{a.faction}</p>
                  </div>
                  <span
                    className={`flex items-center gap-1 font-mono text-[11px] tabular-nums ${
                      pos ? "text-amber" : neg ? "text-crimson" : "text-muted-foreground"
                    }`}
                  >
                    {pos ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : neg ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {Math.abs(live).toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel rounded-md p-5 lg:col-span-7">
          <Header title="Community Sentiment" subtitle="48h rolling · indexed · live" />
          <SentimentChart />
        </div>

        <div className="panel rounded-md p-5 lg:col-span-5">
          <Header
            title="Governance Stability Score"
            subtitle="Composite of 14 indicators · drifting"
          />
          <StabilityScore />
        </div>

        <div className="panel rounded-md p-5 lg:col-span-12">
          <Header
            title="Faction Volatility Index"
            subtitle="Magnitude of influence change per cycle · live"
          />
          <FactionVolatility />
        </div>

        <div className="panel rounded-md p-5 lg:col-span-12">
          <Header
            title="Agent Performance"
            subtitle="Influence, trust and coalition power across the leading figures"
          />
          <div className="mt-4 space-y-3">
            {agents.slice(0, 4).map((agent) => {
              const perf = getAgentPerformance(agent);
              const trust = driftedValue(`agent-trust-${agent.slug}`, perf.publicTrust, 1.2, 0);
              const power = driftedValue(`agent-power-${agent.slug}`, perf.coalitionPower, 1.5, 0);
              return (
                <div key={agent.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                    <AgentAvatar agent={agent} size={28} />
                    <div>
                      <p className="font-serif text-[13px] leading-tight">{agent.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{agent.faction}</p>
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Influence
                    </div>
                    <div className="font-semibold text-[13px] text-amber">{perf.influence}</div>
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Trust
                    </div>
                    <div className="font-semibold text-[13px] text-cyan">{trust}</div>
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Power
                    </div>
                    <div className="font-semibold text-[13px] text-silver">{power}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h3 className="font-serif text-[15px]">{title}</h3>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
        {subtitle}
      </p>
    </div>
  );
}

function FactionBars() {
  return (
    <div className="mt-4 space-y-3">
      {factionInfluence.map((f) => {
        const trend = factionTrends.find((x) => x.name === f.name)!;
        const live = driftedValue(`fac-${f.name}`, trend.baseline, trend.volatility, 1);
        const delta = +(live - trend.baseline).toFixed(1);
        const pos = delta > 0;
        return (
          <div key={f.name}>
            <div className="flex justify-between text-[12px] mb-1 items-baseline">
              <span>{f.name}</span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {live.toFixed(1)}%
                <span
                  className={`ml-2 text-[10px] ${pos ? "text-amber" : delta < 0 ? "text-crimson" : "text-muted-foreground"}`}
                >
                  {pos ? "▲" : delta < 0 ? "▼" : "·"} {Math.abs(delta).toFixed(1)}
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000"
                style={{ width: `${Math.min(100, live * 2.5)}%`, background: f.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PredictionGauge() {
  const value = driftedValue("pred-pass", 61, 2.5, 1);
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="my-3 mx-auto relative" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} stroke="var(--muted)" strokeWidth="6" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="var(--amber)"
          strokeWidth="6"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-serif text-2xl text-amber tabular-nums">{value.toFixed(1)}%</div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
            Likely Pass
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionLegend() {
  const pass = driftedValue("pred-pass", 61, 2.5, 1);
  const fail = driftedValue("pred-fail", 28, 1.6, 1);
  const tabled = Math.max(0, +(100 - pass - fail).toFixed(1));
  return (
    <div className="mt-auto grid grid-cols-3 gap-2 text-center font-mono text-[10px] text-muted-foreground">
      <div>
        <div className="text-amber text-[14px] font-serif tabular-nums">{pass.toFixed(0)}%</div>Pass
      </div>
      <div>
        <div className="text-crimson text-[14px] font-serif tabular-nums">{fail.toFixed(0)}%</div>
        Fail
      </div>
      <div>
        <div className="text-silver text-[14px] font-serif tabular-nums">{tabled.toFixed(0)}%</div>
        Tabled
      </div>
    </div>
  );
}

function SentimentChart() {
  const t = useTick();
  const base = [44, 46, 43, 48, 52, 49, 55, 58, 54, 60, 63, 61, 65, 68, 64, 70, 72, 69, 74];
  const baseOpp = [32, 31, 34, 33, 30, 31, 28, 27, 29, 26, 25, 27, 24, 23, 25, 22, 21, 23, 20];
  const data = base.map((v, i) => Math.max(0, Math.min(100, v + jitter(`sent-a-${i}`, t, 1.5))));
  const oppose = baseOpp.map((v, i) =>
    Math.max(0, Math.min(100, v + jitter(`sent-o-${i}`, t, 1.5))),
  );
  const w = 600,
    h = 160;
  const max = 100;
  const pl = (arr: number[]) =>
    arr.map((v, i) => `${(i / (arr.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const last = data[data.length - 1];
  const lastOpp = oppose[oppose.length - 1];
  return (
    <div className="mt-4 grid-bg rounded-sm border hairline p-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
        <defs>
          <linearGradient id="sa" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${h} ${pl(data)} ${w},${h}`} fill="url(#sa)" />
        <polyline points={pl(data)} fill="none" stroke="var(--amber)" strokeWidth="1.5" />
        <polyline
          points={pl(oppose)}
          fill="none"
          stroke="var(--crimson)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
      <div className="mt-2 flex gap-4 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-amber" /> Endorse{" "}
          <span className="text-amber tabular-nums">{last.toFixed(1)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-crimson" /> Oppose{" "}
          <span className="text-crimson tabular-nums">{lastOpp.toFixed(1)}</span>
        </span>
        <span className="ml-auto">Δ recalibrating · live feed</span>
      </div>
    </div>
  );
}

function StabilityScore() {
  const score = driftedValue("stability", 74, 1.6, 0);
  const status =
    score >= 78
      ? { label: "stable, cautiously optimistic", color: "text-amber" }
      : score >= 68
        ? { label: "elevated but cautious", color: "text-amber" }
        : score >= 58
          ? { label: "weakening · monitoring", color: "text-amber" }
          : { label: "destabilizing · review", color: "text-crimson" };
  return (
    <>
      <div className="mt-4 flex items-end gap-6">
        <div className="font-serif text-6xl tracking-tight text-amber tabular-nums">
          {score}
          <span className="text-[18px] text-muted-foreground">/100</span>
        </div>
        <div className="text-[12px] text-muted-foreground leading-relaxed">
          Chamber stability is <span className={status.color}>{status.label}</span>. Cross-faction
          cooperation is recalibrating against rising sovereign liquidity exposure. Civic Stability
          Index updated this tick.
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {stabilityIndices.map((s) => {
          const v = driftedValue(`stab-${s.id}`, s.base, s.volatility, 0);
          const colorBg =
            s.accent === "amber" ? "bg-amber" : s.accent === "crimson" ? "bg-crimson" : "bg-cyan";
          return (
            <div key={s.id} className="rounded-sm border hairline p-2.5">
              <div className="flex justify-between font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>{s.label}</span>
                <span className="tabular-nums">{v}</span>
              </div>
              <div className="mt-1.5 h-0.5 bg-foreground/5 rounded-full overflow-hidden">
                <div
                  className={`${colorBg} h-full transition-all duration-1000`}
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function FactionVolatility() {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
      {factionTrends.map((f) => {
        const live = driftedValue(`vol-${f.name}`, 0, f.volatility, 2);
        const mag = Math.abs(live);
        const dir = live > 0 ? "Surging" : live < 0 ? "Eroding" : "Steady";
        const color = live > 0 ? "text-amber" : live < 0 ? "text-crimson" : "text-muted-foreground";
        const barColor = live > 0 ? "bg-amber" : live < 0 ? "bg-crimson" : "bg-silver";
        return (
          <div key={f.name} className="rounded-sm border hairline p-3">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
              {f.name}
            </p>
            <p className={`font-serif text-[18px] mt-1 tabular-nums ${color}`}>
              {live > 0 ? "+" : ""}
              {live.toFixed(2)}
            </p>
            <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${color}`}>{dir}</p>
            <div className="mt-2 h-0.5 bg-foreground/5 rounded-full overflow-hidden">
              <div
                className={`${barColor} h-full transition-all duration-1000`}
                style={{ width: `${Math.min(100, mag * 30)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
