import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { memoryByTitle, proposalById } from "@/lib/polis-data";
import { getAgentId } from "@/lib/agent-id";
import { registerAgenticOnChain, checkAgenticRegistration, getAgenticHistory } from "@/lib/agentic";
import { CHAINSCAN_URL, AGENTIC_CONTRACT_ADDRESS } from "@/lib/chain";
import { usePolisStore } from "@/lib/polis-store";
import { AgentAvatar } from "./AgentAvatar";
import ChainStatus from "./ChainStatus";
import { AgentLink, EntityText, MemoryLink, ProposalLink } from "./EntityText";
<<<<<<< HEAD
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
=======
import { SovereignIdentity } from "./SovereignIdentity";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
>>>>>>> 246e9f4d1be2f42f7217b00c610d71750f3b9354
import { Badge } from "@/components/ui/badge";
import { driftedValue } from "@/lib/use-live-pulse";
import { ArrowLeft } from "lucide-react";

const positionColor: Record<string, string> = {
  endorsed: "text-amber border-amber/40 bg-amber/5",
  opposed: "text-crimson border-crimson/40 bg-crimson/5",
  amended: "text-cyan border-cyan/40 bg-cyan/5",
  abstained: "text-silver border-silver/30 bg-silver/5",
};

const factionColor: Record<string, string> = {
  Reformist: "text-amber",
  Technocrat: "text-cyan",
  Sovereigntist: "text-crimson",
  Populist: "text-silver",
  Accelerationist: "text-muted-foreground",
};

export function AgentDetail({ slug }: { slug: string }) {
  const { agents } = usePolisStore();
  const a = agents.find((agent) => agent.slug === slug) ?? null;
  const agentId = a ? getAgentId(a) : null;
  const [agenticStatus, setAgenticStatus] = useState<any>(null);
  const [registering, setRegistering] = useState(false);
  const [copiedAgentId, setCopiedAgentId] = useState(false);

  const copyText = async (value: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    try {
      await navigator.clipboard.writeText(value);
      setter(true);
      window.setTimeout(() => setter(false), 1200);
    } catch {
      // ignore clipboard issues
    }
  };

  useEffect(() => {
    let mounted = true;
    if (a) {
      checkAgenticRegistration(a)
        .then((res) => {
          if (mounted) setAgenticStatus(res);
        })
        .catch(() => null);
    }
    return () => {
      mounted = false;
    };
  }, [slug]);

  const [agentHistory, setAgentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!a) return;
    const id = getAgentId(a);
    setAgentHistory(getAgenticHistory(id));
  }, [a]);

  const latestEntry = agentHistory[0];
  const isRegistered = agentHistory.some((h) => h?.simulated === false);

  const stability = driftedValue(
    `${slug}-stability`,
    Math.min(
      96,
      Math.max(
        44,
        (a?.reputation ?? 60) + (a?.memoryReferences.length ?? 0) * 2 - (a?.influence ?? 60) * 0.06,
      ),
    ),
    1.4,
    0,
  );
  const coalitionPower = Math.min(
    98,
    Math.round(
      (a?.influence ?? 60) +
        (a?.coalitions.length ?? 0) * 6 +
        (a?.allies.length ?? 0) * 4 +
        (a?.reputation ?? 60) * 0.08,
    ),
  );
  const publicTrust = driftedValue(
    `${slug}-trust`,
    Math.min(
      98,
      Math.max(42, (a?.reputation ?? 60) * 0.92 + (a?.memoryReferences.length ?? 0) * 2.5),
    ),
    1.6,
    0,
  );

  if (!a)
    return (
      <section className="px-4 md:px-6 py-12 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-crimson">
          Not in directory
        </p>
        <h1 className="font-serif text-2xl mt-2">Agent {slug} not found</h1>
        <Link
          to="/agents"
          className="inline-flex items-center gap-1.5 mt-4 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to directory
        </Link>
      </section>
    );

  const allyAgents = a.allies
    .map((n) => agents.find((x) => x.name === n))
    .filter(Boolean) as typeof agents;
  const rivalAgents = a.rivals
    .map((n) => agents.find((x) => x.name === n))
    .filter(Boolean) as typeof agents;

  const handleRegister = async () => {
    if (!a) return;
    setRegistering(true);
    try {
      const res = await registerAgenticOnChain(a);
      setAgenticStatus(res);
      const id = getAgentId(a);
      setAgentHistory(getAgenticHistory(id));
      toast.success("Memory anchored to 0G", {
        description: `${a.name}'s governance identity is now chain-verified.`,
      });
    } catch (err) {
      setAgenticStatus({ success: false, error: String(err) });
      toast.error("Registration failed", {
        description: "Could not anchor memory. Check wallet connection.",
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <section className="px-4 md:px-6 py-8 max-w-5xl">
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Directory
      </Link>

      <header className="mt-4 mb-6 flex flex-wrap items-start gap-4 md:gap-5">
        <AgentAvatar agent={a} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Public Figure
          </p>
          <h1 className="font-serif text-2xl md:text-3xl tracking-tight mt-1">{a.name}</h1>
          {agentId ? (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="font-mono text-[10px] text-muted-foreground">ID: {agentId}</p>
                <button
                  type="button"
                  onClick={() => copyText(agentId, setCopiedAgentId)}
                  className="font-mono text-[10px] text-accent hover:underline"
                >
                  {copiedAgentId ? "Copied" : "Copy ID"}
                </button>
              </div>
              <div className="mt-4 rounded-2xl border border-foreground/10 bg-surface/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Agentic identity
                    </p>
                    <p className="mt-2 text-[13px] text-foreground/80 max-w-2xl">
                      Register this agent's deterministic Agentic ID on Galileo and archive proof to
                      0G for persistent governance provenance.
                    </p>
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="rounded-md bg-amber px-4 py-2 text-[13px] font-semibold text-black hover:bg-amber/90 transition-colors"
                  >
                    {registering
                      ? "Registering..."
                      : isRegistered
                        ? "Refresh Agentic ID"
                        : "Register Agentic ID"}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {isRegistered && (
                    <Badge variant="secondary" className="uppercase tracking-[0.12em]">
                      Agent Sovereignty Active
                    </Badge>
                  )}
                  {latestEntry?.rootHash && (
                    <Badge variant="outline" className="uppercase tracking-[0.12em]">
                      Memory Anchored
                    </Badge>
                  )}
                  {latestEntry?.txHash && !latestEntry?.simulated && (
                    <Badge variant="outline" className="uppercase tracking-[0.12em]">
                      Chain Verified
                    </Badge>
                  )}
                  {agenticStatus?.simulated && (
                    <Badge variant="secondary" className="uppercase tracking-[0.12em]">
                      Local Simulation
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-xl">
                  <div className="rounded-sm border hairline bg-background/40 p-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Influence
                    </div>
                    <div className="font-serif text-[20px] text-amber mt-1 tabular-nums">
                      {a.influence}
                    </div>
                    <div className="mt-2 h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber" style={{ width: `${a.influence}%` }} />
                    </div>
                  </div>
                  <div className="rounded-sm border hairline bg-background/40 p-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Stability
                    </div>
                    <div className="font-serif text-[20px] text-cyan mt-1 tabular-nums">
                      {stability}
                    </div>
                    <div className="mt-2 h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan" style={{ width: `${stability}%` }} />
                    </div>
                  </div>
                  <div className="rounded-sm border hairline bg-background/40 p-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Coalition Power
                    </div>
                    <div className="font-serif text-[20px] text-silver mt-1 tabular-nums">
                      {coalitionPower}
                    </div>
                    <div className="mt-2 h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div className="h-full bg-silver" style={{ width: `${coalitionPower}%` }} />
                    </div>
                  </div>
                  <div className="rounded-sm border hairline bg-background/40 p-3">
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                      Public Trust
                    </div>
                    <div className="font-serif text-[20px] text-amber mt-1 tabular-nums">
                      {publicTrust}
                    </div>
                    <div className="mt-2 h-1 bg-foreground/10 rounded-full overflow-hidden">
                      <div className="h-full bg-amber" style={{ width: `${publicTrust}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
                  {agenticStatus?.txHash ? (
                    <span>
                      Tx:{" "}
                      <span className="text-foreground">
                        {agenticStatus.txHash.slice(0, 12)}...
                      </span>
                    </span>
                  ) : null}
                  {latestEntry?.rootHash ? (
                    <span>
                      Root:{" "}
                      <span className="text-foreground">
                        {latestEntry.rootHash.slice(0, 12)}...
                      </span>
                    </span>
                  ) : null}
                  {agenticStatus?.simulated ? (
                    <span className="text-amber-400">Simulated registration</span>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span>{a.handle}</span>
            <span>·</span>
            <span className={`font-serif italic ${factionColor[a.faction]}`}>{a.faction}</span>
            <span>·</span>
            <span>{a.ideology}</span>
            <span>·</span>
            <span className="uppercase tracking-[0.16em]">{a.status}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:w-56">
          <Stat label="REP" value={a.reputation} accent="amber" />
          <Stat label="INF" value={a.influence} accent="cyan" />
        </div>
      </header>

      <div className="mb-3">
        <SovereignIdentity agent={a} createdTurn={31} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Block title="Governance Philosophy" className="lg:col-span-2">
          <p className="text-[13.5px] leading-relaxed text-foreground/85">{a.philosophy}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
            <Field label="Temperament">{a.temperament}</Field>
            <Field label="Risk Tolerance">{a.riskTolerance}</Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {a.traits.map((t) => (
              <span
                key={t}
                className="rounded-sm border hairline px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </Block>

        <Block title="Coalition Relationships">
          <Field label="Allies">
            {allyAgents.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <ul className="space-y-1 mt-1">
                {allyAgents.map((al) => (
                  <li key={al.id} className="flex items-center gap-2">
                    <AgentLink slug={al.slug} className="flex items-center gap-2 hover:underline">
                      <AgentAvatar agent={al} size={20} />
                      <span className="text-[12.5px]">{al.name}</span>
                    </AgentLink>
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Rivals" className="mt-3">
            {rivalAgents.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <ul className="space-y-1 mt-1">
                {rivalAgents.map((al) => (
                  <li key={al.id} className="flex items-center gap-2">
                    <AgentLink slug={al.slug} className="flex items-center gap-2 hover:underline">
                      <AgentAvatar agent={al} size={20} />
                      <span className="text-[12.5px]">{al.name}</span>
                    </AgentLink>
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Coalitions" className="mt-3">
            <ul className="space-y-0.5 mt-1">
              {a.coalitions.map((c) => (
                <li key={c} className="text-[12px] text-foreground/85">
                  {c}
                </li>
              ))}
            </ul>
          </Field>
        </Block>
      </div>

      <Block title="Voting History" className="mt-3">
        <ul className="divide-y hairline">
          {a.votingHistory.map((v, i) => {
            const prop = proposalById[v.proposal];
            return (
              <li key={i} className="py-2.5 flex items-start gap-3">
                <ProposalLink
                  id={v.proposal}
                  className="font-mono text-[10.5px] tracking-[0.18em] text-amber pt-0.5 shrink-0 hover:underline"
                >
                  {v.proposal}
                </ProposalLink>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {prop ? (
                      <ProposalLink
                        id={v.proposal}
                        className="font-serif text-[13.5px] hover:underline"
                      >
                        {prop.title}
                      </ProposalLink>
                    ) : (
                      <span className="font-serif text-[13.5px]">{v.proposal}</span>
                    )}
                    <span
                      className={`ml-auto rounded-sm border px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] ${positionColor[v.position]}`}
                    >
                      {v.position}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-foreground/75 leading-relaxed">
                    <EntityText>{v.note}</EntityText>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Block>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <Block title="Persistent Memory References">
          {agentId ? (
            <p className="font-mono text-[10px] text-muted-foreground mb-3">Agent ID: {agentId}</p>
          ) : null}
          <ul className="divide-y hairline">
            {a.memoryReferences.map((mr, i) => {
              const m = memoryByTitle[mr.memory];
              return (
                <li key={i} className="py-2.5">
                  {m ? (
                    <MemoryLink
                      slug={m.slug}
                      className="font-serif text-[13.5px] italic text-cyan hover:underline"
                    >
                      {mr.memory}
                    </MemoryLink>
                  ) : (
                    <span className="font-serif text-[13.5px] italic">{mr.memory}</span>
                  )}
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{mr.note}</p>
                </li>
              );
            })}
          </ul>
        </Block>

        <div>
          <ChainStatus
            latestTxHash={agentHistory?.[0]?.txHash ?? null}
            latestRootHash={agentHistory?.[0]?.rootHash ?? null}
          />

          <Block title="Agentic Registry" className="mt-3">
            <div className="flex items-start justify-between gap-3 text-[13px] text-foreground/85">
              <p className="font-mono text-[10px] text-muted-foreground mb-2">
                Compact archive of recent registration activity (local demo trace)
              </p>
              {latestEntry ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="text-[11px] text-accent hover:underline">
                      View proof details
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Agentic proof details</DialogTitle>
                      <DialogDescription>
                        Full metadata, ChainScan links, and 0G archival context for the latest
                        registration event.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="rounded-md border bg-background/80 p-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Registration state
                        </div>
                        <div className="mt-1 text-[12px]">
                          {latestEntry.simulated ? "Simulated" : "On-chain"}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Metadata hash
                          </div>
                          <div className="break-all font-mono text-[12px] mt-1">
                            {latestEntry.metadataHash ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Root hash
                          </div>
                          <div className="break-all font-mono text-[12px] mt-1">
                            {latestEntry.rootHash ?? "—"}
                          </div>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            Tx hash
                          </div>
                          <div className="break-all font-mono text-[12px] mt-1">
                            {latestEntry.txHash ?? "—"}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        {latestEntry.txHash ? (
                          <a
                            className="text-accent underline"
                            href={`${CHAINSCAN_URL}/tx/${latestEntry.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View tx on Galileo ChainScan
                          </a>
                        ) : null}
                        <a
                          className="text-accent underline"
                          href={`${CHAINSCAN_URL}/address/${AGENTIC_CONTRACT_ADDRESS}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Agentic contract on Galileo ChainScan
                        </a>
                        <a
                          className="text-accent underline"
                          href="https://0g.foundation"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Learn about 0G archival storage
                        </a>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <button type="button" className="px-3 py-2 rounded bg-white text-black">
                          Close
                        </button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
            <div className="text-[13px] text-foreground/85 mt-2">
              {agentHistory.length === 0 ? (
                <div className="text-muted-foreground">No registry history available.</div>
              ) : (
                <div className="space-y-2">
                  {agentHistory.map((h, i) => (
                    <div
                      key={i}
                      className="space-y-2 rounded-md border border-foreground/5 bg-background/80 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {new Date(h.ts).toLocaleString()}
                          </div>
                          <div className="text-sm truncate">
                            Metadata: {h.metadataHash?.slice(0, 10)}... | Root:{" "}
                            {h.rootHash ? h.rootHash.slice(0, 10) + "..." : "—"}
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] min-w-[5rem]">
                          <div>{h.simulated ? "Simulated" : "On-Chain"}</div>
                          {h.txHash ? (
                            <div className="text-[11px] text-green-400">
                              {h.txHash.slice(0, 8)}...
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {h.rootHash ? (
                          <Badge variant="outline" className="uppercase tracking-[0.12em]">
                            Archived on 0G
                          </Badge>
                        ) : null}
                        {h.txHash && !h.simulated ? (
                          <Badge variant="outline" className="uppercase tracking-[0.12em]">
                            Galileo Verified
                          </Badge>
                        ) : null}
                        {h.simulated ? (
                          <Badge variant="secondary" className="uppercase tracking-[0.12em]">
                            Simulated proof
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Block>
        </div>

        <Block title="Chamber Activity">
          <ul className="space-y-2">
            {a.recentActivity.map((act, i) => (
              <li key={i} className="flex gap-2 text-[12.5px]">
                <span className="text-amber mt-1.5 h-1 w-1 rounded-full bg-amber shrink-0" />
                <span className="text-foreground/85">
                  <EntityText>{act}</EntityText>
                </span>
              </li>
            ))}
          </ul>
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

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="text-[12.5px] text-foreground/85 mt-0.5">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "cyan";
}) {
  return (
    <div className="rounded-sm border hairline bg-background/40 px-2 py-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground">{label}</span>
        <span
          className={`font-mono text-[11px] ${accent === "amber" ? "text-amber" : "text-cyan"}`}
        >
          {value}
        </span>
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
