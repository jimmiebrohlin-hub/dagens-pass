import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LogIn, LogOut, Shield } from "lucide-react";
import { signInWithGoogle, signOut, useAuthState } from "@/lib/auth";
import { APP_NAME } from "@/lib/version";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: `Konto — ${APP_NAME}` }] }),
  component: AccountPage,
});

function AccountPage() {
  const auth = useAuthState();

  async function login() {
    await signInWithGoogle();
  }

  async function logout() {
    await signOut();
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
              <p className="mt-2 text-sm text-muted-foreground">
                Konto gör det möjligt att spara pass, challenge-progress och inställningar per användare senare.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          {!auth.configured ? (
            <>
              <p className="text-sm font-medium">Supabase saknas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Lägg till VITE_SUPABASE_URL och VITE_SUPABASE_ANON_KEY i miljön, och aktivera Google-provider i Supabase.
              </p>
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
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Logga in</p>
              <p className="mt-1 text-sm text-muted-foreground">Google-login är förberett. När Supabase är konfigurerat skickas du vidare till Google.</p>
              <button onClick={login} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
                <LogIn className="h-4 w-4" /> Logga in med Google
              </button>
            </>
          )}
        </section>

        <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
          <p className="text-sm font-medium">Nästa datasteg</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Just nu sparas träningsdata fortfarande lokalt. Nästa steg är att koppla appData-lagret till Supabase-tabeller per user_id.
          </p>
        </section>
      </div>
    </div>
  );
}
