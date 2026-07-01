import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Star, EyeOff, Settings, ChevronRight, Gauge, Volume2 } from "lucide-react";
import { EXERCISES, intensityLabel } from "@/lib/exercises";
import { playTimerDoneCue, unlockTimerSound } from "@/lib/sound";
import { useAppState, updateReminder, toggleFavorite, toggleBlocked, updateIntensity, updateSound, type WorkoutIntensity } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

const INTENSITIES: Array<{ id: WorkoutIntensity; label: string; hint: string }> = [
  { id: "enkel", label: "Enkel", hint: "Ca 25% lättare" },
  { id: "normal", label: "Normal", hint: "Standardnivå" },
  { id: "tuff", label: "Tuff", hint: "Ca 25% mer" },
];

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: `Inställningar — ${APP_NAME}` }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [state, setState] = useAppState();
  const favorites = state.preferences.favoriteIds.length;
  const blocked = state.preferences.blockedIds.length;

  async function testSound() {
    await unlockTimerSound();
    await playTimerDoneCue(state.sound);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inställningar</p>
          <div className="w-9" />
        </header>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
            <Settings className="h-5 w-5 text-primary-foreground/80" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Anpassa appen</h1>
            <p className="mt-1 text-sm text-muted-foreground">Nivå, ljud, påminnelse och vilka övningar som ska prioriteras.</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <Gauge className="h-4 w-4 text-primary-foreground/80" />
            </div>
            <div>
              <p className="text-sm font-medium">Träningsnivå</p>
              <p className="text-xs text-muted-foreground">Nu: {intensityLabel(state.intensity)}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {INTENSITIES.map((option) => (
              <button
                key={option.id}
                onClick={() => setState((s) => updateIntensity(s, option.id))}
                className={`rounded-2xl p-3 text-left active:scale-[0.98] ${
                  state.intensity === option.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                <p className={`mt-0.5 text-[11px] ${state.intensity === option.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{option.hint}</p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Nivån påverkar Dagens 3 och Halvt pass. 100 reps styrs av egen progression.</p>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <Volume2 className="h-4 w-4 text-primary-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Ljud och vibration</p>
                  <p className="text-xs text-muted-foreground">
                    Timer klar: ljud {state.sound.enabled ? "på" : "av"}, vibration {state.sound.vibration ? "på" : "av"}
                  </p>
                </div>
                <button onClick={testSound} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground active:scale-[0.98]">
                  Testa
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setState((s) => updateSound(s, { enabled: !s.sound.enabled }))}
                  className={`rounded-2xl p-3 text-left active:scale-[0.98] ${state.sound.enabled ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  <p className="text-sm font-medium">Ljud</p>
                  <p className={`mt-0.5 text-[11px] ${state.sound.enabled ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{state.sound.enabled ? "På" : "Av"}</p>
                </button>
                <button
                  onClick={() => setState((s) => updateSound(s, { vibration: !s.sound.vibration }))}
                  className={`rounded-2xl p-3 text-left active:scale-[0.98] ${state.sound.vibration ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  <p className="text-sm font-medium">Vibration</p>
                  <p className={`mt-0.5 text-[11px] ${state.sound.vibration ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{state.sound.vibration ? "På" : "Av"}</p>
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">På iPhone behöver ljud ofta aktiveras genom att du trycker i appen först. Test-knappen gör det enklare.</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <Bell className="h-4 w-4 text-primary-foreground/80" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Daglig påminnelse</p>
                  <p className="text-xs text-muted-foreground">
                    {state.reminder.enabled ? `På klockan ${state.reminder.time}` : "Avstängd"}
                  </p>
                </div>
                <button
                  onClick={() => setState((s) => updateReminder(s, { enabled: !s.reminder.enabled }))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                    state.reminder.enabled ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {state.reminder.enabled ? "På" : "Av"}
                </button>
              </div>
              <label className="mt-3 block text-xs text-muted-foreground" htmlFor="reminder-time">Tid</label>
              <input
                id="reminder-time"
                type="time"
                value={state.reminder.time}
                onChange={(event) => setState((s) => updateReminder(s, { time: event.target.value || "08:00" }))}
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none ring-ring transition focus:ring-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">Förberett för riktig notis senare. Just nu sparas inställningen lokalt.</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Övningsval</p>
              <p className="mt-1 text-xs text-muted-foreground">Tryck på en övning för instruktion. Stjärna favoriter eller dölj övningar.</p>
            </div>
            <div className="whitespace-nowrap rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
              {favorites} fav · {blocked} dolda
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {EXERCISES.map((exercise) => {
              const favorite = state.preferences.favoriteIds.includes(exercise.id);
              const hidden = state.preferences.blockedIds.includes(exercise.id);
              return (
                <li key={exercise.id} className="flex items-center gap-2 rounded-2xl bg-secondary/50 p-3">
                  <Link to="/exercise/$exerciseId" params={{ exerciseId: exercise.id }} className="min-w-0 flex flex-1 items-center gap-2 active:scale-[0.99]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exercise.muscleGroup === "lower" ? "Ben/rumpa" : exercise.muscleGroup === "upper" ? "Överkropp" : "Core/rygg"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={() => setState((s) => toggleFavorite(s, exercise.id))}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      favorite ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                    }`}
                    aria-label="Favorit"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setState((s) => toggleBlocked(s, exercise.id))}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      hidden ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
                    }`}
                    aria-label="Dölj"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
