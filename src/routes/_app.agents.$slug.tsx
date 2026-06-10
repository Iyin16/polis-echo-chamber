import { createFileRoute } from "@tanstack/react-router";
import { AgentDetail } from "@/components/polis/AgentDetail";
import { getPolisAgentBySlug } from "@/lib/polis-store";

export const Route = createFileRoute("/_app/agents/$slug")({
  head: ({ params }) => {
    const a = getPolisAgentBySlug(params.slug);
    return {
      meta: [
        { title: a ? `Polis — ${a.name}` : "Polis — Agent" },
        {
          name: "description",
          content: a ? `${a.name} · ${a.ideology} · ${a.faction}` : "AI public figure profile.",
        },
      ],
    };
  },
  component: () => {
    const { slug } = Route.useParams();
    return <AgentDetail slug={slug} />;
  },
});
