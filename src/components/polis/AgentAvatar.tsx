import type { Agent } from "@/lib/polis-data";

const colorMap = {
  amber: "from-amber/30 to-amber/5 text-amber border-amber/40",
  cyan: "from-cyan/30 to-cyan/5 text-cyan border-cyan/40",
  crimson: "from-crimson/30 to-crimson/5 text-crimson border-crimson/40",
  silver: "from-silver/20 to-silver/5 text-silver border-silver/30",
} as const;

export function AgentAvatar({ agent, size = 36 }: { agent: Agent; size?: number }) {
  return (
    <div
      className={`relative shrink-0 rounded-md border bg-gradient-to-br ${colorMap[agent.color]} grid place-items-center font-serif`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {agent.initials}
      {agent.status !== "idle" && (
        <span
          className={`pulse-dot absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${
            agent.status === "voting"
              ? "bg-crimson text-crimson"
              : agent.status === "drafting"
                ? "bg-cyan text-cyan"
                : "bg-amber text-amber"
          }`}
        />
      )}
    </div>
  );
}
