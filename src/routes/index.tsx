import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/HomePage";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME} — Små steg. Starkare varje dag.` },
      { name: "description", content: "Enkel svensk hemmaträning. Dagens 3 övningar och vägen till 100 reps." },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: "Dagens 3 övningar. Bygg en lugn vana. Nå 100 reps." },
    ],
  }),
  component: HomePage,
});
