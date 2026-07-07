import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Flame, Hand, LogIn, Plus, RefreshCw, Share2, UserPlus, Users } from "lucide-react";
import { signInWithGoogle, useAuthState } from "@/lib/auth";
import { buildJoinUrl } from "@/lib/inviteLinks";
import { createSharedStreak, currentTurnLabel, joinSharedStreak, loadMySharedStreak, type SharedStreak } from "@/lib/sharedStreaks";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/streak")({
  head: () => ({ meta: [{ title: `Streak tillsammans — ${APP_NAME}` }] }),
  component: StreakPage,
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function StreakPage() {
  const auth = useAuthState();
  const [streak, setStreak] = useState<SharedStreak | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [copyNote, setCopyNote] = useState<string | null>(null);

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
        console.error("[streak-page] loadMySharedStreak failed", error);
        if (mounted) setMessage(`Kunde inte ladda streak.\nTekniskt fel: ${errorMessage(error, "Okänt fel vid laddning.")}`);
      } finally {
        if (mounted) setLoadingStreak(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [auth.configured, auth.user, reloadNonce]);

  async function login() {
    await signInWithGoogle();
  }

  async function create() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await createSharedStreak();
      setStreak(result);
      setMessage("Streak skapad. Dela inbjudan med din träningskompis.");
    } catch (error) {
      console.error("[streak-page] createSharedStreak failed", error);
      setMessage(`Kunde inte skapa streak.\nTekniskt fel: ${errorMessage(error, "Okänt fel vid skapande.")}`);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await joinSharedStreak(joinCode);
      setStreak(result);
      setJoinCode("");
      setMessage("Du gick med i streaken.");
    } catch (error) {
      console.error("[streak-page] joinSharedStreak failed", error);
      setMessage(`Kunde inte gå med i streak.\nTekniskt fel: ${errorMessage(error, "Okänt fel vid gå-med.")}`);
    } finally {
      setBusy(false);
    }
  }

  const turnLabel = streak && auth.user ? currentTurnLabel(streak, auth.user.id) : "Bollen visas när streaken är skapad.";
  const activeMembers = streak?.members.filter((member) => member.status === "active") ?? [];
  const memberCount = activeMembers.length;

  const shareUrl = streak ? buildJoinUrl(streak.invite_code) : "";
  const shareText = streak
    ? `Gå med i vår Vardagsstyrka-streak:\n${shareUrl}\n\nKod: ${streak.invite_code}`
    : "";

  async function copyText(text: string, note: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote(note);
      setTimeout(() => setCopyNote(null), 2000);
    } catch {
      setCopyNote("Kunde inte kopiera.");
    }
  }

  async function shareInvite() {
    if (!streak) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Vardagsstyrka streak", text: shareText, url: shareUrl });
        return;
      } catch {
        // fall through to copy
      }
    }
    await copyText(shareText, "Inbjudan kopierad");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Streak tillsammans</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{APP_VERSION}</p>
          </div>
          <button
            type="button"
            onClick={() => setReloadNonce((value) => value + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-60"
            disabled={loadingStreak || busy || !auth.user}
            aria-label="Ladda om streak"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
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
              Du får en kod att dela. Bollen hamnar hos dig direkt.
            </p>
            <button disabled={busy} onClick={create} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99] disabled:opacity-60">
              <Plus className="h-4 w-4" /> Skapa streak
            </button>
          </section>
        )}

        {auth.configured && auth.user && !loadingStreak && !streak && (
          <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Gå med med kod</p>
            <p className="mt-1 text-sm text-muted-foreground">Skriv in koden du fått av din träningskompis.</p>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              className="mt-4 h-12 w-full rounded-2xl bg-secondary px-4 text-center text-lg font-semibold uppercase tracking-[0.18em] text-secondary-foreground outline-none ring-1 ring-border/60 focus:ring-primary/50"
              maxLength={12}
            />
            <button disabled={busy || joinCode.trim().length < 4} onClick={join} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99] disabled:opacity-60">
              <UserPlus className="h-4 w-4" /> Gå med
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
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{streak.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{memberCount} medlem{memberCount === 1 ? "" : "mar"}</p>
                <ul className="mt-3 space-y-1.5">
                  {activeMembers.map((member) => (
                    <li key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2 text-sm">
                      <span className="truncate">{member.display_name ?? "Medlem"}</span>
                      {member.user_id === streak.current_turn_user_id && <span className="shrink-0 text-xs font-medium text-primary">Bollen</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Inbjudningskod</p>
                <p className="mt-1 rounded-2xl bg-secondary px-4 py-3 text-center text-2xl font-semibold tracking-[0.2em] text-secondary-foreground">{streak.invite_code}</p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={shareInvite}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground active:scale-[0.99]"
                  >
                    <Share2 className="h-4 w-4" /> Dela inbjudan
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(streak.invite_code, "Kod kopierad")}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground active:scale-[0.99]"
                  >
                    <Copy className="h-4 w-4" /> Kopiera kod
                  </button>
                  {copyNote && <p className="text-center text-xs text-muted-foreground">{copyNote}</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {message && (
          <section className="mt-4 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">
            <p className="whitespace-pre-line break-words">{message}</p>
            {auth.user && (
              <button
                type="button"
                disabled={loadingStreak || busy}
                onClick={() => setReloadNonce((value) => value + 1)}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-card text-sm font-medium text-foreground disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" /> Försök ladda igen
              </button>
            )}
          </section>
        )}

        <Link to="/workout" search={{ mode: "dagens3" }} className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
          Gör Dagens 3
        </Link>
      </div>
    </div>
  );
}
