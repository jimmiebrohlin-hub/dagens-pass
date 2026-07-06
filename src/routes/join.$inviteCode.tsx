import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { signInAnonymously, signInWithGoogle, useAuthState } from "@/lib/auth";
import { joinSharedStreak } from "@/lib/sharedStreaks";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/join/$inviteCode")({
  head: () => ({ meta: [{ title: `Gå med i streak — ${APP_NAME}` }] }),
  component: JoinPage,
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function JoinPage() {
  const { inviteCode } = Route.useParams();
  const auth = useAuthState();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("Förbereder...");
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.loading) return;
    let cancelled = false;

    async function run() {
      setError(null);
      try {
        if (!auth.user) {
          setStatus("Skapar tillfälligt konto...");
          const { error: anonError } = await signInAnonymously();
          if (cancelled) return;
          if (anonError) {
            setNeedsLogin(true);
            setStatus("Logga in för att gå med i streaken");
            return;
          }
          // wait for auth state to update; next effect run will proceed
          return;
        }
        setStatus("Går med i streaken...");
        await joinSharedStreak(inviteCode);
        if (cancelled) return;
        navigate({ to: "/streak" });
      } catch (err) {
        if (cancelled) return;
        const msg = errorMessage(err, "Okänt fel.");
        if (msg.includes("hittades inte")) {
          setError("Koden hittades inte.");
        } else {
          setError(`Kunde inte gå med.\nTekniskt fel: ${msg}`);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [auth.loading, auth.user, inviteCode, navigate]);

  async function loginGoogle() {
    setBusy(true);
    try {
      // store the code so /streak or a callback could pick it up; the invite is in URL anyway
      sessionStorage.setItem("pending_invite_code", inviteCode);
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-10">
        <header className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inbjudan</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Gå med i streak</h1>
          <p className="mt-2 text-sm text-muted-foreground">Kod: <span className="font-semibold tracking-[0.18em]">{inviteCode}</span></p>
        </header>

        {!error && !needsLogin && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">{status}</p>
          </section>
        )}

        {needsLogin && !error && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Logga in för att gå med i streaken</p>
            <p className="mt-1 text-sm text-muted-foreground">Efter inloggning används koden {inviteCode} automatiskt.</p>
            <button
              disabled={busy}
              onClick={loginGoogle}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" /> Logga in med Google
            </button>
          </section>
        )}

        {error && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="whitespace-pre-line text-sm text-muted-foreground">{error}</p>
          </section>
        )}
      </div>
    </div>
  );
}