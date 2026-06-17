import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { EXERCISES, getExercise } from "@/lib/exercises";
import { useAppState, markCompleted } from "@/lib/storage";

const GOAL = 102;
const SETS = 3;
const START_REPS = 8;

export const Route = createFileRoute("/hundred")({
  head: () => ({ meta: [{ title: "100 reps — Trean" }] }),
  component: HundredPage,
});

type Phase = "pick" | "do" | "rate";

function HundredPage() {
  const [state, setState] = useAppState();
  const [phase, setPhase] = useState<Phase>("pick");
  const [activeId, setActiveId] = useState<string | null>(null);

  const eligible = EXERCISES.filter((e) => e.hundredEligible);
  const active = activeId ? getExercise(activeId) : null;
  const reps = active ? state.hundred[active.id]?.reps ?? START_REPS : START_REPS;
  const total = reps * SETS;

  function start(id: string) {
    setActiveId(id);
    setPhase("do");
  }

  function rate(level: "latt" | "medel" | "svart") {
    if (!active) return;
    const delta = level === "latt" ? 2 : level === "medel" ? 1 : 0;
    setState((s) => {
      const cur = s.hundred[active.id]?.reps ?? START_REPS;
      const next = Math.min(34, cur + delta);
      return markCompleted({
        ...s,
        hundred: { ...s.hundred, [active.id]: { reps: next } },
      });
    });
    setPhase("pick");
    setActiveId(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">100 reps</p>
          <div className="w-9" />
        </header>

        {phase === "pick" && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Vägen till 100</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Välj en övning. Du tränar 3 set och målet är 3 × 34 = 102 reps.
            </p>
            <ul className="mt-6 space-y-2">
              {eligible.map((e) => {
                const r = state.hundred[e.id]?.reps ?? START_REPS;
                const pct = Math.min(100, Math.round(((r * SETS) / GOAL) * 100));
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => start(e.id)}
                      className="w-full rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{e.name}</span>
                        <span className="text-sm text-muted-foreground">
                          3 × {r}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{pct}% till 102</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {phase === "do" && active && (
          <>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pågående</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{active.name}</h1>
            <div className="mt-6 rounded-3xl bg-card p-6 ring-1 ring-border/60">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">3</span>
                <span className="text-muted-foreground">set ×</span>
                <span className="text-5xl font-semibold tracking-tight">{reps}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Totalt {total} reps</p>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                {active.instruction}
              </p>
              <button
                onClick={() => setPhase("rate")}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground"
              >
                <Check className="h-4 w-4" /> Klar
              </button>
            </div>
          </>
        )}

        {phase === "rate" && active && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Hur kändes det?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nästa gång justeras antalet reps per set.
            </p>
            <div className="mt-6 space-y-3">
              {(
                [
                  { id: "latt", label: "Lätt", hint: "+2 reps per set" },
                  { id: "medel", label: "Medel", hint: "+1 rep per set" },
                  { id: "svart", label: "Svårt", hint: "Samma reps nästa gång" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => rate(opt.id)}
                  className="w-full rounded-2xl bg-card p-5 text-left ring-1 ring-border/60 active:scale-[0.99]"
                >
                  <p className="text-lg font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}