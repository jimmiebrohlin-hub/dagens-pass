import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell, Star, EyeOff, Settings, ChevronRight } from "lucide-react";
import { EXERCISES } from "@/lib/exercises";
import { useAppState, updateReminder, toggleFavorite, toggleBlocked } from "@/lib/storage";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: `Inställningar — ${APP_NAME}` }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [state, setState] = useAppState();
  const favorites = state.preferences.favoriteIds.length;
  const blocked = state.preferences.blockedIds.length;

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
            <p className="mt-1 text-sm text-muted-foreground">Påminnelse och vilka övningar som ska prioriteras.</p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
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
