import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, SkipForward, Info } from "lucide-react";
import { applyIntensity, exerciseDose, exerciseSetDose, intensityLabel, pickDailyThree, pickLarge, pickSmall, type Exercise } from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { todayISO, useAppState, addSession } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

type Mode = "dagens3" | "halvt" | "stort";
type CoachPhase = "exercise" | "rest";
type PendingAction = "next-set" | "next-exercise";

const REST_SECONDS = 45;
const EXERCISE_IMAGES: Record<string, string> = {
  armhavningar: "/exercises/armhavningar.png",
  bankdips: "/exercises/bankdips.png",
  benlyft: "/exercises/benlyft.png",
  bird_dog: "/exercises/bird_dog.png",
  dead_bug: "/exercises/dead_bug.png",
  hollow_hold: "/exercises/hollow_hold.png",
  hoftlyft: "/exercises/hoftlyft.png",
  jagarvila: "/exercises/jagarvila.png",
  knaboj: "/exercises/knaboj.png",
  mountain_climbers: "/exercises/mountain_climbers.png",
  planka: "/exercises/planka.png",
  russian_twist: "/exercises/russian_twist.png",
  rygglyft: "/exercises/rygglyft.png",
  sidoplanka: "/exercises/sidoplanka.png",
  situps: "/exercises/situps.png",
  spindelplanka: "/exercises/spindelplanka.png",
  stepup: "/exercises/stepup.png",
  tahavningar: "/exercises/tahavningar.png",
  utfall: "/exercises/utfall.png",
  vadpress: "/exercises/vadpress.png",
};

export const Route = createFileRoute("/workout")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode } => ({
    mode: s.mode === "stort" ? "stort" : s.mode === "halvt" ? "halvt" : "dagens3",
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
    () => (mode === "stort" ? pickLarge(today + "l", state.preferences) : mode === "halvt" ? pickSmall(today + "s", state.preferences) : pickDailyThree(today, state.preferences)),
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
  const title = mode === "stort" ? "Stort blandpass" : mode === "halvt" ? "Litet blandpass" : "Dagens 3";
  const dailyDoneToday = mode === "dagens3" && state.sessions.some((session) => session.date === today && session.mode === "dagens3");
  const nextPreview = exercises[exerciseIndex + 1];

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
            <div className="min-w-0 flex-1 text-center">
              <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{title} · {intensityLabel(state.intensity)}</p>
            </div>
            <p className="w-10 text-right text-sm font-medium text-primary">{finished ? "Klart" : `${exerciseIndex + 1}/${exercises.length}`}</p>
          </div>

          {!finished && current && (
            <section className="mt-4 rounded-2xl bg-secondary/45 p-3">
              <div className="flex items-center justify-center gap-1.5">
                {exercises.map((exercise, index) => (
                  <span
                    key={`${exercise.id}-${index}`}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      done[index] ? "bg-primary text-primary-foreground" : index === exerciseIndex ? "bg-primary/20 text-primary ring-2 ring-primary/25" : "bg-muted text-muted-foreground"
                    }`}
                    aria-label={`${index + 1}. ${exercise.name}`}
                  >
                    {done[index] ? "✓" : index === exerciseIndex ? "•" : ""}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nu</p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight text-primary">{current.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{nextPreview ? `Nästa: ${nextPreview.name}` : "Sista övningen"}</p>
              </div>
            </section>
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
                    <p className="mt-4 text-lg font-medium text-muted-foreground">Set {currentSet} av {totalSets}</p>
                    <div className="mt-3 rounded-[1.25rem] bg-secondary/60 px-4 py-5">
                      <p className="text-5xl font-semibold leading-none tracking-tight">{exerciseSetDose(current, state.intensity)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Totalt: {exerciseDose(current, state.intensity)}</p>
                    </div>
                    <p className="mt-3 text-xs font-medium text-primary">Efter Klar: vila {REST_SECONDS} sek</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link to="/exercise/$exerciseId" params={{ exerciseId: current.id }} className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.98]" aria-label="Visa övningsdetaljer">
                      <Info className="h-5 w-5" />
                    </Link>
                    <div className="flex flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] bg-secondary/45 p-1 ring-1 ring-border/40">
                      <ExerciseIllustration exercise={current} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                  <button onClick={completeSet} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-medium text-primary-foreground shadow-sm active:scale-[0.99]">
                    <Check className="h-5 w-5" /> Klar
                  </button>
                  <button onClick={skipExercise} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-secondary px-5 text-base font-medium text-secondary-foreground active:scale-[0.99]">
                    <SkipForward className="h-5 w-5" /> Hoppa
                  </button>
                </div>

                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{current.instruction}</p>
              </section>
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

function ExerciseIllustration({ exercise }: { exercise: Exercise }) {
  const imageSrc = EXERCISE_IMAGES[exercise.id];

  if (imageSrc) {
    return <img src={imageSrc} alt={exercise.name} className="h-full w-full rounded-[1.25rem] object-contain" loading="lazy" />;
  }

  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 text-primary/85" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
