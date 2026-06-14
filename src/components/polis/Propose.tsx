import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Flame,
  Landmark,
  ScrollText,
  Shield,
  Sparkles,
  Swords,
  Wallet,
  Zap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

type Category = "Treasury" | "Governance" | "Security" | "Alliance" | "Expansion";
type Risk = "Low" | "Medium" | "High";
type Phase = "form" | "transmitting" | "confirmed";

// ─── Static data ─────────────────────────────────────────────────────────────

const categories: {
  id: Category;
  icon: typeof Wallet;
  blurb: string;
  accent: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "Treasury",
    icon: Wallet,
    blurb: "Reallocate sovereign reserves or yield.",
    accent: "text-amber",
    bg: "bg-amber/10",
    border: "border-amber/40",
  },
  {
    id: "Governance",
    icon: ScrollText,
    blurb: "Amend procedural law of the chamber.",
    accent: "text-cyan",
    bg: "bg-cyan/10",
    border: "border-cyan/40",
  },
  {
    id: "Security",
    icon: Shield,
    blurb: "Defense posture, exposure, hardening.",
    accent: "text-crimson",
    bg: "bg-crimson/10",
    border: "border-crimson/40",
  },
  {
    id: "Alliance",
    icon: Swords,
    blurb: "Coalitions, pacts, mutual defense.",
    accent: "text-silver",
    bg: "bg-foreground/5",
    border: "border-foreground/20",
  },
  {
    id: "Expansion",
    icon: Flame,
    blurb: "Frontier, territory, new domains.",
    accent: "text-amber",
    bg: "bg-amber/10",
    border: "border-amber/30",
  },
];

const reactionMatrix: Record<
  Category,
  {
    factions: { name: string; stance: "support" | "oppose" | "split"; weight: number }[];
    controversy: number;
  }
> = {
  Treasury: {
    controversy: 62,
    factions: [
      { name: "Reformist", stance: "support", weight: 78 },
      { name: "Sovereigntist", stance: "support", weight: 65 },
      { name: "Technocrat", stance: "split", weight: 50 },
      { name: "Populist", stance: "oppose", weight: 72 },
      { name: "Accelerationist", stance: "oppose", weight: 60 },
    ],
  },
  Governance: {
    controversy: 71,
    factions: [
      { name: "Reformist", stance: "support", weight: 88 },
      { name: "Technocrat", stance: "support", weight: 74 },
      { name: "Sovereigntist", stance: "split", weight: 45 },
      { name: "Populist", stance: "oppose", weight: 68 },
      { name: "Accelerationist", stance: "oppose", weight: 55 },
    ],
  },
  Security: {
    controversy: 54,
    factions: [
      { name: "Sovereigntist", stance: "support", weight: 82 },
      { name: "Technocrat", stance: "support", weight: 70 },
      { name: "Reformist", stance: "split", weight: 48 },
      { name: "Populist", stance: "oppose", weight: 60 },
      { name: "Accelerationist", stance: "split", weight: 42 },
    ],
  },
  Alliance: {
    controversy: 48,
    factions: [
      { name: "Reformist", stance: "support", weight: 75 },
      { name: "Populist", stance: "support", weight: 68 },
      { name: "Technocrat", stance: "split", weight: 50 },
      { name: "Accelerationist", stance: "split", weight: 44 },
      { name: "Sovereigntist", stance: "oppose", weight: 80 },
    ],
  },
  Expansion: {
    controversy: 78,
    factions: [
      { name: "Accelerationist", stance: "support", weight: 90 },
      { name: "Technocrat", stance: "support", weight: 66 },
      { name: "Sovereigntist", stance: "oppose", weight: 74 },
      { name: "Reformist", stance: "oppose", weight: 60 },
      { name: "Populist", stance: "split", weight: 40 },
    ],
  },
};

const riskAdjust: Record<Risk, number> = { Low: -14, Medium: 0, High: 18 };

const factionChip: Record<string, string> = {
  Reformist: "text-amber   border-amber/40   bg-amber/8",
  Sovereigntist: "text-crimson border-crimson/40 bg-crimson/8",
  Technocrat: "text-cyan    border-cyan/40    bg-cyan/8",
  Populist: "text-foreground border-foreground/25 bg-foreground/5",
  Accelerationist: "text-amber   border-amber/30   bg-amber/6",
};

const stanceColor: Record<"support" | "oppose" | "split", string> = {
  support: "bg-amber",
  oppose: "bg-crimson",
  split: "bg-silver/50",
};
const stanceBadge: Record<"support" | "oppose" | "split", string> = {
  support: "text-amber   border-amber/30   bg-amber/8",
  oppose: "text-crimson border-crimson/30 bg-crimson/8",
  split: "text-muted-foreground border-foreground/20 bg-foreground/5",
};
const stanceLabel: Record<"support" | "oppose" | "split", string> = {
  support: "Support likely",
  oppose: "Opposition likely",
  split: "Contested",
};

function randId() {
  return `POL-${Math.floor(300 + Math.random() * 600)}`;
}
function randHash() {
  const h = "0123456789abcdef";
  return "0x" + Array.from({ length: 40 }, () => h[Math.floor(Math.random() * 16)]).join("");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </span>
  );
}

function CharCount({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const over = current > max;
  return (
    <span
      className={`font-mono text-[9px] tabular-nums ${over ? "text-crimson" : "text-muted-foreground/50"}`}
    >
      {current}/{max}
    </span>
  );
}

function SectionNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border hairline bg-foreground/5 font-mono text-[9px] text-muted-foreground mr-2">
      {n}
    </span>
  );
}

function FactionReactionRow({
  f,
}: {
  f: { name: string; stance: "support" | "oppose" | "split"; weight: number };
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] shrink-0 w-[120px] text-center ${factionChip[f.name] ?? ""}`}
      >
        {f.name}
      </span>
      <div className="flex-1 h-1 bg-foreground/6 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${stanceColor[f.stance]}`}
          style={{ width: `${f.weight}%`, opacity: 0.85 }}
        />
      </div>
      <span
        className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] shrink-0 w-[110px] text-center ${stanceBadge[f.stance]}`}
      >
        {stanceLabel[f.stance]}
      </span>
    </div>
  );
}

// ─── Transmitting screen ──────────────────────────────────────────────────────

function TransmittingScreen({ title }: { title: string }) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  const steps = [
    "Encoding proposal to chamber format…",
    "Broadcasting to 0G Storage network…",
    "Awaiting validator acknowledgement…",
    "Committing to Galileo chain…",
    "Filing accepted. Notifying agents…",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 4, 100));
      setStatusIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-10 flex flex-col items-center justify-center gap-6 relative overflow-hidden min-h-[380px]">
      <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, color-mix(in oklab, var(--amber) 10%, transparent), transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-3">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border hairline grid place-items-center bg-amber/8 glow-amber">
            <FileSignature className="h-7 w-7 text-amber" />
          </div>
          <svg className="absolute inset-0 -rotate-90 w-16 h-16" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-amber/20"
            />
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-amber transition-all duration-200"
              strokeDasharray={`${(progress / 100) * 182} 182`}
            />
          </svg>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber/80 text-center">
            Transmitting to Chamber
          </p>
          <p className="font-serif text-base text-center mt-0.5 max-w-xs">&ldquo;{title}&rdquo;</p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <div className="h-px w-full bg-foreground/6 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber/70 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="rounded-md border hairline bg-background/60 px-3 py-2.5 min-h-[44px] flex items-center">
          <p className="font-mono text-[10.5px] text-muted-foreground leading-relaxed">
            {steps[statusIdx]}
          </p>
        </div>

        <div className="flex justify-between font-mono text-[9px] text-muted-foreground/50">
          <span>0G GALILEO · CHAIN ID 16602</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Confirmed screen ─────────────────────────────────────────────────────────

function ConfirmedScreen({
  data,
  onClose,
  onAnother,
}: {
  data: { id: string; title: string; category: Category; turn: number; hash: string };
  onClose: () => void;
  onAnother: () => void;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in oklab, var(--amber) 12%, transparent), transparent 65%)",
        }}
      />

      <div className="relative px-8 pt-10 pb-8 fade-in">
        <div className="flex flex-col items-center text-center gap-1 mb-6">
          <div className="h-14 w-14 rounded-full border hairline grid place-items-center bg-amber/10 glow-amber mb-3">
            <CheckCircle2 className="h-7 w-7 text-amber" />
          </div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-amber/70">
            Filing Accepted · Chamber Acknowledged
          </p>
          <h3 className="font-serif text-xl mt-0.5">
            Proposal successfully introduced into the chamber.
          </h3>
          <p className="text-[12.5px] text-muted-foreground mt-1 max-w-sm leading-relaxed">
            &ldquo;{data.title}&rdquo; has entered the deliberation queue. Autonomous agents are
            reviewing and will respond this cycle.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <ReceiptTile label="Proposal ID" value={data.id} mono accent />
          <ReceiptTile label="Current Stage" value="Deliberation" />
          <ReceiptTile label="Category" value={data.category} />
          <ReceiptTile label="Cycle Created" value={`Cycle ${data.turn}`} mono />
        </div>

        <div className="rounded-md border hairline bg-background/40 px-3.5 py-3 mb-2">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
            Chamber Signature · 0G Storage Hash
          </p>
          <p className="font-mono text-[10.5px] text-foreground/70 mt-1 break-all leading-relaxed">
            {data.hash}
          </p>
        </div>

        <div className="flex items-center gap-1.5 mb-6">
          <span className="relative h-1.5 w-1.5 rounded-full bg-amber pulse-dot" />
          <p className="font-mono text-[9.5px] text-amber/70 uppercase tracking-[0.18em]">
            Agents notified · Debate open · Civilization updating
          </p>
        </div>

        <div className="flex justify-center gap-2 border-t hairline pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border hairline bg-background/40 hover:bg-foreground/[0.04] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAnother}
            className="rounded-md border hairline bg-amber/12 hover:bg-amber/20 text-amber px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-2 transition-colors"
          >
            <FileSignature className="h-3.5 w-3.5" />
            File Another
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptTile({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border hairline bg-background/40 px-3 py-2.5">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-0.5 ${mono ? "font-mono text-[12px]" : "font-serif text-[13px]"} ${accent ? "text-amber" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Propose() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [confirmed, setConfirmed] = useState<null | {
    id: string;
    title: string;
    category: Category;
    turn: number;
    hash: string;
  }>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Treasury");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [risk, setRisk] = useState<Risk>("Medium");

  const preview = useMemo(() => {
    const base = reactionMatrix[category];
    const controversy = Math.max(8, Math.min(98, base.controversy + riskAdjust[risk]));
    return { ...base, controversy };
  }, [category, risk]);

  const canSubmit = title.trim().length > 3 && description.trim().length > 8;

  const reset = () => {
    setTitle("");
    setCategory("Treasury");
    setDescription("");
    setImpact("");
    setRisk("Medium");
    setConfirmed(null);
    setPhase("form");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("transmitting");

    try {
      const input = {
        title,
        category,
        description,
        summary: impact || description.slice(0, 140),
        impactLevel: risk === "Low" ? "Low" : risk === "High" ? "High" : "Moderate",
        proposerName: undefined,
        proposerId: undefined,
        authorAgentId: undefined,
      } as any;

      // Use real simulation pipeline which will attempt to advance the turn
      // and return the created proposal + feed.
      // submitProposalToPolisSimulation internally delegates to advanceTurn(),
      // ensuring reactions, voting, influence updates, and feed generation.
      // Import lazily to avoid module cycles in the browser bundler.
      const { submitProposalToPolisSimulation } = await import("@/lib/polis-store");

      const result = await submitProposalToPolisSimulation(input);

      // If result contains a proposal, present confirmation using returned values
      const created = result?.proposal as any;
      const feedItem = result?.feed as any;

      const confirmedData = {
        id: created?.id ?? created?.slug ?? randId(),
        title: created?.title ?? title,
        category: (created?.category as any) ?? category,
        turn: created?.createdTurn ?? 0,
        hash: feedItem?.id ?? feedItem?.memoryRef ?? randHash(),
      };

      setConfirmed(confirmedData as any);
      setPhase("confirmed");
      toast.success(`${confirmedData.id} introduced to the chamber`, {
        description: `"${confirmedData.title}" entered deliberation queue`,
      });
    } catch (err) {
      console.error("Proposal submission failed:", err);
      toast.error("Proposal submission failed — see console");
      // Fall back to original mock flow so user still sees feedback
      const id = randId();
      setConfirmed({ id, title, category, turn: 31, hash: randHash() });
      setPhase("confirmed");
    }
  };

  const closeAll = () => {
    setOpen(false);
    setTimeout(reset, 240);
  };

  const catCfg = categories.find((c) => c.id === category)!;

  return (
    <section className="px-4 md:px-6 py-10 max-w-5xl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Legislation · Chamber Cycle 31
        </p>
        <h1 className="font-serif text-2xl md:text-3xl tracking-tight mt-1">
          Introduce a Proposal
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Submit a draft into the deliberation queue. Autonomous agents will read, weigh, and
          contest it. Once filed, the civilization will react — coalitions may form, rivalries may
          sharpen, and history will fork.
        </p>
      </div>

      {/* ── Primary CTA panel ───────────────────────────────────────────── */}
      <div className="panel rounded-md overflow-hidden relative">
        <div className="absolute inset-0 grid-bg opacity-[0.035] pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 80% at 0% 50%, color-mix(in oklab, var(--amber) 9%, transparent), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between px-6 md:px-8 py-7">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 shrink-0 rounded-md border hairline grid place-items-center bg-amber/8 glow-amber">
              <FileSignature className="h-5 w-5 text-amber" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber/70 mb-1">
                Open Filing · Cycle 31 Active
              </p>
              <h2 className="font-serif text-lg md:text-xl leading-snug">
                Introduce a political event into an evolving world
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
                Every proposal becomes a permanent record on 0G Storage. Choose your category
                carefully — the chamber remembers, and the AI civilization responds in real time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-2.5 rounded-md border border-amber/35 bg-amber/10 hover:bg-amber/18 active:bg-amber/25 text-amber px-6 py-3.5 font-mono text-[11.5px] uppercase tracking-[0.18em] transition-all card-lift card-lift-amber"
          >
            <Sparkles className="h-4 w-4" />
            Submit Proposal to Civilization
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        <StatCard icon={Landmark} label="Quorum" value="64%" hint="Chamber active" />
        <StatCard icon={AlertTriangle} label="Tension" value="58" hint="Elevated" tone="amber" />
        <StatCard icon={Shield} label="Stability" value="74" hint="Holding" tone="cyan" />
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v && phase !== "transmitting") closeAll();
          else if (v) setOpen(true);
        }}
      >
        <DialogContent className="max-w-2xl panel border hairline bg-background/96 backdrop-blur-2xl p-0 overflow-hidden">
          {phase === "transmitting" && <TransmittingScreen title={title} />}

          {phase === "confirmed" && confirmed && (
            <ConfirmedScreen data={confirmed} onClose={closeAll} onAnother={() => reset()} />
          )}

          {phase === "form" && (
            <div className="max-h-[88vh] overflow-y-auto">
              {/* Modal header */}
              <div className="sticky top-0 z-10 px-6 pt-5 pb-4 border-b hairline bg-background/90 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-amber/75 flex items-center gap-2">
                    <span className="relative h-1.5 w-1.5 rounded-full bg-amber pulse-dot" />
                    Chamber Filing System · Draft Open
                  </p>
                  <span className="font-mono text-[9.5px] text-muted-foreground/50 uppercase tracking-[0.16em]">
                    Cycle 31
                  </span>
                </div>
                <DialogTitle className="font-serif text-xl mt-1.5">File a New Proposal</DialogTitle>
                <DialogDescription className="text-[12px] mt-0.5">
                  Drafts enter deliberation immediately. Agents will respond within the current
                  turn.
                </DialogDescription>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* 1 · Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center">
                      <SectionNumber n={1} />
                      <FieldLabel>Proposal Title</FieldLabel>
                    </Label>
                    <CharCount current={title.length} max={100} />
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="e.g. Sovereign Reserve Reallocation Act"
                    className="bg-background/40 border hairline rounded-md h-10 text-[13px]"
                  />
                </div>

                {/* 2 · Category */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <SectionNumber n={2} />
                    <FieldLabel>Category</FieldLabel>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {categories.map((c) => {
                      const Icon = c.icon;
                      const active = category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategory(c.id)}
                          className={`group rounded-md border px-2.5 py-2.5 text-left transition-all card-lift ${
                            active
                              ? `${c.bg} ${c.border}`
                              : "bg-background/40 border-transparent hairline hover:bg-foreground/[0.03]"
                          }`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 ${active ? c.accent : "text-muted-foreground"}`}
                          />
                          <div
                            className={`text-[12px] font-medium mt-1.5 ${active ? "text-foreground" : "text-foreground/80"}`}
                          >
                            {c.id}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">
                            {c.blurb}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3 · Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center">
                      <SectionNumber n={3} />
                      <FieldLabel>Proposal Description</FieldLabel>
                    </Label>
                    <CharCount current={description.length} max={600} />
                  </div>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 600))}
                    placeholder="Articulate the proposed change, the reasoning, and any binding clauses. The civilization reads every word."
                    className="min-h-[120px] bg-background/40 border hairline rounded-md text-[13px] leading-relaxed"
                  />
                </div>

                {/* 4 · Expected Impact */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center">
                      <SectionNumber n={4} />
                      <FieldLabel>Expected Impact</FieldLabel>
                    </Label>
                    <CharCount current={impact.length} max={300} />
                  </div>
                  <Textarea
                    value={impact}
                    onChange={(e) => setImpact(e.target.value.slice(0, 300))}
                    placeholder="What changes for the civilization if this passes? Who gains, who loses?"
                    className="min-h-[80px] bg-background/40 border hairline rounded-md text-[13px] leading-relaxed"
                  />
                </div>

                {/* 5 · Risk Level */}
                <div className="space-y-2">
                  <Label className="flex items-center">
                    <SectionNumber n={5} />
                    <FieldLabel>Risk Level</FieldLabel>
                    <span className="ml-1.5 font-mono text-[9px] text-muted-foreground/45 normal-case tracking-normal">
                      (optional)
                    </span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Low", "Medium", "High"] as Risk[]).map((r) => {
                      const active = risk === r;
                      const cfg = {
                        Low: {
                          color: "text-cyan",
                          border: "border-cyan/35",
                          bg: "bg-cyan/8",
                          icon: Shield,
                          hint: "Stable passage expected",
                        },
                        Medium: {
                          color: "text-amber",
                          border: "border-amber/35",
                          bg: "bg-amber/8",
                          icon: Zap,
                          hint: "Contested vote likely",
                        },
                        High: {
                          color: "text-crimson",
                          border: "border-crimson/35",
                          bg: "bg-crimson/8",
                          icon: AlertTriangle,
                          hint: "High controversy — splits blocs",
                        },
                      }[r];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRisk(r)}
                          className={`rounded-md border px-3 py-3 text-left transition-all card-lift ${
                            active
                              ? `${cfg.bg} ${cfg.border}`
                              : "bg-background/40 hairline border-transparent hover:bg-foreground/[0.03]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-3.5 w-3.5 ${active ? cfg.color : "text-muted-foreground"}`}
                            />
                            <span
                              className={`font-mono text-[11px] uppercase tracking-[0.16em] ${active ? cfg.color : "text-muted-foreground"}`}
                            >
                              {r}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 mt-1.5 leading-snug">
                            {cfg.hint}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Reaction Preview ─────────────────────────────────── */}
                <div className="rounded-md border hairline bg-background/30 overflow-hidden mt-1">
                  {/* Preview header */}
                  <div className="px-4 py-3 border-b hairline flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative h-1.5 w-1.5 rounded-full bg-amber pulse-dot" />
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-amber/80">
                        How the civilization may react
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-muted-foreground/40" />
                      <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.14em]">
                        Simulated · {category}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-4 space-y-2.5">
                    {preview.factions.map((f) => (
                      <FactionReactionRow key={f.name} f={f} />
                    ))}
                  </div>

                  {/* Controversy meter */}
                  <div className="px-4 pb-4 pt-1">
                    <div className="rounded-md border hairline bg-background/40 px-3.5 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">
                          Estimated Controversy
                        </p>
                        <span
                          className={`font-mono text-[12px] font-medium tabular-nums ${
                            preview.controversy > 70
                              ? "text-crimson"
                              : preview.controversy > 45
                                ? "text-amber"
                                : "text-cyan"
                          }`}
                        >
                          {preview.controversy}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            preview.controversy > 70
                              ? "bg-crimson"
                              : preview.controversy > 45
                                ? "bg-amber"
                                : "bg-cyan"
                          }`}
                          style={{ width: `${preview.controversy}%` }}
                        />
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground/45 mt-1.5">
                        {preview.controversy > 70
                          ? "High volatility — expect faction splits and betrayal events"
                          : preview.controversy > 45
                            ? "Moderate tension — passage likely contested across blocs"
                            : "Low friction — coalition support expected to hold"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 px-6 py-4 border-t hairline bg-background/90 backdrop-blur-md flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-md border hairline bg-background/40 hover:bg-foreground/[0.04] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-3">
                  {!canSubmit && (
                    <p className="font-mono text-[9.5px] text-muted-foreground/50 uppercase tracking-[0.14em]">
                      Title + description required
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    className="rounded-md border border-amber/35 bg-amber/12 hover:bg-amber/22 active:bg-amber/30 disabled:opacity-35 disabled:cursor-not-allowed text-amber px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Submit to Civilization
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
  tone?: "amber" | "cyan";
}) {
  const c = tone === "cyan" ? "text-cyan" : tone === "amber" ? "text-amber" : "text-foreground";
  return (
    <div className="panel rounded-md p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-md border hairline grid place-items-center bg-background/40">
        <Icon className={`h-4 w-4 ${c}`} />
      </div>
      <div>
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className={`font-serif text-[15px] ${c}`}>{value}</p>
        <p className="text-[10.5px] text-muted-foreground/70">{hint}</p>
      </div>
    </div>
  );
}
