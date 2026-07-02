import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, SkipForward, Timer, Info } from "lucide-react";
import { applyIntensity, exerciseDose, exerciseSetDose, intensityLabel, pickDailyThree, pickHalf, type Exercise } from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { todayISO, useAppState, addSession } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

type Mode = "dagens3" | "halvt";
type CoachPhase = "exercise" | "rest";
type PendingAction = "next-set" | "next-exercise";
const REST_SECONDS = 45;

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
  const [state, setState] = useAppState();
  const today = todayISO();

  const exercises = useMemo<Exercise[]>(
    () => (mode === "halvt" ? pickHalf(today + "h", state.preferences) : pickDailyThree(today, state.preferences)),
    [mode, today, state.preferences],
  );

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumberIndex, setSetNumberIndex] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => exercises.map(() => false));
  const [phase, setPhase] = useState<CoachPhase>("exercise");
  const [restSeconds, setRestSeconds] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const current = exercises[exerciseIndex];
  const adjusted = current ? applyIntensity(current, state.intensity) : undefined;
  const totalSets = adjusted?.sets ?? 1;
  const currentSet = Math.min(setNumberIndex + 1, totalSets);
  const finished = exerciseIndex >= exercises.length;
  const title = mode === "halvt" ? "Halvt pass" : "Dagens 3";
  const dailyDoneToday = mode === "dagens3" && state.sessions.some((session) => session.date === today && session.mode === "dagens3");

  const nextExercise = pendingAction === "next-exercise" ? exercises[exerciseIndex + 1] : current;
  const nextSetNumber = pendingAction === "next-set" ? currentSet + 1 : 1;
  const nextLabel = nextExercise ? `${nextExercise.name} · Set ${nextSetNumber} av ${nextExercise.sets}` : "Passet klart";

  useEffect(() => {
    if (phase !== "rest" || restSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRestSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, restSeconds]);

  useEffect(() => {
    if (phase !== "rest" || restSeconds !== 0 || !pendingAction) return;
    void playTimerDoneCue(state.sound);

    if (pendingAction === "next-set") {
      setSetNumberIndex((index) => index + 1);
    } else {
      setSetNumberIndex(0);
      setExerciseIndex((index) => index + 1);
    }

    setPendingAction(null);
    setPhase("exercise");
  }, [phase, restSeconds, pendingAction, state.sound]);

  function markDone(index: number, completed: boolean) {
    setDone((items) => {
      const next = [...items];
      next[index] = completed;
      return next;
    });
  }

  function beginRest(action: PendingAction) {
    setPendingAction(action);
    setPhase("rest");
    void unlockTimerSound();
    setRestSeconds(REST_SECONDS);
  }

  function skipRest() {
    setRestSeconds(0);
  }

  function completeSet() {
    if (!current || !adjusted || phase !== "exercise") return;
    const hasMoreSets = setNumberIndex + 1 < adjusted.sets;
    const hasMoreExercises = exerciseIndex + 1 < exercises.length;

    if (hasMoreSets) {
      beginRest("next-set");
      return;
    }

    markDone(exerciseIndex, true);
    if (hasMoreExercises) {
      beginRest("next-exercise");
    } else {
      setSetNumberIndex(0);
      setExerciseIndex((index) => index + 1);
    }
  }

  function skipExercise() {
    markDone(exerciseIndex, false);
    setPhase("exercise");
    setRestSeconds(0);
    setPendingAction(null);
    setSetNumberIndex(0);
    setExerciseIndex((index) => index + 1);
  }

  function finish() {
    setState((s) =>
      addSession(s, {
        mode,
        exercises: exercises.map((exercise, i) => ({
          id: exercise.id,
          name: exercise.name,
          status: done[i] ? "done" : "skipped",
        })),
      }),
    );
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
        <header className="mb-5 rounded-3xl bg-card px-4 py-4 ring-1 ring-border/60">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{title} · {intensityLabel(state.intensity)}</p>
            </div>
            <p className="w-10 text-right text-sm font-medium text-primary">{finished ? "Klart" : `${exerciseIndex + 1}/${exercises.length}`}</p>
          </div>

          {!finished && (
            <div className="mt-4 flex gap-1.5">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full bg-primary ${done[index] ? "w-full" : index === exerciseIndex ? "w-2/3" : "w-0"}`} />
                </div>
              ))}
            </div>
          )}
        </header>

        {dailyDoneToday && !finished && (
          <p className="mb-4 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            Dagens 3 är redan sparat idag. Det här sparas som ett extra pass.
          </p>
        )}

        {!finished && current ? (
          phase === "rest" ? (
            <main className="flex flex-1 flex-col justify-center">
              <section className="rounded-[2rem] bg-card p-7 text-center ring-1 ring-border/60">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vila</p>
                <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-full bg-secondary ring-8 ring-primary/20">
                  <div>
                    <p className="text-7xl font-semibold leading-none tracking-tight">{restSeconds}</p>
                    <p className="mt-1 text-sm text-muted-foreground">sek kvar</p>
                  </div>
                </div>
                <p className="mt-7 text-sm text-muted-foreground">Nästa</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{nextLabel}</p>
                <p className="mt-4 rounded-2xl bg-primary/15 p-3 text-sm font-medium text-primary">Ljudsignal när vilan är klar</p>
                <button onClick={skipRest} className="mt-6 h-12 w-full rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]">
                  Hoppa över vila
                </button>
              </section>
            </main>
          ) : (
            <main className="flex flex-1 flex-col">
              <section className="rounded-[2rem] bg-card p-6 ring-1 ring-border/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="inline-flex rounded-2xl bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Gör nu</p>
                    <h1 className="mt-5 text-4xl font-semibold leading-none tracking-tight">{current.name}</h1>
                    <p className="mt-2 text-lg font-medium text-muted-foreground">Set {currentSet} av {totalSets}</p>
                  </div>
                  <Link to="/exercise/$exerciseId" params={{ exerciseId: current.id }} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.98]" aria-label="Visa övningsdetaljer">
                    <Info className="h-5 w-5" />
                  </Link>
                </div>

                <div className="mt-7 rounded-[1.5rem] bg-secondary/60 p-6 text-center">
                  <p className="text-6xl font-semibold tracking-tight">{exerciseSetDose(current, state.intensity)}</p>
                  <p className="mt-3 text-sm text-muted-foreground">Totalt: {exerciseDose(current, state.intensity)}</p>
                </div>

                <p className="mt-6 text-[16px] leading-relaxed text-muted-foreground">{current.instruction}</p>
              </section>

              <section className="mt-4 rounded-[1.75rem] bg-card p-4 ring-1 ring-border/60">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Passöversikt</p>
                <div className="grid grid-cols-3 gap-2">
                  {exercises.map((exercise, index) => (
                    <div key={exercise.id} className={`rounded-2xl p-3 text-center ${index === exerciseIndex ? "bg-primary/15" : "bg-secondary/55"}`}>
                      <p className={`text-xs font-semibold ${index === exerciseIndex ? "text-primary" : "text-muted-foreground"}`}>{done[index] ? "✓" : index + 1}</p>
                      <p className="mt-1 truncate text-sm font-medium">{exercise.name}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 pt-6">
                <button onClick={completeSet} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-medium text-primary-foreground shadow-sm active:scale-[0.99]">
                  <Check className="h-5 w-5" /> Klar
                </button>
                <button onClick={skipExercise} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-secondary px-6 text-base font-medium text-secondary-foreground active:scale-[0.99]">
                  <SkipForward className="h-5 w-5" /> Hoppa
                </button>
              </div>
            </main>
          )
        ) : (
          <div className="mt-10 rounded-3xl bg-card p-8 text-center ring-1 ring-border/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-6 w-6 text-primary-foreground/80" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Bra jobbat</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dailyDoneToday ? "Extra passet sparas i historiken. Streak och veckomål räknas fortfarande per dag." : "Passet är klart. Streak och veckans mål uppdateras."}
            </p>
            <button onClick={finish} className="mt-6 h-12 w-full rounded-2xl bg-primary text-base font-medium text-primary-foreground">
              Spara & avsluta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
