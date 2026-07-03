import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Flame, Hand, LogIn, Plus, Users } from "lucide-react";
import { signInWithGoogle, useAuthState } from "@/lib/auth";
import { createSharedStreak, currentTurnLabel, loadMySharedStreak, type SharedStreak } from "@/lib/sharedStreaks";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/streak")({
  head: () => ({ meta: [{ title: `Streak tillsammans — ${APP_NAME}` }] }),
  component: StreakPage,
});

function StreakPage() {
  const auth = useAuthState();
  const [streak, setStreak] = useState<SharedStreak | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.configured || !auth.user) return;
    let mounted = true;
    async function load() {
      setLoadingStreak(true);
      setMessage(null);
      try {
        const result = await loadMySharedStreak();
        if (mounted) setStreak(result);
      } catch (error) {
        if (mounted) setMessage(error instanceof Error ? error.message : "Kunde inte ladda streak.");
      } finally {
        if (mounted) setLoadingStreak(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [auth.configured, auth.user]);

  async function login() {
    await signInWithGoogle();
  }

  async function create() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await createSharedStreak();
      setStreak(result);
      setMessage("Streak skapad. Dela koden med din träningskompis.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunde inte skapa streak.");
    } finally {
      setBusy(false);
    }
  }

  const turnLabel = streak && auth.user ? currentTurnLabel(streak, auth.user.id) : "Bollen visas när streaken är skapad.";
  const memberCount = streak?.members.filter((member) => member.status === "active").length ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Streak tillsammans</p>
          <div className="w-9" />
        </header>

        <section className="rounded-3xl bg-card p-6 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Flame className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Gemensam streak</p>
              <h1 className="mt-1 text-6xl font-semibold tracking-tight">{streak?.streak_count ?? 0}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Gör Dagens 3 varannan gång och håll streaken vid liv tillsammans.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Hand className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Bollen</p>
              <p className="mt-1 text-sm text-muted-foreground">{turnLabel}</p>
            </div>
          </div>
        </section>

        {!auth.configured && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Supabase saknas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Streak tillsammans behöver Supabase och Google-login innan den kan användas på riktigt.
            </p>
          </section>
        )}

        {auth.configured && auth.loading && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">Laddar konto...</p>
          </section>
        )}

        {auth.configured && !auth.loading && !auth.user && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Logga in för att skapa streak</p>
            <p className="mt-1 text-sm text-muted-foreground">Streaken sparas per konto och kan delas med en annan användare.</p>
            <button onClick={login} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
              <LogIn className="h-4 w-4" /> Logga in med Google
            </button>
          </section>
        )}

        {auth.configured && auth.user && !loadingStreak && !streak && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Skapa gemensam streak</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Du får en kod att dela. I första versionen blir bollen din direkt.
            </p>
            <button disabled={busy} onClick={create} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99] disabled:opacity-60">
              <Plus className="h-4 w-4" /> Skapa streak
            </button>
          </section>
        )}

        {auth.configured && auth.user && loadingStreak && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">Laddar streak...</p>
          </section>
        )}

        {streak && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{streak.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{memberCount} medlem{memberCount === 1 ? "" : "mar"}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Inbjudningskod</p>
                <p className="mt-1 rounded-2xl bg-secondary px-4 py-3 text-center text-2xl font-semibold tracking-[0.2em] text-secondary-foreground">{streak.invite_code}</p>
              </div>
            </div>
          </section>
        )}

        {message && <p className="mt-4 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">{message}</p>}

        <Link to="/workout" search={{ mode: "dagens3" }} className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
          Gör Dagens 3
        </Link>
      </div>
    </div>
  );
}
