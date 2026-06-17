import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Flame, Target, Hash, Bell } from "lucide-react";
import { useAppState, computeStreak, weekCount, todayISO, updateReminder } from "@/lib/storage";
import { exerciseDose, pickDailyThree } from "@/lib/exercises";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${APP_NAME} — Små steg. Starkare varje dag.` },
      { name: "description", content: "Enkel svensk hemmaträning. Dagens 3 övningar och vägen till 100 reps." },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: "Dagens 3 övningar. Bygg en lugn vana. Nå 100 reps." },
    ],
  }),
  component: Index,
});

function Index() {
  const [state, setState] = useAppState();
  const today = todayISO();
  const daily = pickDailyThree(today);
  const streak = computeStreak(state.completedDates);
  const week = weekCount(state.completedDates);
  const goal = 3;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{APP_NAME}</p>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {APP_VERSION}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Små steg idag?</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-medium">{streak}</span>
            <span className="text-muted-foreground">dagar</span>
          </div>
        </header>

        <section className="mb-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Idag</p>
            <p className="text-xs text-muted-foreground">2–10 min</p>
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Dagens 3</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            En övning för ben, en för överkropp och en för core.
          </p>
          <ul className="mt-4 space-y-2">
            {daily.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 text-[15px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-foreground/80">
                  {i + 1}
                </span>
                <span className="truncate">{e.name}</span>
                <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
                  {exerciseDose(e)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/workout"
            search={{ mode: "dagens3" }}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground shadow-sm transition active:scale-[0.99]"
          >
            Starta dagens 3
          </Link>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/workout"
            search={{ mode: "halvt" }}
            className="group rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]"
          >
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Halvt pass</p>
            <p className="text-xs text-muted-foreground">5 övningar · 2 set</p>
          </Link>
          <Link
            to="/hundred"
            className="group rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]"
          >
            <Hash className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">100 reps</p>
            <p className="text-xs text-muted-foreground">Vägen till 102</p>
          </Link>
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Veckans mål</p>
              <p className="mt-1 text-lg font-medium">
                {week} / {goal} pass
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Mån–sön</p>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: goal }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < week ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
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
                  onClick={() =>
                    setState((s) => updateReminder(s, { enabled: !s.reminder.enabled }))
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                    state.reminder.enabled
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {state.reminder.enabled ? "På" : "Av"}
                </button>
              </div>
              <label className="mt-3 block text-xs text-muted-foreground" htmlFor="reminder-time">
                Tid
              </label>
              <input
                id="reminder-time"
                type="time"
                value={state.reminder.time}
                onChange={(event) =>
                  setState((s) => updateReminder(s, { time: event.target.value || "08:00" }))
                }
                className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm outline-none ring-ring transition focus:ring-2"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Förberett för riktig notis senare. Just nu sparas inställningen lokalt.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Små steg. Starkare varje dag.
        </p>
      </div>
    </div>
  );
}
