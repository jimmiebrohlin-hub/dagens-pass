import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, SkipForward, Info } from "lucide-react";
import { applyIntensity, exerciseDose, exerciseSetDose, intensityLabel, pickDailyThree, pickHalf, type Exercise } from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { todayISO, useAppState, addSession } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

type Mode = "dagens3" | "halvt";
type CoachPhase = "exercise" | "rest";
type PendingAction = "next-set" | "next-exercise";
type VisibleStep = {
  exercise: Exercise;
  index: number;
  state: "done" | "current" | "upcoming";
};

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

  const visibleSteps = getVisibleSteps(exercises, exerciseIndex, done);
  const nextExercise = pendingAction === "next-exercise" ? exercises[exerciseIndex + 1] : current;
  const nextExerciseAdjusted = nextExercise ? applyIntensity(nextExercise, state.intensity) : undefined;
  const nextSetNumber = pendingAction === "next-set" ? currentSet + 1 : 1;
  const nextTotalSets = pendingAction === "next-set" ? totalSets : nextExerciseAdjusted?.sets ?? 1;
  const nextLabel = nextExercise ? `${nextExercise.name} · Set ${nextSetNumber} av ${nextTotalSets}` : "Passet klart";

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
            <div className="min-w-0 flex-1">
              <p className="text-center text-lg font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-center text-xs text-muted-foreground">{title} · {intensityLabel(state.intensity)}</p>
            </div>
            <p className="w-10 text-right text-sm font-medium text-primary">{finished ? "Klart" : `${exerciseIndex + 1}/${exercises.length}`}</p>
          </div>

          {!finished && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {visibleSteps.map((step) => (
                <div key={step.exercise.id} className={`rounded-2xl p-2.5 ${step.state === "current" ? "bg-primary/15" : "bg-secondary/55"}`}>
                  <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${step.state === "done" || step.state === "current" ? "bg-primary" : "bg-muted-foreground/25"} ${step.state === "done" ? "w-full" : step.state === "current" ? "w-2/3" : "w-0"}`}
                    />
                  </div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${step.state === "current" ? "text-primary" : "text-muted-foreground"}`}>
                    {step.state === "done" ? "Klar" : step.state === "current" ? "Nu" : "Sen"}
                  </p>
                  <p className="mt-1 min-h-[2.25rem] text-sm font-medium leading-tight">{step.exercise.name}</p>
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
                <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full bg-secondary ring-8 ring-primary/20">
                  <div>
                    <p className="text-6xl font-semibold leading-none tracking-tight">{restSeconds}</p>
                    <p className="mt-1 text-sm text-muted-foreground">sek kvar</p>
                  </div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">Nästa</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{nextLabel}</p>
                <p className="mt-4 rounded-2xl bg-primary/15 p-3 text-sm font-medium text-primary">Ljudsignal när vilan är klar</p>
                <button onClick={skipRest} className="mt-6 h-12 w-full rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]">
                  Hoppa över vila
                </button>
              </section>
            </main>
          ) : (
            <main className="flex flex-1 flex-col">
              <section className="rounded-[2rem] bg-card p-5 ring-1 ring-border/60">
                <div className="grid grid-cols-[1fr_112px] gap-4">
                  <div>
                    <p className="inline-flex rounded-2xl bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Gör nu</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-none tracking-tight">{current.name}</h1>
                    <p className="mt-2 text-lg font-medium text-muted-foreground">Set {currentSet} av {totalSets}</p>
                    <div className="mt-4 rounded-[1.25rem] bg-secondary/60 px-4 py-5">
                      <p className="text-5xl font-semibold leading-none tracking-tight">{exerciseSetDose(current, state.intensity)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Totalt: {exerciseDose(current, state.intensity)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link to="/exercise/$exerciseId" params={{ exerciseId: current.id }} className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.98]" aria-label="Visa övningsdetaljer">
                      <Info className="h-5 w-5" />
                    </Link>
                    <div className="flex flex-1 items-center justify-center rounded-[1.5rem] bg-secondary/45 p-3 ring-1 ring-border/40">
                      <ExerciseIllustration exercise={current} />
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{current.instruction}</p>
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

function getVisibleSteps(exercises: Exercise[], currentIndex: number, done: boolean[]): VisibleStep[] {
  if (exercises.length <= 3) {
    return exercises.map((exercise, index) => ({
      exercise,
      index,
      state: done[index] ? "done" : index === currentIndex ? "current" : "upcoming",
    }));
  }

  let start = Math.max(0, currentIndex - 1);
  if (start + 3 > exercises.length) start = exercises.length - 3;

  return exercises.slice(start, start + 3).map((exercise, localIndex) => {
    const index = start + localIndex;
    return {
      exercise,
      index,
      state: done[index] ? "done" : index === currentIndex ? "current" : "upcoming",
    };
  });
}

function ExerciseIllustration({ exercise }: { exercise: Exercise }) {
  const stroke = "currentColor";

  if (["armhavningar", "planka", "spindelplanka"].includes(exercise.id)) {
    return (
      <svg viewBox="0 0 120 120" className="h-24 w-24 text-primary/85" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="84" cy="27" r="10" />
        <path d="M74 35L58 50L42 60" />
        <path d="M58 50L86 57L104 57" />
        <path d="M42 60L24 85" />
        <path d="M70 56L58 85" />
        <path d="M100 57L110 82" />
      </svg>
    );
  }

  if (["stepup", "utfall"].includes(exercise.id)) {
    return (
      <svg viewBox="0 0 120 120" className="h-24 w-24 text-primary/85" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="70" y="76" width="28" height="18" rx="3" />
        <circle cx="52" cy="22" r="10" />
        <path d="M52 32L52 54L72 64" />
        <path d="M52 42L32 52" />
        <path d="M72 64L86 76" />
        <path d="M52 54L36 82" />
        <path d="M36 82L20 94" />
        <path d="M86 76L102 76" />
      </svg>
    );
  }

  if (["hoftlyft", "situps", "benlyft", "rygglyft"].includes(exercise.id)) {
    return (
      <svg viewBox="0 0 120 120" className="h-24 w-24 text-primary/85" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="34" cy="70" r="9" />
        <path d="M42 72L62 58L82 58" />
        <path d="M62 58L76 76L98 76" />
        <path d="M76 76L66 92" />
        <path d="M98 76L108 58" />
        <path d="M24 90H108" strokeWidth="3" />
      </svg>
    );
  }

  if (exercise.id === "bankdips") {
    return (
      <svg viewBox="0 0 120 120" className="h-24 w-24 text-primary/85" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 84H98" />
        <path d="M30 48V84" />
        <path d="M90 52V84" />
        <circle cx="56" cy="28" r="9" />
        <path d="M56 38L56 58L38 64" />
        <path d="M56 52L76 58" />
        <path d="M38 64L38 84" />
        <path d="M76 58L88 84" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-primary/85" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="60" cy="22" r="10" />
      <path d="M60 32L60 58" />
      <path d="M60 40L40 50" />
      <path d="M60 40L80 50" />
      <path d="M60 58L44 88" />
      <path d="M60 58L78 88" />
      <path d="M34 92H86" strokeWidth="3" />
    </svg>
  );
}
