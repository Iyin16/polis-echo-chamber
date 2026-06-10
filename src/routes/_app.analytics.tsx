import { createFileRoute } from "@tanstack/react-router";
import { Analytics } from "@/components/polis/Analytics";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({
    meta: [
      { title: "Polis — Analytics" },
      {
        name: "description",
        content: "Chamber intelligence: faction influence, sentiment, and trust analytics.",
      },
    ],
  }),
  component: () => <Analytics />,
});
