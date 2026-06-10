import { createFileRoute } from "@tanstack/react-router";
import { Dominance } from "@/components/polis/Dominance";

export const Route = createFileRoute("/_app/dominance")({
  head: () => ({
    meta: [
      { title: "Polis — Faction Dominance" },
      {
        name: "description",
        content: "Real-time faction dominance, tension, stability and political event feed.",
      },
    ],
  }),
  component: () => <Dominance />,
});
