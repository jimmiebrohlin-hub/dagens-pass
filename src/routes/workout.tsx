import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, SkipForward } from "lucide-react";
import { exerciseDose, pickDailyThree, pickHalf, type Exercise } from "@/lib/exercises";
import { todayISO, useAppState, markCompleted } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

type Mode = "dagens3" | "halvt";

export const Route = createFileRoute("/workout")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode } => ({
    mode: s.mode === "halvt" ? "halvt" : "dagens3",
  }),
  head: () => ({ meta: [{ title: `Pass — ${APP_NAME}` }] }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [, setState] = useAppState();
  const today = todayISO();

  const exercises = useMemo<Exercise[]>(
    () => (mode === "halvt" ? pickHalf(today + "h") : pickDailyThree(today)),
    [mode, today],
  );

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => exercises.map(() => false));
  const current = exercises[idx];
  const finished = idx >= exercises.length;

  function next(completed: boolean) {
    setDone((d) => {
      const nd = [...d];
      nd[idx] = completed;
      return nd;
    });
    setIdx((i) => i + 1);
  }

  function finish() {
    setState((s) => markCompleted(s));
    navigate({ to: "/" });
  }

  const title = mode === "halvt" ? "Halvt pass" : "Dagens 3";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm text-muted-foreground">
            {finished ? "Klart" : `${idx + 1} / ${exercises.length}`}
          </p>
          <div className="w-9" />
        </header>

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</p>

        {!finished && current ? (
          <>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{current.name}</h1>
            <div className="mt-6 rounded-3xl bg-card p-6 ring-1 ring-border/60">
              <p className="text-sm text-muted-foreground">Gör</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight">{exerciseDose(current)}</p>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                {current.instruction}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
              <button
                onClick={() => next(true)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground shadow-sm active:scale-[0.99]"
              >
                <Check className="h-4 w-4" /> Klar
              </button>
              <button
                onClick={() => next(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 text-sm font-medium text-secondary-foreground active:scale-[0.99]"
              >
                <SkipForward className="h-4 w-4" /> Hoppa
              </button>
            </div>

            <ul className="mt-8 space-y-2">
              {exercises.map((e, i) => (
                <li
                  key={e.id}
                  className={`flex items-center gap-3 text-sm ${
                    i === idx ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                      done[i]
                        ? "bg-primary text-primary-foreground"
                        : i === idx
                          ? "bg-primary/20"
                          : "bg-muted"
                    }`}
                  >
                    {done[i] ? "✓" : i + 1}
                  </span>
                  {e.name}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-10 rounded-3xl bg-card p-8 text-center ring-1 ring-border/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-6 w-6 text-primary-foreground/80" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Bra jobbat</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Passet är klart. Streak och veckans mål uppdateras.
            </p>
            <button
              onClick={finish}
              className="mt-6 h-12 w-full rounded-2xl bg-primary text-base font-medium text-primary-foreground"
            >
              Spara & avsluta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
