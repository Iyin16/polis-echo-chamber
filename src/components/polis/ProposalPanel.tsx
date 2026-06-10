import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { usePolisStore, submitProposalToPolisSimulation } from "@/lib/polis-store";
import type { Proposal, ProposalCategory } from "@/lib/polis-data";
import { ArrowUpRight, ShieldAlert, TrendingUp } from "lucide-react";

const tagColor: Record<string, string> = {
  Active: "text-amber border-amber/40 bg-amber/5",
  Passed: "text-cyan border-cyan/40 bg-cyan/5",
  Rejected: "text-crimson border-crimson/40 bg-crimson/5",
  Tabled: "text-silver border-silver/30 bg-silver/5",
};

const riskColor: Record<string, string> = {
  Low: "text-cyan",
  Moderate: "text-amber",
  Elevated: "text-amber",
  Critical: "text-crimson",
};

const categories: ProposalCategory[] = [
  "Treasury",
  "Governance Reform",
  "Security",
  "Alliance",
  "Expansion",
];
const impactLevels: Proposal["impactLevel"][] = ["Low", "Moderate", "High", "Critical"];

export function ProposalPanel() {
  const { proposals } = usePolisStore();
  const activeProposals = proposals.filter((proposal) => proposal.statusTag === "Active");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ProposalCategory>("Treasury");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [impactLevel, setImpactLevel] = useState<"Low" | "Moderate" | "High" | "Critical">(
    "Moderate",
  );
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = activeProposals.length < 2;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !title.trim() || !description.trim()) return;
    setSubmitting(true);

    await submitProposalToPolisSimulation({
      title: title.trim(),
      category,
      description: description.trim(),
      summary: summary.trim() || description.trim().slice(0, 110),
      impactLevel,
      proposerName: "Human Delegate",
    });

    setTitle("");
    setSummary("");
    setDescription("");
    setImpactLevel("Moderate");
    setShowForm(false);
    setSubmitting(false);
  }

  return (
    <section className="px-4 md:px-6 py-8 max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Governance
          </p>
          <h1 className="font-serif text-xl md:text-2xl tracking-tight mt-1">
            Active DAO Proposals
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-xl">
            Live deliberations, voting distribution, sentiment trends, and treasury impact across
            the chamber floor.
          </p>
        </div>
        <div className="space-y-2 text-right">
          <div className="font-mono text-[10px] text-muted-foreground">
            {activeProposals.length} active · {proposals.length} total
          </div>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            disabled={!canSubmit}
            className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
              canSubmit
                ? "border-amber text-amber hover:bg-amber/10"
                : "border-silver text-muted-foreground cursor-not-allowed"
            }`}
          >
            {canSubmit
              ? showForm
                ? "Hide proposal form"
                : "Submit proposal to civilization"
              : "Max active proposals reached"}
          </button>
        </div>
      </div>

      {showForm ? (
        <form
          className="mb-6 rounded-md border border-foreground/10 bg-background/80 p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-amber/70 focus:ring-2 focus:ring-amber/10"
                placeholder="Sovereign Treasury Adjustment Act"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Category
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as ProposalCategory)}
                className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-amber/70 focus:ring-2 focus:ring-amber/10"
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="space-y-2 text-sm lg:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Description
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-[140px] w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-amber/70 focus:ring-2 focus:ring-amber/10"
                placeholder="Explain the issue, the proposed action, and the expected civic outcome."
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Expected Impact
              </span>
              <select
                value={impactLevel}
                onChange={(event) =>
                  setImpactLevel(event.target.value as "Low" | "Moderate" | "High" | "Critical")
                }
                className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-amber/70 focus:ring-2 focus:ring-amber/10"
              >
                {impactLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Summary
              </span>
              <textarea
                rows={3}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                className="w-full rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-amber/70 focus:ring-2 focus:ring-amber/10"
                placeholder="Write a short summary for the feed entry."
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="rounded-full bg-amber px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-background transition hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Proposal"}
            </button>
            <p className="text-[12px] text-muted-foreground">
              Human-origin proposals immediately enter the creation phase and begin debate next
              turn.
            </p>
          </div>
        </form>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeProposals.length === 0 ? (
          <div className="panel rounded-md p-5 text-sm text-muted-foreground">
            No active proposals are currently on the chamber floor.
          </div>
        ) : (
          activeProposals.map((p) => (
            <Link
              key={p.id}
              to="/proposals/$slug"
              params={{ slug: p.slug }}
              className="panel card-lift card-lift-amber rounded-md p-5 group block cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.22em] text-amber/70">
                  {p.id}
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${tagColor[p.statusTag]}`}
                >
                  {p.statusTag}
                </span>
              </div>
              <h2 className="font-serif text-[18px] font-semibold leading-snug mt-2 text-foreground">
                {p.title}
              </h2>
              <p className="font-mono text-[10px] text-muted-foreground/60 mt-1">{p.status}</p>
              <p className="mt-3 text-[13px] text-foreground/70 leading-relaxed line-clamp-3">
                {p.summary}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[10.5px]">
                <Stat label="Endorse" value={`${p.votes.for}%`} accent="amber" />
                <Stat label="Oppose" value={`${p.votes.against}%`} accent="crimson" />
                <Stat label="Abstain" value={`${p.votes.abstain}%`} accent="silver" />
              </div>

              <div className="mt-3 flex items-center justify-between font-mono text-[10px]">
                <span className="flex items-center gap-1.5 text-muted-foreground/70">
                  <ShieldAlert className={`h-3 w-3 ${riskColor[p.riskLevel]}`} />
                  Risk · <span className={riskColor[p.riskLevel]}>{p.riskLevel}</span>
                </span>
                <span className="flex items-center gap-1 text-amber">
                  <TrendingUp className="h-3 w-3" /> {p.sentimentDelta}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground/60 group-hover:text-foreground transition-colors">
                  Open <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "amber" | "crimson" | "silver";
}) {
  const c =
    accent === "amber" ? "text-amber" : accent === "crimson" ? "text-crimson" : "text-silver";
  return (
    <div className="rounded-sm border hairline bg-background/40 px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`font-serif text-[13px] mt-0.5 ${c}`}>{value}</div>
    </div>
  );
}
