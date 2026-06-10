import { usePolisStore } from "@/lib/polis-store";
import { determineEra, ERA_DESCRIPTIONS } from "@/lib/era-system";
import type { CivilizationEra } from "@/lib/world-state";
import { useTick } from "@/lib/use-live-pulse";
import { Layers, TrendingUp, Zap, AlertTriangle, Crown } from "lucide-react";

const ERA_ICON: Record<CivilizationEra, React.ComponentType<{ className?: string }>> = {
  Formation: Layers,
  Expansion: TrendingUp,
  Reform: Zap,
  Crisis: AlertTriangle,
  Consolidation: Crown,
};

const ERA_COLOR: Record<CivilizationEra, string> = {
  Formation: "amber",
  Expansion: "cyan",
  Reform: "cyan",
  Crisis: "crimson",
  Consolidation: "amber",
};

const ERA_BAR: Record<CivilizationEra, string> = {
  Formation: "bg-amber",
  Expansion: "bg-cyan",
  Reform: "bg-cyan",
  Crisis: "bg-crimson",
  Consolidation: "bg-amber",
};

export function EraPanel() {
  const { worldState, agents } = usePolisStore();
  const t = useTick();
  const ws = worldState as any;

  const era: CivilizationEra = ws.civilizationEra ?? determineEra(ws);
  const eraLabel: string = ws.currentEra ?? `${era} Era`;
  const eraHistory: any[] = ws.eraHistory ?? [];
  const tension: number = ws.politicalTension ?? 20;
  const factionMorale: Record<string, number> = ws.factionMorale ?? {};
  const factionGrievances: Record<string, string[]> = ws.factionGrievances ?? {};
  const factionStreaks: Record<string, { losses: number; wins: number }> = ws.factionStreaks ?? {};
  const betrayalCounts: Record<string, number> = ws.betrayalCounts ?? {};
  const allianceTrust: Record<string, number> = ws.allianceTrust ?? {};

  const factions = [...new Set(agents.map((a) => a.faction))];

  const EraIcon = ERA_ICON[era] ?? Layers;
  const color = ERA_COLOR[era] ?? "amber";
  const barColor = ERA_BAR[era] ?? "bg-amber";

  const tensionLevel =
    tension > 65 ? "Critical" : tension > 40 ? "Elevated" : tension > 20 ? "Moderate" : "Low";
  const tensionTextColor =
    tension > 65 ? "text-crimson" : tension > 40 ? "text-amber" : "text-cyan";
  const tensionBarColor = tension > 65 ? "bg-crimson" : tension > 40 ? "bg-amber" : "bg-cyan";

  const activeTrustBonuses = Object.values(allianceTrust).filter((v) => v >= 3).length;

  return (
    <div className="panel rounded-md p-5 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
      <div className="relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <EraIcon className={`h-3 w-3 text-${color}`} />
            Civilization Era
          </div>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.18em] text-${color} flex items-center gap-1.5`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${barColor} animate-pulse`} />
            TICK {String(t).padStart(4, "0")}
          </span>
        </div>

        {/* Current Era */}
        <div>
          <h2 className={`font-serif text-2xl md:text-3xl tracking-tight text-${color}`}>{era}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
            {eraLabel}
          </p>
          <p className="text-[12.5px] text-muted-foreground mt-2.5 leading-relaxed max-w-prose">
            {ERA_DESCRIPTIONS[era]}
          </p>
        </div>

        {/* Political Tension */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Political Tension
            </span>
            <span className={`font-mono text-[11px] tabular-nums ${tensionTextColor}`}>
              {tension.toFixed(0)}% · {tensionLevel}
            </span>
          </div>
          <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
            <div
              className={`h-full ${tensionBarColor} rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(100, tension)}%` }}
            />
          </div>
          {activeTrustBonuses > 0 && (
            <p className="font-mono text-[10px] text-cyan mt-1">
              {activeTrustBonuses} active alliance trust bonus{activeTrustBonuses !== 1 ? "es" : ""}{" "}
              reducing tension
            </p>
          )}
        </div>

        {/* Faction Morale */}
        {factions.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2.5">
              Faction Morale
            </p>
            <div className="space-y-2.5">
              {factions.map((faction) => {
                const morale = factionMorale[faction] ?? 75;
                const streak = factionStreaks[faction];
                const losses = streak?.losses ?? 0;
                const wins = streak?.wins ?? 0;
                const grievances = factionGrievances[faction] ?? [];
                const betrayals = betrayalCounts[faction] ?? 0;
                const moraleBarColor =
                  morale < 35 ? "bg-crimson" : morale < 60 ? "bg-amber" : "bg-cyan";
                return (
                  <div key={faction}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-foreground/80">{faction}</span>
                      <div className="flex items-center gap-2.5">
                        {losses >= 3 && (
                          <span className="font-mono text-[9px] text-crimson bg-crimson/10 px-1.5 py-0.5 rounded">
                            {losses}× LOSS STREAK
                          </span>
                        )}
                        {wins >= 3 && (
                          <span className="font-mono text-[9px] text-cyan bg-cyan/10 px-1.5 py-0.5 rounded">
                            {wins}× WIN STREAK
                          </span>
                        )}
                        {betrayals >= 2 && (
                          <span className="font-mono text-[9px] text-amber bg-amber/10 px-1.5 py-0.5 rounded">
                            {betrayals} BETRAYAL{betrayals !== 1 ? "S" : ""}
                          </span>
                        )}
                        {grievances.length > 0 && (
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {grievances.length}g
                          </span>
                        )}
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {morale}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-border/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${moraleBarColor} rounded-full transition-all duration-700`}
                        style={{ width: `${morale}%` }}
                      />
                    </div>
                    {grievances.length > 0 && (
                      <p className="font-mono text-[9.5px] text-muted-foreground mt-0.5 truncate opacity-70">
                        ↳ {grievances[grievances.length - 1]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Era History */}
        {eraHistory.length > 0 && (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2.5">
              Era History
            </p>
            <div className="space-y-1.5">
              {[...eraHistory]
                .reverse()
                .slice(0, 6)
                .map((entry: any, i: number) => {
                  const entryColor = ERA_COLOR[entry.era as CivilizationEra] ?? "amber";
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <span
                        className={`font-mono text-[10px] text-${entryColor} mt-0.5 w-14 shrink-0 tabular-nums`}
                      >
                        CYC {String(entry.turn).padStart(3, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] text-foreground/80">{entry.era} Era</p>
                        <p className="font-mono text-[9.5px] text-muted-foreground truncate">
                          {entry.trigger}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
