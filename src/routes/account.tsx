import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, DownloadCloud, LogIn, LogOut, Mail, Shield, UploadCloud } from "lucide-react";
import { signInWithGoogle, signOut, useAuthState } from "@/lib/auth";
import { downloadCloudDataToLocal, uploadLocalDataToCloud } from "@/lib/cloudSync";
import { loadNotificationPreferences, saveStreakEmailEnabled } from "@/lib/notificationPreferences";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: `Konto — ${APP_NAME}` }] }),
  component: AccountPage,
});

function AccountPage() {
  const auth = useAuthState();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailPreferenceAvailable, setEmailPreferenceAvailable] = useState(false);
  const [emailPreferenceLoading, setEmailPreferenceLoading] = useState(false);
  const [emailPreferenceStatus, setEmailPreferenceStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user) {
      setEmailPreferenceAvailable(false);
      setEmailPreferenceStatus(null);
      return;
    }

    let alive = true;
    async function loadPreference() {
      setEmailPreferenceLoading(true);
      try {
        const result = await loadNotificationPreferences();
        if (!alive) return;
        setEmailEnabled(result.streakEmailEnabled);
        setEmailPreferenceAvailable(result.available);
        if (!result.available) setEmailPreferenceStatus("Inställningen aktiveras när nästa Supabase-migration är körd.");
      } catch (error) {
        if (!alive) return;
        setEmailPreferenceStatus(error instanceof Error ? error.message : "Kunde inte ladda notifieringsinställningen.");
      } finally {
        if (alive) setEmailPreferenceLoading(false);
      }
    }

    void loadPreference();
    return () => {
      alive = false;
    };
  }, [auth.user]);

  async function login() {
    await signInWithGoogle();
  }

  async function logout() {
    await signOut();
    setSyncStatus("Du är utloggad. Logga in igen för att välja Google-konto.");
  }

  async function upload() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const result = await uploadLocalDataToCloud();
      setSyncStatus(`Uppladdat: ${result.sessions} pass och ${result.challenges} challenge-rader.`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Kunde inte ladda upp data.");
    } finally {
      setSyncing(false);
    }
  }

  async function download() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const result = await downloadCloudDataToLocal();
      setSyncStatus(`Hämtat: ${result.sessions.length} pass från molnet.`);
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Kunde inte hämta data.");
    } finally {
      setSyncing(false);
    }
  }

  async function toggleStreakEmail() {
    if (!emailPreferenceAvailable || emailPreferenceLoading) return;
    const next = !emailEnabled;
    setEmailPreferenceLoading(true);
    setEmailPreferenceStatus(null);
    try {
      await saveStreakEmailEnabled(next);
      setEmailEnabled(next);
      setEmailPreferenceStatus(next ? "Mejlnotiser är på." : "Mejlnotiser är av.");
    } catch (error) {
      setEmailPreferenceStatus(error instanceof Error ? error.message : "Kunde inte spara inställningen.");
    } finally {
      setEmailPreferenceLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Konto</p>
          <div className="w-9" />
        </header>

        <section className="rounded-3xl bg-card p-6 ring-1 ring-border/60">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Personligt konto</h1>
              <p className="mt-2 text-sm text-muted-foreground">Konto sparar pass, challenge-progress, streak och inställningar per användare.</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          {!auth.configured ? (
            <>
              <p className="text-sm font-medium">Supabase saknas</p>
              <p className="mt-1 text-sm text-muted-foreground">Konfigurera Supabase och Google-login för att använda konto.</p>
            </>
          ) : auth.loading ? (
            <p className="text-sm text-muted-foreground">Laddar konto...</p>
          ) : auth.user ? (
            <>
              <p className="text-sm font-medium">Inloggad</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{auth.user.email}</p>
              <button onClick={logout} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary text-base font-medium text-secondary-foreground active:scale-[0.99]">
                <LogOut className="h-4 w-4" /> Logga ut
              </button>
              <p className="mt-3 text-xs text-muted-foreground">För att byta konto: logga ut och välj sedan ett annat Google-konto.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Logga in</p>
              <p className="mt-1 text-sm text-muted-foreground">Google-login öppnas med kontoval.</p>
              <button onClick={login} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
                <LogIn className="h-4 w-4" /> Logga in med Google
              </button>
            </>
          )}
        </section>

        {auth.configured && auth.user && (
          <>
            <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Streaknotiser</p>
                      <p className="mt-1 text-xs text-muted-foreground">Mejla mig när någon skickar bollen till mig.</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailEnabled}
                      aria-label="Mejlnotiser för streak"
                      disabled={!emailPreferenceAvailable || emailPreferenceLoading}
                      onClick={toggleStreakEmail}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${emailEnabled ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow-sm transition-all ${emailEnabled ? "left-6" : "left-1"}`} />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Vi skickar bara vid en riktig bollöverlämning. Min streak och extra Dagens 3 skickar inget mejl.</p>
                </div>
              </div>
              {emailPreferenceStatus && <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">{emailPreferenceStatus}</p>}
            </section>

            <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <p className="text-sm font-medium">Molnsynk</p>
              <p className="mt-1 text-sm text-muted-foreground">Automatisk synk är på. Appen synkar vid inloggning och efter lokala ändringar.</p>
              <details className="mt-4 rounded-2xl bg-secondary/60 p-3">
                <summary className="cursor-pointer text-sm font-medium">Avancerat / manuell backup</summary>
                <p className="mt-2 text-xs text-muted-foreground">Använd bara detta om synken verkar fel eller om du vill göra en manuell säkerhetskopia.</p>
                <div className="mt-3 grid gap-2">
                  <button disabled={syncing} onClick={upload} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-card text-sm font-medium text-foreground active:scale-[0.99] disabled:opacity-60">
                    <UploadCloud className="h-4 w-4" /> Spara lokal data i molnet
                  </button>
                  <button disabled={syncing} onClick={download} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-card text-sm font-medium text-foreground active:scale-[0.99] disabled:opacity-60">
                    <DownloadCloud className="h-4 w-4" /> Hämta molndata till appen
                  </button>
                </div>
              </details>
              {syncStatus && <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">{syncStatus}</p>}
            </section>
          </>
        )}

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Status</p>
          <p className="mt-1 text-sm text-muted-foreground">Lokal data sparas direkt och synkas automatiskt när du är inloggad. Streak ligger alltid direkt i molnet.</p>
        </section>
      </div>
    </div>
  );
}
