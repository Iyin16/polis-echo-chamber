import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopNav } from "@/components/polis/TopNav";
import { Sidebar } from "@/components/polis/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { chamberSignals } from "@/lib/polis-data";
import { driftedValue, rotatingIndex } from "@/lib/use-live-pulse";

export const Route = createFileRoute("/_app")({
  head: () => ({
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen text-foreground">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-right" />
      <AtmosphereBar />
      <footer className="border-t hairline px-4 md:px-6 py-5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-serif italic">Polis</span>
        <span>·</span>
        <span className="font-mono uppercase tracking-[0.18em]">Chamber Cycle 31 · Quorum 64%</span>
        <span className="ml-auto font-mono">
          A digital civilization, deliberating in real time.
        </span>
      </footer>
    </div>
  );
}

function AtmosphereBar() {
  const idx = rotatingIndex(chamberSignals.length, 1);
  const stab = driftedValue("atm-stability", 74, 1.6, 0);
  const exposure = driftedValue("atm-exposure", 18, 0.8, 1);
  return (
    <div className="border-t hairline bg-background/40">
      <div className="px-4 md:px-6 py-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="flex items-center gap-1.5 text-amber">
          <span className="h-1.5 w-1.5 rounded-full bg-amber pulse-dot" />
          Chamber live
        </span>
        <span className="text-foreground/70 normal-case tracking-normal font-sans text-[12px] truncate flex-1 min-w-0">
          {chamberSignals[idx]}
        </span>
        <span>
          Stability <span className="text-amber tabular-nums">{stab}</span>
        </span>
        <span>
          Exposure <span className="text-crimson tabular-nums">{exposure.toFixed(1)}%</span>
        </span>
        <span>Cycle 31</span>
      </div>
    </div>
  );
}
