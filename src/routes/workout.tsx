import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Info } from "lucide-react";
import { ExerciseIllustration } from "@/components/ExerciseIllustration";
import { WorkoutActionBar } from "@/components/WorkoutActionBar";
import { WorkoutFocusPicker } from "@/components/WorkoutFocusPicker";
import {
  applyIntensity,
  exerciseSetDose,
  intensityLabel,
  pickDailyThree,
  pickLarge,
  pickSmall,
  workoutFocusLabel,
  type Exercise,
  type WorkoutFocus,
} from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { todayISO, useAppState, addSession } from "@/lib/storage";
import { completeSharedDaily3Turns } from "@/lib/sharedStreaks";
import { clearWorkoutDraft, createWorkoutDraftKey, loadWorkoutDraft, saveWorkoutDraft, type WorkoutCoachPhase, type WorkoutPendingAction } from "@/lib/workoutDraft";
import { APP_NAME } from "@/lib/version";

type Mode = "dagens3" | "halvt" | "stort";

const REST_SECONDS = 45;
const VALID_FOCUS: WorkoutFocus[] = ["mix", "lower", "upper", "core", "gentle"];

function parseFocus(value: unknown): WorkoutFocus | undefined {
  return typeof value === "string" && VALID_FOCUS.includes(value as WorkoutFocus) ? (value as WorkoutFocus) : undefined;
}

export const Route = createFileRoute("/workout")({
  validateSearch: (s: Record<string, unknown>): { mode: Mode; focus?: WorkoutFocus } => ({
    mode: s.mode === "stort" ? "stort" : s.mode === "halvt" ? "halvt" : "dagens3",
    focus: parseFocus(s.focus),
  }),
  head: () => ({ meta: [{ title: `Pass — ${APP_NAME}` }] }),
  component: WorkoutPage,
});

function WorkoutPage() {
  const { mode, focus } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useAppState();
  const today = todayISO();
  const needsFocusChoice = mode !== "dagens3" && !focus;
  const activeFocus = focus ?? "mix";

  const exercises = useMemo<Exercise[]>(() => {
    if (needsFocusChoice) return [];
    if (mode === "stort") return pickLarge(`${today}:large`, state.preferences, activeFocus);
    if (mode === "halvt") return pickSmall(`${today}:small`, state.preferences, activeFocus);
    return pickDailyThree(today, state.preferences);
  }, [activeFocus, mode, needsFocusChoice, state.preferences, today]);

  const exerciseKey = exercises.map((exercise) => exercise.id).join("|");
  const draftKey = useMemo(
    () =>
      createWorkoutDraftKey({
        date: today,
        mode,
        focus: activeFocus,
        intensity: state.intensity,
        exerciseIds: exercises.map((exercise) => exercise.id),
      }),
    [activeFocus, exercises, mode, state.intensity, today],
  );
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumberIndex, setSetNumberIndex] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => exercises.map(() => false));
  const [phase, setPhase] = useState<WorkoutCoachPhase>("exercise");
  const [restSeconds, setRestSeconds] = useState(0);
  const [pendingAction, setPendingAction] = useState<WorkoutPendingAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [readyDraftKey, setReadyDraftKey] = useState<string | null>(null);

  useEffect(() => {
    if (needsFocusChoice || exercises.length === 0) {
      setReadyDraftKey(null);
      return;
    }
    const draft = loadWorkoutDraft(draftKey, exercises.length);
    setExerciseIndex(draft?.exerciseIndex ?? 0);
    setSetNumberIndex(draft?.setNumberIndex ?? 0);
    setDone(draft?.done ?? exercises.map(() => false));
    setPhase(draft?.phase ?? "exercise");
    setRestSeconds(draft?.restSeconds ?? 0);
    setPendingAction(draft?.pendingAction ?? null);
    setSaving(false);
    setReadyDraftKey(draftKey);
  }, [draftKey, exerciseKey, exercises, needsFocusChoice]);

  useEffect(() => {
    if (readyDraftKey !== draftKey || needsFocusChoice || exercises.length === 0) return;
    saveWorkoutDraft(draftKey, {
      exerciseIndex,
      setNumberIndex,
      done,
      phase,
      restSeconds,
      pendingAction,
    });
  }, [done, draftKey, exerciseIndex, exercises.length, needsFocusChoice, pendingAction, phase, readyDraftKey, restSeconds, setNumberIndex]);

  useEffect(() => {
    if (readyDraftKey !== draftKey || needsFocusChoice) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [draftKey, exerciseIndex, needsFocusChoice, phase, readyDraftKey, setNumberIndex]);

  const restDuration = state.restSeconds ?? REST_SECONDS;
  const restProgressPct = restDuration > 0 ? Math.max(0, Math.min(100, ((restDuration - restSeconds) / restDuration) * 100)) : 0;
  const current = exercises[exerciseIndex];
  const adjusted = current ? applyIntensity(current, state.intensity) : undefined;
  const totalSets = adjusted?.sets ?? 1;
  const currentSet = Math.min(setNumberIndex + 1, totalSets);
  const finished = !needsFocusChoice && exerciseIndex >= exercises.length;
  const title = mode === "stort" ? "Stort blandpass" : mode === "halvt" ? "Litet blandpass" : "Dagens 3";
  const titleDetail = mode !== "dagens3" ? `${title} · ${workoutFocusLabel(activeFocus)}` : title;
  const dailyDoneToday = mode === "dagens3" && state.sessions.some((session) => session.date === today && session.mode === "dagens3");
  const progressPercent = exercises.length > 0 ? Math.min(100, (exerciseIndex / exercises.length) * 100) : 0;

  const nextExercise = pendingAction === "next-exercise" ? exercises[exerciseIndex + 1] : current;
  const nextAdjusted = nextExercise ? applyIntensity(nextExercise, state.intensity) : undefined;
  const nextSetNumber = pendingAction === "next-set" ? currentSet + 1 : 1;
  const nextTotalSets = pendingAction === "next-set" ? totalSets : nextAdjusted?.sets ?? 1;
  const nextLabel = nextExercise ? `${nextExercise.name} · set ${nextSetNumber} av ${nextTotalSets}` : "Passet är klart";

  useEffect(() => {
    if (phase !== "rest" || restSeconds <= 0) return;
    const timer = window.setInterval(() => setRestSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
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
  }, [pendingAction, phase, restSeconds, state.sound]);

  function markDone(index: number, completed: boolean) {
    setDone((items) => {
      const next = [...items];
      next[index] = completed;
      return next;
    });
  }

  function beginRest(action: WorkoutPendingAction) {
    setPendingAction(action);
    setPhase("rest");
    void unlockTimerSound();
    setRestSeconds(restDuration);
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

  async function finish() {
    if (saving) return;
    setSaving(true);
    setState((currentState) =>
      addSession(currentState, {
        mode,
        exercises: exercises.map((exercise, index) => ({
          id: exercise.id,
          name: exercise.name,
          status: done[index] ? "done" : "skipped",
        })),
      }),
    );

    if (mode === "dagens3" && !dailyDoneToday) {
      try {
        await completeSharedDaily3Turns();
      } catch (error) {
        console.error("[workout] completeSharedDaily3Turns failed", error);
      }
    }

    clearWorkoutDraft(draftKey);
    navigate({ to: "/" });
  }

  if (needsFocusChoice && mode !== "dagens3") {
    return <WorkoutFocusPicker mode={mode} intensity={state.intensity} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className={`mx-auto flex min-h-screen max-w-md flex-col px-5 pt-5 ${!finished && phase === "exercise" ? "pb-36" : "pb-8"}`}>
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight">{titleDetail}</p>
              <p className="text-xs text-muted-foreground">
                {finished ? "Passet klart" : `Övning ${Math.min(exerciseIndex + 1, exercises.length)} av ${exercises.length}`} · {intensityLabel(state.intensity)}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${finished ? 100 : progressPercent}%` }} />
          </div>
        </header>

        {dailyDoneToday && !finished && (
          <p className="mb-4 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            Extra pass: detta påverkar inte streaken.
          </p>
        )}

        {!finished && current && phase === "exercise" && (
          <main className="flex flex-1 flex-col">
            <section className="flex flex-1 flex-col rounded-[2rem] bg-card p-5 ring-1 ring-border/60">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gör nu</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{current.name}</h1>
                <p className="mt-2 text-5xl font-semibold leading-none tracking-tight">{exerciseSetDose(current, state.intensity)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Set {currentSet} av {totalSets}</p>
              </div>

              <div className="mt-5 flex h-[clamp(9rem,24vh,12rem)] shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] bg-secondary/45 p-4 ring-1 ring-border/40">
                <ExerciseIllustration exercise={current} />
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{current.instruction}</p>
              <Link
                to="/exercise/$exerciseId"
                params={{ exerciseId: current.id }}
                className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground"
              >
                <Info className="h-4 w-4" /> Teknik & alternativ
              </Link>
            </section>
            <WorkoutActionBar restDuration={restDuration} onComplete={completeSet} onSkip={skipExercise} />
          </main>
        )}

        {!finished && current && phase === "rest" && (
          <main className="flex flex-1 flex-col">
            <section className="flex flex-1 flex-col items-center justify-center rounded-[2rem] bg-card p-6 text-center ring-1 ring-primary/25">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Vila</p>
              <p className="mt-5 text-8xl font-semibold leading-none tracking-tight">{restSeconds}</p>
              <p className="mt-2 text-sm text-muted-foreground">sekunder</p>

              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-linear" style={{ width: `${restProgressPct}%` }} />
              </div>

              <div className="mt-8 w-full rounded-2xl bg-secondary/60 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Nästa</p>
                <p className="mt-1 text-xl font-semibold">{nextLabel}</p>
              </div>

              <button onClick={() => setRestSeconds(0)} className="mt-6 h-12 w-full rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]">
                Hoppa över vilan
              </button>
            </section>
          </main>
        )}

        {finished && (
          <div className="mt-8 rounded-3xl bg-card p-8 text-center ring-1 ring-primary/25">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight">Bra jobbat!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {dailyDoneToday ? "Extra passet sparas utan att påverka streaken." : mode === "dagens3" ? "Dagens 3 är klart. Din streak uppdateras när du sparar." : "Passet är klart och redo att sparas."}
            </p>
            <button disabled={saving} onClick={finish} className="mt-6 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-60">
              {saving ? "Sparar..." : "Spara & gå hem"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
