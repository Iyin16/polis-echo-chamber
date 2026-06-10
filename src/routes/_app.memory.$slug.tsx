import { createFileRoute } from "@tanstack/react-router";
import { MemoryDetail } from "@/components/polis/MemoryDetail";
import { memoryBySlug } from "@/lib/polis-data";

export const Route = createFileRoute("/_app/memory/$slug")({
  head: ({ params }) => {
    const m = memoryBySlug[params.slug];
    return {
      meta: [
        { title: m ? `Polis — ${m.title}` : "Polis — Memory" },
        {
          name: "description",
          content: m?.summary ?? "Persistent memory event in the Polis chamber.",
        },
      ],
    };
  },
  component: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { slug } = Route.useParams();
    return <MemoryDetail slug={slug} />;
  },
});
