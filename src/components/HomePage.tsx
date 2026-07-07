import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Flame, Target, Hash, BarChart3, Settings, User, Users } from "lucide-react";
import { useAuthState } from "@/lib/auth";
import { useAppState, computeStreak, weekCount, todayISO } from "@/lib/storage";
import { exerciseDose, intensityLabel, pickDailyThree } from "@/lib/exercises";
import { currentTurnLabel, isMyTurn, loadMySharedStreaks, type SharedStreak } from "@/lib/sharedStreaks";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export function HomePage() {
  const [state] = useAppState();
  const auth = useAuthState();
  const [sharedStreaks, setSharedStreaks] = useState<SharedStreak[]>([]);
  const [loadingSharedStreaks, setLoadingSharedStreaks] = useState(false);
  const today = todayISO();
  const daily = pickDailyThree(today, state.preferences);
  const streak = computeStreak(state.completedDates);
  const week = weekCount(state.completedDates);
  const goal = 3;
  const favorites = state.preferences.favoriteIds.length;
  const hidden = state.preferences.blockedIds.length;
  const dailyDoneToday = state.sessions.some((session) => session.date === today && session.mode === "dagens3");

  useEffect(() => {
    if (!auth.configured || !auth.user) {
      setSharedStreaks([]);
      return;
    }

    let mounted = true;
    async function loadShared() {
      setLoadingSharedStreaks(true);
      try {
        const result = await loadMySharedStreaks();
        if (mounted) setSharedStreaks(result);
      } catch (error) {
        console.error("[home] loadMySharedStreaks failed", error);
        if (mounted) setSharedStreaks([]);
      } finally {
        if (mounted) setLoadingSharedStreaks(false);
      }
    }

    void loadShared();
    return () => {
      mounted = false;
    };
  }, [auth.configured, auth.user]);

  const primarySharedStreak = sharedStreaks[0] ?? null;
  const myTurnCount = auth.user ? sharedStreaks.filter((item) => isMyTurn(item, auth.user!.id)).length : 0;
  const sharedStreakCount = sharedStreaks.length;
  const sharedTitle = primarySharedStreak
    ? `${primarySharedStreak.streak_count} i streak`
    : auth.user
      ? "Skapa streak"
      : "Träna tillsammans";
  const sharedDescription = primarySharedStreak && auth.user
    ? myTurnCount > 1
      ? `Din tur i ${myTurnCount} streaks. Ett Dagens 3 räcker för alla.`
      : currentTurnLabel(primarySharedStreak, auth.user.id)
    : auth.user
      ? "Skapa en egen streak eller dela med en träningskompis."
      : "Logga in och håll igång med någon annan — eller med dig själv.";
  const sharedMeta = primarySharedStreak
    ? `${sharedStreakCount} aktiv ${sharedStreakCount === 1 ? "streak" : "streaks"} · ${primarySharedStreak.members.length} medlem${primarySharedStreak.members.length === 1 ? "" : "mar"}`
    : loadingSharedStreaks
      ? "Laddar streak..."
      : "Gemensam eller egen streak";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{APP_NAME}</p>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{APP_VERSION}</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Små steg idag?</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
            <Flame className="h-4 w-4 text-primary" />
            <span className="font-medium">{streak}</span>
            <span className="text-muted-foreground">dagar</span>
          </div>
        </header>

        <Link to="/streak" className="mb-4 block rounded-3xl bg-card p-5 shadow-sm ring-1 ring-primary/20 transition active:scale-[0.99]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Streak tillsammans</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">{sharedTitle}</h2>
                </div>
                {primarySharedStreak && myTurnCount > 0 && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">Din tur</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{sharedDescription}</p>
              <p className="mt-2 text-xs text-muted-foreground">{sharedMeta}</p>
              <span className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground">
                Öppna streak
              </span>
            </div>
          </div>
        </Link>

        <section className={`mb-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ${dailyDoneToday ? "ring-primary/30" : "ring-border/60"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Idag · {intensityLabel(state.intensity)} · 2–10 min</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Dagens 3</h2>
            </div>
            {dailyDoneToday && (
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium">
                <CheckCircle2 className="h-4 w-4" /> Klart
              </div>
            )}
          </div>
          {dailyDoneToday && (
            <p className="mt-3 rounded-2xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Klart idag. Du kan göra passet igen.
            </p>
          )}
          <ul className="mt-3 space-y-1.5">
            {daily.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary-foreground/80">{i + 1}</span>
                <span className="truncate">{e.name}</span>
                <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{exerciseDose(e, state.intensity)}</span>
              </li>
            ))}
          </ul>
          <Link to="/workout" search={{ mode: "dagens3" }} className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-medium text-primary-foreground shadow-sm transition active:scale-[0.99]">
            Dagens 3
          </Link>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/workout" search={{ mode: "halvt" }} className="group rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]">
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Litet blandpass</p>
            <p className="text-xs text-muted-foreground">ca 10 övningar · {intensityLabel(state.intensity).toLowerCase()}</p>
          </Link>
          <Link to="/workout" search={{ mode: "stort" }} className="group rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]">
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Stort blandpass</p>
            <p className="text-xs text-muted-foreground">ca 20 övningar · {intensityLabel(state.intensity).toLowerCase()}</p>
          </Link>
          <Link to="/hundred" className="group col-span-2 rounded-2xl bg-card p-4 ring-1 ring-border/60 transition active:scale-[0.99]">
            <Hash className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">100 challenge</p>
            <p className="text-xs text-muted-foreground">Bygg mot 100 reps</p>
          </Link>
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Veckans mål</p>
              <p className="mt-1 text-lg font-medium">{week} / {goal} pass</p>
            </div>
            <p className="text-xs text-muted-foreground">Mån–sön</p>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: goal }).map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < week ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link to="/stats" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]">
              <BarChart3 className="h-4 w-4" /> Statistik
            </Link>
            <Link to="/settings" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]">
              <Settings className="h-4 w-4" /> Inställningar
            </Link>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Appen är anpassad</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Nivå {intensityLabel(state.intensity).toLowerCase()}. Påminnelse {state.reminder.enabled ? `på ${state.reminder.time}` : "av"}. {favorites} favoriter och {hidden} dolda övningar.
          </p>
          <Link to="/account" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]">
            <User className="h-4 w-4" /> Konto
          </Link>
        </section>

        <p className="mt-8 text-center text-xs text-muted-foreground">Små steg. Starkare varje dag.</p>
      </div>
    </div>
  );
}
