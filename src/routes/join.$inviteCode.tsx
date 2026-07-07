import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LogIn, RefreshCw, UserPlus } from "lucide-react";
import { signInWithGoogle, signOut, useAuthState } from "@/lib/auth";
import { clearPendingInvite, normalizeInviteCode, rememberPendingInvite } from "@/lib/inviteLinks";
import { joinSharedStreak, loadMySharedStreaks, type SharedStreak } from "@/lib/sharedStreaks";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/join/$inviteCode")({
  head: () => ({ meta: [{ title: `Gå med i streak — ${APP_NAME}` }] }),
  component: JoinPage,
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type JoinMode = "checking" | "needs-login" | "ready" | "already-member" | "joining" | "error";

function userLabel(user: ReturnType<typeof useAuthState>["user"]) {
  if (!user) return "detta konto";
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  return fullName || name || user.email || "detta konto";
}

function JoinPage() {
  const { inviteCode } = Route.useParams();
  const normalizedInviteCode = normalizeInviteCode(inviteCode);
  const auth = useAuthState();
  const navigate = useNavigate();
  const [mode, setMode] = useState<JoinMode>("checking");
  const [matchingStreak, setMatchingStreak] = useState<SharedStreak | null>(null);
  const [status, setStatus] = useState<string>("Förbereder inbjudan...");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    rememberPendingInvite(normalizedInviteCode);
  }, [normalizedInviteCode]);

  useEffect(() => {
    if (auth.loading) return;
    let cancelled = false;

    async function checkInviteState() {
      setError(null);
      setMatchingStreak(null);

      if (!auth.user) {
        setMode("needs-login");
        setStatus("Logga in med rätt Google-konto för att gå med i streaken.");
        return;
      }

      setMode("checking");
      setStatus("Kontrollerar konto och inbjudan...");

      try {
        const existingStreaks = await loadMySharedStreaks();
        if (cancelled) return;
        const matching = existingStreaks.find((streak) => normalizeInviteCode(streak.invite_code) === normalizedInviteCode) ?? null;
        setMatchingStreak(matching);
        if (matching) {
          setMode("already-member");
          setStatus("Du är redan medlem i denna streak.");
          return;
        }
        setMode("ready");
        setStatus("Välj om du vill gå med med nuvarande konto eller byta konto först.");
      } catch (err) {
        if (cancelled) return;
        console.error("[join-page] loadMySharedStreaks failed", err);
        setMode("ready");
        setStatus("Välj om du vill gå med med nuvarande konto eller byta konto först.");
      }
    }

    void checkInviteState();
    return () => {
      cancelled = true;
    };
  }, [auth.loading, auth.user, normalizedInviteCode]);

  async function loginGoogle() {
    setBusy(true);
    setError(null);
    rememberPendingInvite(normalizedInviteCode);
    try {
      await signInWithGoogle({ redirectPath: `/join/${normalizedInviteCode}` });
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true);
    setError(null);
    rememberPendingInvite(normalizedInviteCode);
    try {
      await signOut();
      await signInWithGoogle({ redirectPath: `/join/${normalizedInviteCode}` });
    } catch (err) {
      console.error("[join-page] switch account failed", err);
      setError(`Kunde inte byta konto.\nTekniskt fel: ${errorMessage(err, "Okänt fel vid kontobyte.")}`);
      setMode("error");
    } finally {
      setBusy(false);
    }
  }

  async function joinAsCurrentUser() {
    setBusy(true);
    setError(null);
    setMode("joining");
    setStatus("Går med i streaken...");
    try {
      await joinSharedStreak(normalizedInviteCode);
      clearPendingInvite();
      navigate({ to: "/streak" });
    } catch (err) {
      console.error("[join-page] joinSharedStreak failed", err);
      const msg = errorMessage(err, "Okänt fel.");
      if (msg.includes("hittades inte")) {
        setError("Koden hittades inte.");
      } else if (msg.includes("redan två medlemmar")) {
        setError("Den här streaken har redan två medlemmar.");
      } else {
        setError(`Kunde inte gå med.\nTekniskt fel: ${msg}`);
      }
      setMode("error");
    } finally {
      setBusy(false);
    }
  }

  const currentUserLabel = userLabel(auth.user);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inbjudan</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{APP_VERSION}</p>
          </div>
          <span className="h-9 w-9" />
        </header>

        <section className="rounded-3xl bg-card p-6 text-center ring-1 ring-border/60">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vardagsstyrka</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Du har fått en streak-inbjudan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kod <span className="font-semibold tracking-[0.16em] text-foreground">{normalizedInviteCode}</span>
          </p>
        </section>

        {(mode === "checking" || mode === "joining") && !error && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">{status}</p>
          </section>
        )}

        {mode === "needs-login" && !error && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Logga in för att gå med</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Välj det Google-konto som ska vara medlem i streaken. Koden används automatiskt efter inloggning.
            </p>
            <button disabled={busy} onClick={loginGoogle} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99] disabled:opacity-60">
              <LogIn className="h-4 w-4" /> Fortsätt med Google
            </button>
          </section>
        )}

        {mode === "ready" && !error && auth.user && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Du är inloggad som {currentUserLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">Kontrollera att detta är kontot som ska gå med. En streak kan ha max två personer.</p>
            <div className="mt-4 grid gap-2">
              <button disabled={busy} onClick={joinAsCurrentUser} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99] disabled:opacity-60">
                <UserPlus className="h-4 w-4" /> Gå med som {currentUserLabel}
              </button>
              <button disabled={busy} onClick={switchAccount} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99] disabled:opacity-60">
                <LogIn className="h-4 w-4" /> Byt konto
              </button>
            </div>
          </section>
        )}

        {mode === "already-member" && !error && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Du är redan medlem</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nuvarande konto ({currentUserLabel}) är redan med i {matchingStreak?.name ?? "denna streak"}.
            </p>
            <div className="mt-4 grid gap-2">
              <Link to="/streak" className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
                Öppna streak
              </Link>
              <button disabled={busy} onClick={switchAccount} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99] disabled:opacity-60">
                <LogIn className="h-4 w-4" /> Byt konto
              </button>
            </div>
          </section>
        )}

        {error && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="whitespace-pre-line text-sm text-muted-foreground">{error}</p>
            <div className="mt-4 grid gap-2">
              {auth.user && (
                <button disabled={busy} onClick={joinAsCurrentUser} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground active:scale-[0.99] disabled:opacity-60">
                  <RefreshCw className="h-4 w-4" /> Försök igen
                </button>
              )}
              <button disabled={busy} onClick={auth.user ? switchAccount : loginGoogle} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99] disabled:opacity-60">
                <LogIn className="h-4 w-4" /> {auth.user ? "Byt konto" : "Logga in med Google"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
