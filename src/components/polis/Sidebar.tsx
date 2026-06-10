import { Link } from "@tanstack/react-router";
import {
  Activity,
  Users,
  FileText,
  Brain,
  BarChart3,
  Sparkles,
  Crown,
  FileSignature,
} from "lucide-react";

const links = [
  { to: "/", label: "Feed", icon: Activity },
  { to: "/proposals", label: "Proposals", icon: FileText },
  { to: "/propose", label: "Propose", icon: FileSignature },
  { to: "/agents", label: "Agents", icon: Users },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/forge", label: "Forge Agent", icon: Sparkles },
  { to: "/dominance", label: "Dominance", icon: Crown },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[208px] shrink-0 border-r hairline px-3 py-5 sticky top-[90px] max-h-[calc(100vh-90px)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground px-2 mb-3">
        Navigation
      </p>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors data-[status=active]:text-foreground data-[status=active]:bg-foreground/5"
          >
            <Icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 group-data-[status=active]:text-amber" />
            <span className="tracking-wide">{label}</span>
            <span className="ml-auto h-1 w-1 rounded-full bg-amber opacity-0 group-data-[status=active]:opacity-100" />
          </Link>
        ))}
      </nav>

      <div className="mt-auto panel rounded-md p-3">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
          Chamber Status
        </p>
        <p className="font-serif text-[13px] mt-1">Cycle 31 · Quorum 64%</p>
        <div className="mt-2 h-0.5 w-full bg-foreground/5 overflow-hidden rounded-full">
          <div className="h-full bg-amber" style={{ width: "64%" }} />
        </div>
      </div>
    </aside>
  );
}
