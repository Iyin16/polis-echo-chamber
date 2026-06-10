export type PortraitResult = {
  uri: string;
  seed: string;
  style: string;
};

function factionStyle(faction: string) {
  const f = faction.toLowerCase();
  if (f.includes("reform")) return { color: "#0ea5e9", pattern: "stripes", style: "Reformist" };
  if (f.includes("sovereig")) return { color: "#dc2626", pattern: "fracture", style: "Sovereign" };
  if (f.includes("technocrat")) return { color: "#16a34a", pattern: "grid", style: "Technocrat" };
  if (f.includes("populist")) return { color: "#9ca3af", pattern: "waves", style: "Populist" };
  if (f.includes("accel") || f.includes("acceleration"))
    return { color: "#a78bfa", pattern: "burst", style: "Accelerationist" };
  return { color: "#94a3b8", pattern: "muted", style: "Neutral" };
}

export function generateAgentPortrait(agent: {
  id: string;
  slug?: string;
  name?: string;
  faction?: string;
  influence?: number;
  emotion?: string;
  portraitSeed?: string;
}): PortraitResult {
  const seed = agent.portraitSeed ?? `${agent.id}-${agent.slug ?? "agent"}`;
  const info = factionStyle(agent.faction ?? "Neutral");
  const influence = Math.max(10, Math.min(100, Math.round(agent.influence ?? 40))); // uses current influence to subtly alter visuals

  const bg = info.color;
  const opacity = 0.3 + influence / 200;
  const size = 256;

  // Simple SVG portrait: circular face + faction pattern overlay + initials
  const initials = (agent.name || agent.slug || "A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='#0f172a' />
    <g opacity='${opacity}'>
      <rect width='100%' height='100%' fill='${bg}' />
    </g>
    <g fill='white' font-family='serif' font-weight='700' text-anchor='middle'>
      <circle cx='128' cy='96' r='56' fill='rgba(255,255,255,0.06)' stroke='rgba(255,255,255,0.06)' />
      <text x='128' y='116' font-size='48' fill='white'>${initials}</text>
    </g>
    <g opacity='0.18' fill='white'>
      ${info.pattern === "grid" ? `<pattern id='g' width='8' height='8' patternUnits='userSpaceOnUse'><rect width='8' height='8' fill='${bg}'/></pattern><rect width='100%' height='100%' fill='url(#g)'/>` : ""}
      ${info.pattern === "stripes" ? `<rect x='0' y='0' width='100%' height='100%' fill='url(#s)'/>` : ""}
    </g>
    <text x='10' y='250' font-size='10' fill='#ffffff88'>${info.style} · Influence:${influence}</text>
  </svg>`;

  let b64: string;
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    b64 = window.btoa(unescape(encodeURIComponent(svg)));
  } else {
    // Node fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const buf = Buffer.from(svg);
    b64 = buf.toString("base64");
  }
  const uri = `data:image/svg+xml;base64,${b64}`;
  return { uri, seed, style: info.style };
}

export default generateAgentPortrait;
