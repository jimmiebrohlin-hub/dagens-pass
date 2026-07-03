import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { EXERCISES, getExercise } from "@/lib/exercises";
import { useAppState, addSession, type HundredFeedback } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

const GOAL = 100;
const START_REPS = 8;

export const Route = createFileRoute("/hundred")({
  head: () => ({ meta: [{ title: `100 challenge — ${APP_NAME}` }] }),
  component: HundredPage,
});

type Phase = "pick" | "do" | "rate";

function challengePlan(baseReps: number): [number, number, number] {
  return [baseReps, Math.min(34, baseReps + 4), Math.max(4, baseReps - 2)];
}

function planTotal(plan: number[]) {
  return plan.reduce((sum, reps) => sum + reps, 0);
}

function feedbackHint(level: HundredFeedback) {
  if (level === "latt") return "Nästa gång ökar appen med 2 reps i basnivå.";
  if (level === "medel") return "Nästa gång ökar appen med 1 rep i basnivå.";
  if (level === "svart") return "Nästa gång behåller appen samma nivå.";
  return "Nästa gång sänker appen basnivån med 2 reps.";
}

function HundredPage() {
  const [state, setState] = useAppState();
  const [phase, setPhase] = useState<Phase>("pick");
  const [activeId, setActiveId] = useState<string | null>(null);

  const eligible = EXERCISES.filter((e) => e.hundredEligible);
  const active = activeId ? getExercise(activeId) : null;
  const reps = active ? state.hundred[active.id]?.reps ?? START_REPS : START_REPS;
  const plan = challengePlan(reps);
  const total = planTotal(plan);

  function start(id: string) {
    setActiveId(id);
    setPhase("do");
  }

  function rate(level: HundredFeedback) {
    if (!active) return;
    setState((s) => {
      const cur = s.hundred[active.id]?.reps ?? START_REPS;
      const next =
        level === "latt"
          ? Math.min(34, cur + 2)
          : level === "medel"
            ? Math.min(34, cur + 1)
            : level === "misslyckat"
              ? Math.max(START_REPS, cur - 2)
              : cur;
      return addSession(
        {
          ...s,
          hundred: { ...s.hundred, [active.id]: { reps: next } },
        },
        {
          mode: "hundred",
          exercises: [{ id: active.id, name: active.name, status: level === "misslyckat" ? "skipped" : "done" }],
          feedback: level,
          totalReps: total,
        },
      );
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
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">100 challenge</p>
          <div className="w-9" />
        </header>

        {phase === "pick" && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">100 challenge</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tre set med olika reps: först igång, sedan toppset, sedan back-off. Exempel: 10 + 14 + 8.
            </p>
            <ul className="mt-6 space-y-2">
              {eligible.map((e) => {
                const r = state.hundred[e.id]?.reps ?? START_REPS;
                const p = challengePlan(r);
                const t = planTotal(p);
                const pct = Math.min(100, Math.round((t / GOAL) * 100));
                return (
                  <li key={e.id}>
                    <button
                      onClick={() => start(e.id)}
                      className="w-full rounded-2xl bg-card p-4 text-left ring-1 ring-border/60 transition active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{e.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {p.join(" + ")}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">{t} reps · {pct}% till 100</p>
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
              <div className="grid grid-cols-3 gap-2">
                {plan.map((setReps, index) => (
                  <div key={index} className={`rounded-2xl p-4 text-center ${index === 1 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    <p className={`text-xs font-medium ${index === 1 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>Set {index + 1}</p>
                    <p className="mt-1 text-4xl font-semibold tracking-tight">{setReps}</p>
                    <p className={`mt-0.5 text-xs ${index === 1 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>reps</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Totalt {total} reps. Set 2 är toppsetet, set 3 är back-off.</p>
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
              Nästa gång justeras basnivån och appen räknar fram nya tre set.
            </p>
            <div className="mt-6 space-y-3">
              {(
                [
                  { id: "latt", label: "Lätt", hint: "+2 i basnivå" },
                  { id: "medel", label: "Medel", hint: "+1 i basnivå" },
                  { id: "svart", label: "Svårt", hint: "Samma nivå nästa gång" },
                  { id: "misslyckat", label: "Klarade inte", hint: "-2 i basnivå nästa gång" },
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
            <p className="mt-4 rounded-2xl bg-secondary/60 p-4 text-xs text-muted-foreground">
              {feedbackHint("misslyckat")} Målet är totalt 100 reps i formatet igång + toppset + back-off.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
