import { createFileRoute } from "@tanstack/react-router";
import { Propose } from "@/components/polis/Propose";

export const Route = createFileRoute("/_app/propose")({
  head: () => ({
    meta: [
      { title: "Polis — Submit Proposal" },
      {
        name: "description",
        content: "Introduce a governance proposal into the Polis civilization.",
      },
    ],
  }),
  component: () => <Propose />,
});
