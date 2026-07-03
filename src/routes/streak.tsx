import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Flame, Hand, Users } from "lucide-react";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/streak")({
  head: () => ({ meta: [{ title: `Streak tillsammans — ${APP_NAME}` }] }),
  component: StreakPage,
});

function StreakPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Streak tillsammans</p>
          <div className="w-9" />
        </header>

        <section className="rounded-3xl bg-card p-6 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Gemensam streak</p>
              <h1 className="mt-1 text-6xl font-semibold tracking-tight">0</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Gör Dagens 3 varannan gång och håll streaken vid liv tillsammans.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Hand className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Bollen</p>
              <p className="mt-1 text-sm text-muted-foreground">
                När funktionen kopplas till Supabase visas här vem som har bollen: du eller din träningskompis.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Nästa steg</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Skapa streak, bjuda in med kod och flytta bollen automatiskt när Dagens 3 sparas.
              </p>
            </div>
          </div>
        </section>

        <Link to="/workout" search={{ mode: "dagens3" }} className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
          Gör Dagens 3
        </Link>
      </div>
    </div>
  );
}
