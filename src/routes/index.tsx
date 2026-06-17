import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Flame, Target, Hash, ChevronRight } from "lucide-react";
import { useAppState, computeStreak, weekCount, todayISO } from "@/lib/storage";
import { pickDailyThree } from "@/lib/exercises";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trean — Hemmaträning på 10 minuter" },
      { name: "description", content: "Enkel svensk hemmaträning. Dagens 3 övningar, streak och vägen till 100 reps." },
      { property: "og:title", content: "Trean — Hemmaträning" },
      { property: "og:description", content: "Dagens 3 övningar. Bygg streak. Nå 100 reps." },
    ],
  }),
  component: Index,
});

function Index() {
  const [state] = useAppState();
  const today = todayISO();
  const daily = pickDailyThree(today);
  const streak = computeStreak(state.completedDates);
  const week = weekCount(state.completedDates);
  const goal = 3;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Trean</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hej, redo?</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-medium">{streak}</span>
            <span className="text-muted-foreground">dagar</span>
          </div>
        </header>

        <section className="mb-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Idag</p>
            <p className="text-xs text-muted-foreground">~10 min</p>
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Dagens 3</h2>
          <ul className="mt-4 space-y-2">
            {daily.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 text-[15px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-foreground/80">
                  {i + 1}
                </span>
                <span className="truncate">{e.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {e.kind === "time" ? `${e.sets}×${e.seconds}s` : `${e.sets}×${e.reps}`}
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/workout"
            search={{ mode: "dagens3" }}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground shadow-sm transition active:scale-[0.99]"
          >
            Starta dagens 3
          </Link>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/workout"
            search={{ mode: "halvt" }}
            className="group rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]"
          >
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Halvt pass</p>
            <p className="text-xs text-muted-foreground">5 övningar · 2 set</p>
          </Link>
          <Link
            to="/hundred"
            className="group rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]"
          >
            <Hash className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">100 reps</p>
            <p className="text-xs text-muted-foreground">Vägen till 102</p>
          </Link>
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Veckans mål</p>
              <p className="mt-1 text-lg font-medium">
                {week} / {goal} pass
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Mån–sön</p>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: goal }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < week ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          En lugn vana. Ett pass i taget.
        </p>
      </div>
    </div>
  );
}
