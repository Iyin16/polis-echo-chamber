import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Bell, Search, Siren, Wallet } from "lucide-react";
import { chamberAlerts, chamberSignals } from "@/lib/polis-data";
import { rotatingIndex } from "@/lib/use-live-pulse";
import { advanceTurn } from "@/lib/polis-store";
import { toast } from "sonner";

const tabs = [
  { label: "Feed", to: "/" as const, exact: true },
  { label: "Proposals", to: "/proposals" as const, exact: false },
  { label: "Propose", to: "/propose" as const, exact: false },
  { label: "Agents", to: "/agents" as const, exact: false },
  { label: "Memory", to: "/memory" as const, exact: false },
  { label: "Analytics", to: "/analytics" as const, exact: false },
  { label: "Forge", to: "/forge" as const, exact: false },
  { label: "Dominance", to: "/dominance" as const, exact: false },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b hairline backdrop-blur-xl bg-[color-mix(in_oklab,var(--background)_75%,transparent)]">
      <div className="flex h-14 items-center gap-3 md:gap-6 px-4 md:px-6">
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <div className="relative h-7 w-7 shrink-0 rounded-sm bg-foreground text-background grid place-items-center font-serif text-sm font-semibold">
            Π
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber glow-amber" />
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-serif text-lg tracking-tight">Polis</span>
            <span className="hidden xl:inline text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
              Chamber · Cycle 31
            </span>
          </div>
        </div>

        <nav className="ml-2 hidden md:flex items-center gap-1 min-w-0">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="relative px-3 py-1.5 text-[13px] tracking-wide transition-colors text-muted-foreground hover:text-foreground/80 data-[status=active]:text-foreground group"
            >
              {t.label}
              <span className="absolute -bottom-[15px] left-2 right-2 h-px bg-amber opacity-0 group-data-[status=active]:opacity-100" />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-md border hairline bg-panel/60 px-2.5 py-1.5 text-xs text-muted-foreground w-72">
            <Search className="h-3.5 w-3.5" />
            <span>Search agents, proposals, memories…</span>
            <kbd className="ml-auto font-mono text-[10px] text-muted-foreground/70">⌘K</kbd>
          </div>
          <button className="md:hidden grid place-items-center h-8 w-8 rounded-md border hairline bg-panel/60 text-muted-foreground">
            <Search className="h-4 w-4" />
          </button>
          <button className="relative grid place-items-center h-8 w-8 rounded-md border hairline bg-panel/60 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-crimson" />
          </button>
          <div className="hidden sm:flex items-center gap-2 rounded-md border hairline bg-panel/60 px-2.5 py-1.5">
            <Activity className="h-3.5 w-3.5 text-amber" />
            <span className="font-mono text-[11px] text-muted-foreground">SYS · NOMINAL</span>
          </div>
          <AdvanceTurnButton />
          <WalletConnectButton />
        </div>
      </div>
      <MobileTabs />
      <Ticker />
      <ChamberAlertBar />
    </header>
  );
}

function MobileTabs() {
  return (
    <nav className="md:hidden border-t hairline overflow-x-auto">
      <div className="flex items-center gap-1 px-3 py-1.5 min-w-max">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: t.exact }}
            className="relative px-2.5 py-1 text-[12px] tracking-wide rounded-sm text-muted-foreground data-[status=active]:text-foreground data-[status=active]:bg-foreground/5 group"
          >
            {t.label}
            <span className="absolute left-2 right-2 -bottom-[5px] h-px bg-amber opacity-0 group-data-[status=active]:opacity-100" />
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Ticker() {
  const line = chamberSignals.join("   ·   ");
  return (
    <div className="border-t hairline overflow-hidden">
      <div className="flex whitespace-nowrap py-1.5 ticker font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="px-4 md:px-6">
          {line} · {line}
        </span>
      </div>
    </div>
  );
}

function WalletConnectButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const eth = (window as any).ethereum;
      if (!eth) {
        if (mounted) setHasWallet(false);
        return;
      }
      if (mounted) setHasWallet(true);
      try {
        const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
        if (mounted) setAddress(accounts?.[0] ?? null);
      } catch {
        // ignore
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const connectWallet = async () => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    setConnecting(true);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAddress(accounts?.[0] ?? null);
      setHasWallet(true);
    } catch {
      // ignore
    } finally {
      setConnecting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={connectWallet}
      className="inline-flex items-center gap-2 rounded-md border hairline bg-panel/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
    >
      <Wallet className="h-3.5 w-3.5" />
      {hasWallet
        ? address
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : connecting
            ? "Connecting…"
            : "Connect Wallet"
        : "Install Wallet"}
    </button>
  );
}

function AdvanceTurnButton() {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await advanceTurn();
      toast.success("Advanced simulation by one turn");
    } catch (e) {
      toast.error("Advance turn failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="hidden md:inline-flex items-center gap-2 rounded-md border hairline bg-panel/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
    >
      {busy ? "Advancing…" : "Advance Turn"}
    </button>
  );
}

function ChamberAlertBar() {
  const idx = rotatingIndex(chamberAlerts.length, 2);
  const a = chamberAlerts[idx];
  const tone =
    a.level === "emergency"
      ? {
          icon: Siren,
          color: "text-crimson",
          border: "border-crimson/40",
          bg: "bg-crimson/[0.05]",
          tag: "Emergency",
        }
      : a.level === "warning"
        ? {
            icon: AlertTriangle,
            color: "text-amber",
            border: "border-amber/40",
            bg: "bg-amber/[0.04]",
            tag: "Warning",
          }
        : {
            icon: Activity,
            color: "text-cyan",
            border: "border-cyan/40",
            bg: "bg-cyan/[0.04]",
            tag: "Notice",
          };
  const Icon = tone.icon;
  return (
    <div className={`border-t hairline ${tone.bg}`}>
      <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-1.5 fade-in">
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.2em] rounded-sm border ${tone.border} ${tone.color} px-1.5 py-0.5`}
        >
          <Icon className="h-3 w-3" /> {tone.tag}
        </span>
        <span className={`font-serif text-[12.5px] ${tone.color} truncate`}>{a.label}</span>
        <span className="text-muted-foreground/40 hidden md:inline">·</span>
        <span className="hidden md:inline text-[12px] text-foreground/75 truncate">{a.body}</span>
        <span className="ml-auto hidden sm:inline font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground shrink-0">
          Cycle 31 · live
        </span>
      </div>
    </div>
  );
}
