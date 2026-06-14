import { generateAgentPortrait } from "../src/lib/portrait";
import * as fs from "fs";

async function main() {
  const result = generateAgentPortrait({
    id: "a-test",
    slug: "test-agent",
    name: "Test Agent",
    faction: "Technocrat",
    influence: 72,
  });

  console.log("Generated portrait seed:", result.seed);
  console.log("Style:", result.style);
  console.log("Data URI length:", result.uri.length);

  const b64 = result.uri.replace(/^data:image\/svg\+xml;base64,/, "");
  const svg = Buffer.from(b64, "base64").toString("utf8");
  const out = "portrait-test.svg";
  fs.writeFileSync(out, svg);
  console.log(`Wrote ${out}`);
}

main().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
