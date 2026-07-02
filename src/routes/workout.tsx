import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, SkipForward, Timer, Info } from "lucide-react";
import { applyIntensity, exerciseDose, exerciseSetDose, intensityLabel, pickDailyThree, pickHalf, type Exercise } from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { todayISO, useAppState, addSession } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

type Mode = "dagens3" | "halvt";
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
  const [restSeconds, setRestSeconds] = useState(0);
  const [timerFinished, setTimerFinished] = useState(false);

  const current = exercises[exerciseIndex];
  const adjusted = current ? applyIntensity(current, state.intensity) : undefined;
  const totalSets = adjusted?.sets ?? 1;
  const currentSet = Math.min(setNumberIndex + 1, totalSets);
  const finished = exerciseIndex >= exercises.length;
  const title = mode === "halvt" ? "Halvt pass" : "Dagens 3";
  const dailyDoneToday = mode === "dagens3" && state.sessions.some((session) => session.date === today && session.mode === "dagens3");

  useEffect(() => {
    if (restSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRestSeconds((seconds) => {
        const nextSeconds = Math.max(0, seconds - 1);
        if (seconds > 0 && nextSeconds === 0) {
          setTimerFinished(true);
          void playTimerDoneCue(state.sound);
        }
        return nextSeconds;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restSeconds, state.sound]);

  function startRest() {
    setTimerFinished(false);
    void unlockTimerSound();
    setRestSeconds(REST_SECONDS);
  }

  function skipRest() {
    setTimerFinished(false);
    setRestSeconds(0);
  }

  function markDone(index: number, completed: boolean) {
    setDone((items) => {
      const next = [...items];
      next[index] = completed;
      return next;
    });
  }

  function completeSet() {
    if (!current || !adjusted) return;
    const currentExerciseIndex = exerciseIndex;
    const hasMoreSets = setNumberIndex + 1 < adjusted.sets;
    const hasMoreExercises = exerciseIndex + 1 < exercises.length;

    if (hasMoreSets) {
      setSetNumberIndex((index) => index + 1);
      startRest();
      return;
    }

    markDone(currentExerciseIndex, true);
    setSetNumberIndex(0);
    if (hasMoreExercises) {
      setExerciseIndex((index) => index + 1);
      startRest();
    } else {
      setRestSeconds(0);
      setTimerFinished(false);
      setExerciseIndex((index) => index + 1);
    }
  }

  function skipExercise() {
    markDone(exerciseIndex, false);
    setRestSeconds(0);
    setTimerFinished(false);
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
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-sm text-muted-foreground">
            {finished ? "Klart" : `${exerciseIndex + 1} / ${exercises.length}`}
          </p>
          <div className="w-9" />
        </header>

        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {title} · {intensityLabel(state.intensity)}
        </p>
        {dailyDoneToday && !finished && (
          <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            Dagens 3 är redan sparat idag. Det här sparas som ett extra pass.
          </p>
        )}

        {!finished && current ? (
          <>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{current.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Set {currentSet} av {totalSets}</p>
              </div>
              <Link to="/exercise/$exerciseId" params={{ exerciseId: current.id }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.98]" aria-label="Visa övningsdetaljer">
                <Info className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 rounded-3xl bg-card p-6 ring-1 ring-border/60">
              <p className="text-sm text-muted-foreground">Gör nu</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight">{exerciseSetDose(current, state.intensity)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Set {currentSet} av {totalSets} · totalt {exerciseDose(current, state.intensity)}</p>
              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
                {current.instruction}
              </p>
              {(current.easier || current.harder) && (
                <div className="mt-5 space-y-2 rounded-2xl bg-secondary/60 p-4 text-sm">
                  {current.easier && (
                    <p>
                      <span className="font-medium">Lättare: </span>
                      <span className="text-muted-foreground">{current.easier}</span>
                    </p>
                  )}
                  {current.harder && (
                    <p>
                      <span className="font-medium">Svårare: </span>
                      <span className="text-muted-foreground">{current.harder}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <section className={`mt-4 rounded-2xl bg-card p-4 ring-1 ${timerFinished ? "ring-primary/40" : "ring-border/60"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Vila</p>
                    <p className="text-xs text-muted-foreground">
                      {restSeconds > 0 ? `${restSeconds} sek kvar` : timerFinished ? "Timer klar" : `${REST_SECONDS} sek efter Klar`}
                    </p>
                  </div>
                </div>
                {restSeconds > 0 && (
                  <button onClick={skipRest} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground active:scale-[0.98]">
                    Hoppa över
                  </button>
                )}
              </div>
              {timerFinished && restSeconds === 0 && (
                <div className="mt-3 rounded-2xl bg-primary/15 p-3 text-sm font-medium">
                  Vila klar. Gör nästa set när du är redo.
                </div>
              )}
              {restSeconds > 0 && (
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(4, (restSeconds / REST_SECONDS) * 100)}%` }} />
                </div>
              )}
              {!restSeconds && !timerFinished && (
                <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  Tryck Klar när setet är gjort. Då visas nästa set och vilan startar automatiskt.
                </p>
              )}
            </section>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
              <button disabled={restSeconds > 0} onClick={completeSet} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground shadow-sm disabled:opacity-50 active:scale-[0.99]">
                <Check className="h-4 w-4" /> Klar
              </button>
              <button onClick={skipExercise} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 text-sm font-medium text-secondary-foreground active:scale-[0.99]">
                <SkipForward className="h-4 w-4" /> Hoppa
              </button>
            </div>

            <ul className="mt-8 space-y-2">
              {exercises.map((e, i) => (
                <li key={e.id} className={`flex items-center gap-3 text-sm ${i === exerciseIndex ? "text-foreground" : "text-muted-foreground"}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${done[i] ? "bg-primary text-primary-foreground" : i === exerciseIndex ? "bg-primary/20" : "bg-muted"}`}>
                    {done[i] ? "✓" : i + 1}
                  </span>
                  <Link to="/exercise/$exerciseId" params={{ exerciseId: e.id }} className="truncate underline-offset-4 hover:underline">
                    {e.name}
                  </Link>
                  <span className="ml-auto text-xs text-muted-foreground">{i === exerciseIndex ? `set ${currentSet}/${totalSets}` : exerciseDose(e, state.intensity)}</span>
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
