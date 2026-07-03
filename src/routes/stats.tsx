import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Hash, Database, Trash2 } from "lucide-react";
import { EXERCISES } from "@/lib/exercises";
import { useAppState, weekCount, createSampleState, defaultState } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

const GOAL = 100;

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: `Statistik — ${APP_NAME}` }] }),
  component: StatsPage,
});

function challengePlan(baseReps: number): [number, number, number] {
  return [baseReps, Math.min(34, baseReps + 4), Math.max(4, baseReps - 2)];
}

function modeLabel(mode: string) {
  if (mode === "dagens3") return "Dagens 3";
  if (mode === "halvt") return "Litet blandpass";
  if (mode === "stort") return "Stort blandpass";
  if (mode === "hundred") return "100 challenge";
  return mode;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("sv-SE", { month: "short", day: "numeric" }).format(new Date(value));
}

function StatsPage() {
  const [state, setState] = useAppState();
  const week = weekCount(state.completedDates);
  const total = state.sessions.length;
  const latest = [...state.sessions]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 8);
  const hundred = EXERCISES.filter((e) => e.hundredEligible).map((exercise) => {
    const reps = state.hundred[exercise.id]?.reps ?? 8;
    const plan = challengePlan(reps);
    const totalReps = plan.reduce((sum, value) => sum + value, 0);
    const percent = Math.min(100, Math.round((totalReps / GOAL) * 100));
    return { exercise, plan, totalReps, percent };
  });

  function resetAll() {
    const ok = window.confirm("Vill du rensa all lokal data? Historik, favoriter och 100 challenge-progression tas bort.");
    if (!ok) return;
    setState(() => defaultState());
  }

  function addSampleData() {
    const ok = total > 0 ? window.confirm("Vill du ersätta nuvarande lokala data med testdata?") : true;
    if (!ok) return;
    setState(() => createSampleState());
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Statistik</p>
          <div className="w-9" />
        </header>

        <h1 className="text-3xl font-semibold tracking-tight">Din historik</h1>
        <p className="mt-2 text-sm text-muted-foreground">En enkel översikt över passen du har sparat.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Denna vecka</p>
            <p className="mt-2 text-3xl font-semibold">{week}</p>
            <p className="text-xs text-muted-foreground">pass</p>
          </div>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Totalt</p>
            <p className="mt-2 text-3xl font-semibold">{total}</p>
            <p className="text-xs text-muted-foreground">sparade pass</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Senaste pass</p>
          {latest.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              Inga sparade pass ännu. Starta Dagens 3 för att bygga första raden i historiken.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {latest.map((session) => {
                const done = session.exercises.filter((e) => e.status === "done").length;
                return (
                  <li key={session.id} className="rounded-2xl bg-secondary/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{modeLabel(session.mode)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(session.completedAt)}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {done} av {session.exercises.length} övningar klara
                      {session.totalReps ? ` · ${session.totalReps} reps` : ""}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {session.exercises.map((e) => e.name).join(", ")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">100 challenge</p>
          </div>
          <ul className="mt-4 space-y-3">
            {hundred.map(({ exercise, plan, totalReps, percent }) => (
              <li key={exercise.id}>
                <div className="flex items-center justify-between text-sm">
                  <span>{exercise.name}</span>
                  <span className="text-muted-foreground">{totalReps} / {GOAL}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.join(" + ")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Test och felsökning</p>
          <p className="mt-1 text-xs text-muted-foreground">
            För utveckling. Använd testdata för att se historik och 100 challenge utan att träna först.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={addSampleData} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]">
              <Database className="h-4 w-4" /> Testdata
            </button>
            <button onClick={resetAll} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]">
              <Trash2 className="h-4 w-4" /> Rensa
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
