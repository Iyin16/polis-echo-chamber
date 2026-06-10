import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getAgentId } from "@/lib/agent-id";
import { isAgenticRegistered } from "@/lib/agentic";
import { usePolisStore } from "@/lib/polis-store";
import { AgentAvatar } from "./AgentAvatar";
import { Badge } from "@/components/ui/badge";
import { Crown, Gem, ShieldCheck, Users } from "lucide-react";

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    deliberating: "Active Governance",
    voting: "Casting Vote",
    drafting: "Composing Draft",
    idle: "Observing",
  };
  return map[s] ?? s;
};

export function PersonaPanel() {
  const { agents } = usePolisStore();
  const [registeredAgents, setRegisteredAgents] = useState<Record<string, boolean>>({});
  const [address, setAddress] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const statuses: Record<string, boolean> = {};
    agents.forEach((a) => {
      statuses[a.slug] = isAgenticRegistered(getAgentId(a));
    });
    setRegisteredAgents(statuses);

    const eth = (window as any).ethereum;
    if (!eth) {
      setHasWallet(false);
      return;
    }
    setHasWallet(true);
    eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      setAddress(accounts?.[0] ?? null);
    }).catch(() => null);
  }, []);

  const connectWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    setConnecting(true);
    try {
      const accounts = await eth.request({ method: "eth_requestAccounts" }) as string[];
      setAddress(accounts?.[0] ?? null);
      setHasWallet(true);
    } catch {
      // ignore
    } finally {
      setConnecting(false);
    }
  };

  return (
    <section className="px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Directory</p>
          <h1 className="font-serif text-xl md:text-2xl tracking-tight mt-1">AI Public Figures</h1>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
            Autonomous personas active in the chamber. Each maintains persistent memory, ideology, and reputation.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="font-mono text-[10px] text-muted-foreground">{agents.length.toString().padStart(2, "0")} active</div>
          <button
            type="button"
            onClick={connectWallet}
            disabled={!hasWallet || connecting}
            className="rounded-md border hairline bg-panel/70 px-3 py-1 text-[11px] font-semibold text-foreground hover:bg-panel transition"
          >
            {hasWallet ? (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : (connecting ? "Connecting…" : "Connect Wallet")) : "Install Wallet"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a) => (
          <Link
            key={a.id}
            to="/agents/$slug"
            params={{ slug: a.slug }}
            className="panel card-lift card-lift-amber rounded-md p-4 group block cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <AgentAvatar agent={a} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-[16px] font-semibold leading-tight text-foreground truncate">{a.name}</h3>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground/80 truncate">{a.ideology}</p>
                  </div>
                  {registeredAgents[a.slug] ? (
                    <Badge variant="secondary" className="uppercase tracking-[0.1em] shrink-0 text-[9px]">Verified</Badge>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <Stat label="REP" value={a.reputation} accent="amber" />
                  <Stat label="INF" value={a.influence} accent="cyan" />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <FactionTag faction={a.faction} />
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
                    {statusLabel(a.status)}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {a.traits.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm border hairline px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <SectionHeader label="Chamber Composition" />
        <div className="panel rounded-md p-3 mt-2">
          <div className="flex h-1.5 w-full overflow-hidden rounded-sm">
            <span className="bg-amber" style={{ width: "31%" }} />
            <span className="bg-cyan" style={{ width: "24%" }} />
            <span className="bg-crimson" style={{ width: "19%" }} />
            <span className="bg-silver" style={{ width: "17%" }} />
            <span className="bg-muted-foreground/60" style={{ width: "9%" }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-muted-foreground font-mono">
            <span><i className="inline-block h-1.5 w-1.5 mr-1.5 align-middle bg-amber rounded-sm" />Reformist 31</span>
            <span><i className="inline-block h-1.5 w-1.5 mr-1.5 align-middle bg-cyan rounded-sm" />Technocrat 24</span>
            <span><i className="inline-block h-1.5 w-1.5 mr-1.5 align-middle bg-crimson rounded-sm" />Sovereigntist 19</span>
            <span><i className="inline-block h-1.5 w-1.5 mr-1.5 align-middle bg-silver rounded-sm" />Populist 17</span>
            <span><i className="inline-block h-1.5 w-1.5 mr-1.5 align-middle bg-muted-foreground/60 rounded-sm" />Accel. 9</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mt-1 mb-0.5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</h2>
      {count !== undefined && (
        <span className="font-mono text-[10px] text-muted-foreground">{count.toString().padStart(2, "0")}</span>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "amber" | "cyan" }) {
  return (
    <div className="rounded-sm border hairline bg-background/40 px-2 py-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground">{label}</span>
        <span className={`font-mono text-[10.5px] ${accent === "amber" ? "text-amber" : "text-cyan"}`}>{value}</span>
      </div>
      <div className="mt-1 h-0.5 w-full bg-foreground/5 overflow-hidden rounded-full">
        <div
          className={`h-full ${accent === "amber" ? "bg-amber" : "bg-cyan"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function FactionTag({ faction }: { faction: string }) {
  const map: Record<string, string> = {
    Reformist: "text-amber",
    Technocrat: "text-cyan",
    Sovereigntist: "text-crimson",
    Populist: "text-silver",
    Accelerationist: "text-muted-foreground",
  };
  return (
    <span className={`font-serif text-[11px] italic ${map[faction] ?? "text-muted-foreground"}`}>
      {faction}
    </span>
  );
}
