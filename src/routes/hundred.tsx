import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Info, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { EXERCISES, getExercise, type Exercise } from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { useAppState, addSession, updateActiveHundredId, updateSound, type HundredFeedback } from "@/lib/storage";
import { HUNDRED_GOAL, HUNDRED_START_REPS, challengePlan, createChallengeAttempt, createChallengeResult, feedbackHint, planTotal, type ChallengeAttempt, type ChallengeResult } from "@/lib/hundredChallenge";
import { clearHundredDraft, loadHundredDraft, saveHundredDraft } from "@/lib/hundredDraft";
import { APP_NAME } from "@/lib/version";

const DEFAULT_REST_SECONDS = 45;
const EXERCISE_IMAGES: Record<string, string> = {
  armhavningar: "/exercises/armhavningar.png",
  bankdips: "/exercises/bankdips.png",
  benlyft: "/exercises/benlyft.png",
  hoftlyft: "/exercises/hoftlyft.png",
  knaboj: "/exercises/knaboj.png",
  rygglyft: "/exercises/rygglyft.png",
  situps: "/exercises/situps.png",
  stepup: "/exercises/stepup.png",
  utfall: "/exercises/utfall.png",
};

export const Route = createFileRoute("/hundred")({
  head: () => ({ meta: [{ title: `100 challenge — ${APP_NAME}` }] }),
  component: HundredPage,
});

type Phase = "pick" | "do" | "rest" | "rate" | "done";

function HundredPage() {
  const [state, setState] = useAppState();
  const [phase, setPhase] = useState<Phase>("pick");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [manualPick, setManualPick] = useState(false);
  const [setIndex, setSetIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [attempt, setAttempt] = useState<ChallengeAttempt | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);

  const eligible = EXERCISES.filter((e) => e.hundredEligible);
  const savedActive = state.activeHundredId && getExercise(state.activeHundredId)?.hundredEligible ? state.activeHundredId : undefined;
  const active = activeId ? getExercise(activeId) : null;
  const plan = attempt?.plan ?? challengePlan(HUNDRED_START_REPS);
  const total = attempt?.total ?? planTotal(plan);
  const restDuration = state.restSeconds ?? DEFAULT_REST_SECONDS;
  const restProgressPct = restDuration > 0 ? Math.max(0, Math.min(100, ((restDuration - restSeconds) / restDuration) * 100)) : 0;
  const currentReps = plan[setIndex] ?? plan[0];
  const nextSet = setIndex + 2;

  useEffect(() => {
    const draft = loadHundredDraft();
    if (draft && getExercise(draft.activeId)?.hundredEligible) {
      setActiveId(draft.activeId);
      setPhase(draft.phase);
      setSetIndex(draft.setIndex);
      setRestSeconds(draft.restSeconds);
      setAttempt(draft.attempt);
    }
    setDraftChecked(true);
  }, []);

  useEffect(() => {
    if (!draftChecked || manualPick || activeId || phase !== "pick" || !savedActive) return;
    const baseReps = state.hundred[savedActive]?.reps ?? HUNDRED_START_REPS;
    setManualPick(false);
    setActiveId(savedActive);
    setSetIndex(0);
    setRestSeconds(0);
    setAttempt(createChallengeAttempt(baseReps));
    setResult(null);
    setPhase("do");
  }, [draftChecked, manualPick, activeId, phase, savedActive, state.hundred]);

  useEffect(() => {
    if (!draftChecked || !activeId || !attempt || (phase !== "do" && phase !== "rest" && phase !== "rate")) return;
    saveHundredDraft({ activeId, phase, setIndex, restSeconds, attempt });
  }, [activeId, attempt, draftChecked, phase, restSeconds, setIndex]);

  useEffect(() => {
    if (phase !== "rest" || restSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRestSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, restSeconds]);

  useEffect(() => {
    if (phase !== "rest" || restSeconds !== 0) return;
    void playTimerDoneCue(state.sound);
    setSetIndex((index) => Math.min(2, index + 1));
    setPhase("do");
  }, [phase, restSeconds, state.sound]);

  function start(id: string, saveAsActive = true, baseOverride?: number) {
    const baseReps = baseOverride ?? state.hundred[id]?.reps ?? HUNDRED_START_REPS;
    if (saveAsActive) {
      setState((s) => updateActiveHundredId(s, id));
    }
    setManualPick(false);
    setActiveId(id);
    setSetIndex(0);
    setRestSeconds(0);
    setAttempt(createChallengeAttempt(baseReps));
    setResult(null);
    setPhase("do");
  }

  function chooseChallenge() {
    clearHundredDraft();
    setManualPick(true);
    setActiveId(null);
    setSetIndex(0);
    setRestSeconds(0);
    setAttempt(null);
    setResult(null);
    setPhase("pick");
  }

  function completeSet() {
    if (setIndex < 2) {
      void unlockTimerSound();
      setRestSeconds(restDuration);
      setPhase("rest");
      return;
    }
    setPhase("rate");
  }

  function skipRest() {
    setRestSeconds(0);
  }

  function toggleSound() {
    setState((s) => updateSound(s, { enabled: !s.sound.enabled }));
  }

  function rate(level: HundredFeedback) {
    if (!active || !attempt) return;
    const completedResult = createChallengeResult(attempt, level);
    setResult(completedResult);
    setState((s) =>
      addSession(
        {
          ...s,
          activeHundredId: active.id,
          hundred: { ...s.hundred, [active.id]: { reps: completedResult.nextBaseReps } },
        },
        {
          mode: "hundred",
          exercises: [
            {
              id: active.id,
              name: active.name,
              status: level === "misslyckat" ? "skipped" : "done",
            },
          ],
          feedback: level,
          totalReps: attempt.total,
        },
      ),
    );
    setSetIndex(0);
    setRestSeconds(0);
    clearHundredDraft();
    setPhase("done");
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
            <h1 className="text-3xl font-semibold tracking-tight">Välj challenge</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Du har en aktiv challenge i taget. Den startar direkt nästa gång du trycker på 100 challenge.
            </p>
            {savedActive && (
              <button onClick={() => start(savedActive, false)} className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
                Starta aktiv challenge
              </button>
            )}
            <ul className="mt-6 space-y-2">
              {eligible.map((e) => {
                const r = state.hundred[e.id]?.reps ?? HUNDRED_START_REPS;
                const p = challengePlan(r);
                const t = planTotal(p);
                const pct = Math.min(100, Math.round((t / HUNDRED_GOAL) * 100));
                const isActive = savedActive === e.id;
                return (
                  <li key={e.id}>
                    <button onClick={() => start(e.id)} className={`w-full rounded-2xl bg-card p-4 text-left ring-1 transition active:scale-[0.99] ${isActive ? "ring-primary/50" : "ring-border/60"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{e.name}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          {isActive ? "Aktiv" : "Välj"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{p.join(" + ")}</p>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
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
          <ChallengeSetView active={active} plan={plan} setIndex={setIndex} total={total} currentReps={currentReps} restDuration={restDuration} onComplete={completeSet} onChangeChallenge={chooseChallenge} />
        )}

        {phase === "rest" && active && (
          <main className="flex min-h-[70vh] flex-col justify-center">
            <section className="rounded-[2rem] bg-card p-7 text-center ring-1 ring-border/60">
              <div className="flex items-center justify-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vila</p>
                <button onClick={toggleSound} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.98]" aria-label={state.sound.enabled ? "Stäng av ljud" : "Slå på ljud"}>
                  {state.sound.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
              <button onClick={skipRest} className="relative mx-auto mt-5 flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-secondary ring-8 ring-primary/20 active:scale-[0.98]" aria-label="Avsluta vilan och gå vidare">
                <span className="absolute bottom-0 left-0 right-0 bg-primary/25 transition-all duration-300 ease-linear" style={{ height: `${restProgressPct}%` }} />
                <div className="relative z-10">
                  <p className="text-6xl font-semibold leading-none tracking-tight">{restSeconds}</p>
                  <p className="mt-1 text-sm text-muted-foreground">sek kvar</p>
                </div>
              </button>
              <p className="mt-3 text-xs text-muted-foreground">Tryck på timern för att gå vidare direkt.</p>
              <p className="mt-6 text-sm text-muted-foreground">Nästa</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{active.name} · Set {nextSet} av 3</p>
            </section>
          </main>
        )}

        {phase === "rate" && active && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Hur kändes det?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nästa gång justeras basnivån och appen räknar fram nya tre set.
            </p>
            <div className="mt-6 space-y-3">
              {([
                { id: "latt", label: "Lätt", hint: "+2 i basnivå" },
                { id: "medel", label: "Medel", hint: "+1 i basnivå" },
                { id: "svart", label: "Svårt", hint: "Samma nivå nästa gång" },
                { id: "misslyckat", label: "Klarade inte", hint: "-2 i basnivå" },
              ] as const).map((opt) => (
                <button key={opt.id} onClick={() => rate(opt.id)} className="w-full rounded-2xl bg-card p-5 text-left ring-1 ring-border/60 active:scale-[0.99]">
                  <p className="text-lg font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </button>
              ))}
            </div>
            <p className="mt-4 rounded-2xl bg-secondary/60 p-4 text-xs text-muted-foreground">
              Målet är totalt 100 reps i formatet igång + toppset + back-off. Lätt/medel ökar, svårt står still och klarade inte sänker.
            </p>
          </>
        )}

        {phase === "done" && active && result && (
          <section className="rounded-3xl bg-card p-7 text-center ring-1 ring-border/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Sparat</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {active.name} · {result.attempt.total} reps · {feedbackHint(result.feedback)}
            </p>
            <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm font-medium text-secondary-foreground">Nästa gång: {result.nextPlan.join(" + ")} reps</p>
            <button onClick={() => start(active.id, false, result.nextBaseReps)} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
              <RotateCcw className="h-4 w-4" /> Kör igen
            </button>
            <button onClick={chooseChallenge} className="mt-3 h-12 w-full rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]">
              Byt challenge
            </button>
            <Link to="/" className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]">
              Till startsidan
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

function ChallengeSetView({ active, plan, setIndex, total, currentReps, restDuration, onComplete, onChangeChallenge }: { active: Exercise; plan: number[]; setIndex: number; total: number; currentReps: number; restDuration: number; onComplete: () => void; onChangeChallenge: () => void }) {
  const imageSrc = EXERCISE_IMAGES[active.id];

  return (
    <main>
      <section className="rounded-3xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Aktiv challenge</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{active.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onChangeChallenge} className="rounded-full bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground active:scale-[0.98]">
              Byt
            </button>
            <Link to="/exercise/$exerciseId" params={{ exerciseId: active.id }} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground active:scale-[0.98]" aria-label="Visa övningsdetaljer">
              <Info className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {plan.map((setReps, index) => (
            <span key={index} className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold ${index < setIndex ? "bg-primary text-primary-foreground" : index === setIndex ? "bg-primary/20 text-primary ring-2 ring-primary/25" : "bg-secondary text-muted-foreground"}`}>
              {index < setIndex ? "✓" : setReps}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[2rem] bg-card p-5 ring-1 ring-border/60">
        <div className="grid grid-cols-[1fr_112px] gap-4">
          <div>
            <p className="inline-flex rounded-2xl bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Gör nu</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-lg font-medium text-muted-foreground">Set {setIndex + 1} av 3</p>
              <button onClick={onComplete} className="flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm active:scale-[0.99]">
                <Check className="h-4 w-4" /> Klar
              </button>
            </div>
            <div className="mt-3 rounded-[1.25rem] bg-secondary/60 px-4 py-5">
              <p className="text-5xl font-semibold leading-none tracking-tight">{currentReps}</p>
              <p className="mt-2 text-sm text-muted-foreground">reps · totalt {total}</p>
            </div>
            {setIndex < 2 ? <p className="mt-3 text-xs font-medium text-primary">Efter Klar: vila {restDuration} sek</p> : <p className="mt-3 text-xs font-medium text-primary">Efter Klar: feedback och sparning</p>}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] bg-secondary/45 p-1 ring-1 ring-border/40">
              {imageSrc ? <img src={imageSrc} alt={active.name} className="h-full w-full rounded-[1.25rem] object-contain" loading="lazy" /> : <div className="text-4xl font-semibold text-primary">{active.name.slice(0, 1)}</div>}
            </div>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{active.instruction}</p>
      </section>
    </main>
  );
}
