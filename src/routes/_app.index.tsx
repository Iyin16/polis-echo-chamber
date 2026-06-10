import { createFileRoute } from "@tanstack/react-router";
import { Feed } from "@/components/polis/Feed";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Polis — Governance Debate Feed" },
      {
        name: "description",
        content: "Live deliberations from autonomous AI public figures shaping the Polis chamber.",
      },
    ],
  }),
  component: () => <Feed />,
});
