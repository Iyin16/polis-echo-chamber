import { Fragment, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { agents, memories } from "@/lib/polis-data";

type Token = { type: "text" | "agent" | "proposal" | "memory"; value: string; slug?: string };

const agentNames = agents.map((a) => a.name).sort((a, b) => b.length - a.length);
const memoryTitles = memories.map((m) => m.title).sort((a, b) => b.length - a.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pattern = new RegExp(
  [
    `(POL-\\d+)`,
    `(${memoryTitles.map(escapeRe).join("|")})`,
    `(${agentNames.map(escapeRe).join("|")})`,
  ].join("|"),
  "g",
);

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ type: "text", value: text.slice(last, idx) });
    const matched = m[0];
    if (/^POL-\d+$/.test(matched)) {
      out.push({ type: "proposal", value: matched, slug: matched.toLowerCase() });
    } else if (memoryTitles.includes(matched)) {
      const mem = memories.find((mm) => mm.title === matched)!;
      out.push({ type: "memory", value: matched, slug: mem.slug });
    } else {
      const ag = agents.find((aa) => aa.name === matched)!;
      out.push({ type: "agent", value: matched, slug: ag.slug });
    }
    last = idx + matched.length;
  }
  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

export function EntityText({ children, className }: { children: string; className?: string }) {
  const tokens = tokenize(children);
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.type === "text") return <Fragment key={i}>{t.value}</Fragment>;
        if (t.type === "proposal")
          return (
            <Link
              key={i}
              to="/proposals/$slug"
              params={{ slug: t.slug! }}
              className="font-mono text-amber underline-offset-2 decoration-amber/30 hover:underline hover:text-amber"
            >
              {t.value}
            </Link>
          );
        if (t.type === "memory")
          return (
            <Link
              key={i}
              to="/memory/$slug"
              params={{ slug: t.slug! }}
              className="text-cyan italic underline-offset-2 decoration-cyan/30 hover:underline"
            >
              {t.value}
            </Link>
          );
        return (
          <Link
            key={i}
            to="/agents/$slug"
            params={{ slug: t.slug! }}
            className="text-foreground underline-offset-2 decoration-foreground/20 hover:underline"
          >
            {t.value}
          </Link>
        );
      })}
    </span>
  );
}

export function ProposalLink({
  id,
  children,
  className,
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/proposals/$slug"
      params={{ slug: id.toLowerCase() }}
      className={className ?? "font-mono text-amber hover:underline"}
    >
      {children ?? id}
    </Link>
  );
}

export function AgentLink({
  slug,
  children,
  className,
}: {
  slug: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link to="/agents/$slug" params={{ slug }} className={className ?? "hover:underline"}>
      {children}
    </Link>
  );
}

export function MemoryLink({
  slug,
  children,
  className,
}: {
  slug: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/memory/$slug"
      params={{ slug }}
      className={className ?? "text-cyan italic hover:underline"}
    >
      {children}
    </Link>
  );
}
