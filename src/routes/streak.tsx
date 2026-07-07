import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Flame, LogIn, Plus, RefreshCw, Share2, UserPlus, Users } from "lucide-react";
import { signInWithGoogle, useAuthState } from "@/lib/auth";
import { buildJoinUrl } from "@/lib/inviteLinks";
import { createSharedStreak, currentTurnLabel, isMyTurn, joinSharedStreak, loadMySharedStreaks, type SharedStreak } from "@/lib/sharedStreaks";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/streak")({
  head: () => ({ meta: [{ title: `Streak tillsammans — ${APP_NAME}` }] }),
  component: StreakPage,
});

function errText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function nameOf(value: string | null | undefined) {
  return value?.trim() || "Medlem";
}

function nextHolder(streak: SharedStreak) {
  return nameOf(streak.members.find((member) => member.user_id === streak.current_turn_user_id)?.display_name);
}

function StreakPage() {
  const auth = useAuthState();
  const [streaks, setStreaks] = useState<SharedStreak[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!auth.configured || !auth.user) return;
    let alive = true;
    async function load() {
      setLoading(true);
      setMessage(null);
      try {
        const result = await loadMySharedStreaks();
        if (!alive) return;
        setStreaks(result);
        setSelectedId((current) => (current && result.some((item) => item.id === current) ? current : result[0]?.id ?? null));
      } catch (error) {
        console.error("[streak-page] load failed", error);
        if (alive) setMessage(`Kunde inte ladda streak.\nTekniskt fel: ${errText(error, "Okänt fel.")}`);
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, [auth.configured, auth.user, reload]);

  async function create(name: string) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await createSharedStreak(name);
      setStreaks((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      setSelectedId(result.id);
      setReload((value) => value + 1);
      setMessage(name === "Personlig streak" ? "Personlig streak skapad." : "Streak skapad. Dela inbjudan när du vill.");
    } catch (error) {
      console.error("[streak-page] create failed", error);
      setMessage(`Kunde inte skapa streak.\nTekniskt fel: ${errText(error, "Okänt fel.")}`);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await joinSharedStreak(joinCode);
      setStreaks((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      setSelectedId(result.id);
      setJoinCode("");
      setReload((value) => value + 1);
      setMessage("Du gick med i streaken.");
    } catch (error) {
      console.error("[streak-page] join failed", error);
      setMessage(`Kunde inte gå med i streak.\nTekniskt fel: ${errText(error, "Okänt fel.")}`);
    } finally {
      setBusy(false);
    }
  }

  const selected = streaks.find((item) => item.id === selectedId) ?? streaks[0] ?? null;
  const userId = auth.user?.id;
  const myTurn = userId ? streaks.filter((item) => isMyTurn(item, userId)) : [];
  const waiting = userId ? streaks.filter((item) => !isMyTurn(item, userId)) : streaks;
  const myTurnCount = myTurn.length;
  const selectedMembers = selected?.members.filter((member) => member.status === "active") ?? [];
  const shareUrl = selected ? buildJoinUrl(selected.invite_code) : "";
  const shareText = selected ? `Gå med i vår Vardagsstyrka-streak:\n${shareUrl}\n\nKod: ${selected.invite_code}` : "";

  async function copy(text: string, note: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote(note);
      setTimeout(() => setCopyNote(null), 2000);
    } catch {
      setCopyNote("Kunde inte kopiera.");
    }
  }

  async function share() {
    if (!selected) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vardagsstyrka streak", text: shareText, url: shareUrl });
        return;
      } catch {
        // copy fallback
      }
    }
    await copy(shareText, "Inbjudan kopierad");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="text-center"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Streak tillsammans</p><p className="mt-1 text-[10px] text-muted-foreground">{APP_VERSION}</p></div>
          <button type="button" disabled={loading || busy || !auth.user} onClick={() => setReload((value) => value + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-60" aria-label="Ladda om"><RefreshCw className="h-4 w-4" /></button>
        </header>

        {auth.configured && auth.loading && <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60"><p className="text-sm text-muted-foreground">Laddar konto...</p></section>}
        {auth.configured && !auth.loading && !auth.user && <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60"><p className="text-sm font-medium">Logga in för att använda streak</p><p className="mt-1 text-sm text-muted-foreground">Streak sparas per konto och kan delas med andra.</p><button onClick={() => signInWithGoogle()} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground"><LogIn className="h-4 w-4" /> Logga in med Google</button></section>}
        {auth.user && loading && <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60"><p className="text-sm text-muted-foreground">Laddar streaks...</p></section>}

        {auth.user && !loading && (
          <>
            <section className="rounded-3xl bg-card p-5 ring-1 ring-primary/25">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15"><Flame className="h-6 w-6 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nu</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">{myTurnCount > 0 ? `Din tur i ${myTurnCount} ${myTurnCount === 1 ? "streak" : "streaks"}` : streaks.length > 0 ? "Väntar på någon annan" : "Starta en streak"}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{myTurnCount > 0 ? "Gör Dagens 3 en gång. Under test kan bollen skickas vidare flera gånger samma dag." : streaks.length > 0 ? "Du kan träna ändå, men bollen flyttas bara i streaks där det är din tur." : "Skapa en personlig streak eller bjud in någon."}</p>
                  <Link to="/workout" search={{ mode: "dagens3" }} className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">Gör Dagens 3</Link>
                </div>
              </div>
            </section>

            {streaks.length > 0 && <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Aktiva streaks</p><p className="mt-1 text-xs text-muted-foreground">Tryck på en rad för inbjudan och detaljer.</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{streaks.length}</span></div><div className="mt-3 grid gap-2">{[...myTurn, ...waiting].map((item) => { const active = item.id === selected?.id; const isTurn = userId ? isMyTurn(item, userId) : false; const count = item.members.filter((member) => member.status === "active").length; return <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm ring-1 ${active ? "bg-primary/10 ring-primary/30" : "bg-secondary/60 ring-transparent"}`}><span className="min-w-0"><span className="block truncate font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">{item.streak_count} i streak · {count} medlem{count === 1 ? "" : "mar"}</span></span><span className={`shrink-0 text-xs font-medium ${isTurn ? "text-primary" : "text-muted-foreground"}`}>{isTurn ? "Din tur" : `Väntar på ${nextHolder(item)}`}</span></button>; })}</div></section>}

            <details className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <summary className="cursor-pointer text-sm font-medium">Hantera streaks</summary>
              <p className="mt-2 text-xs text-muted-foreground">Skapa en ny, skapa en personlig eller gå med med kod.</p>
              <div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => create("Vår streak")} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"><Plus className="h-4 w-4" /> Ny</button><button disabled={busy} onClick={() => create("Personlig streak")} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-medium text-secondary-foreground disabled:opacity-60"><Plus className="h-4 w-4" /> Personlig</button></div>
              <div className="mt-3 flex gap-2"><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="KOD" className="h-11 min-w-0 flex-1 rounded-2xl bg-secondary px-4 text-center text-sm font-semibold uppercase tracking-[0.18em] outline-none ring-1 ring-border/60" maxLength={12} /><button disabled={busy || joinCode.trim().length < 4} onClick={join} className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 text-sm font-medium disabled:opacity-60"><UserPlus className="h-4 w-4" /> Gå med</button></div>
            </details>

            {selected && <details open className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60"><summary className="cursor-pointer text-sm font-medium">Detaljer: {selected.name}</summary><ul className="mt-3 space-y-1.5">{selectedMembers.map((member) => <li key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2 text-sm"><span className="truncate">{nameOf(member.display_name)}{member.user_id === auth.user?.id ? " (du)" : ""}</span>{member.user_id === selected.current_turn_user_id && <span className="shrink-0 text-xs font-medium text-primary">Tur</span>}</li>)}</ul><p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Inbjudningskod</p><div className="relative mt-1 rounded-2xl bg-secondary px-4 py-3 pr-12 text-center text-2xl font-semibold tracking-[0.2em]"><span>{selected.invite_code}</span><button type="button" onClick={() => copy(selected.invite_code, "Kod kopierad")} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80" aria-label="Kopiera kod"><Copy className="h-4 w-4" /></button></div><button type="button" onClick={share} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground"><Share2 className="h-4 w-4" /> Dela inbjudan</button>{copyNote && <p className="mt-2 text-center text-xs text-muted-foreground">{copyNote}</p>}</details>}
          </>
        )}

        {message && <section className="mt-4 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground"><p className="whitespace-pre-line break-words">{message}</p></section>}
      </div>
    </div>
  );
}
