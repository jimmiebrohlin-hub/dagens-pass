import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Flame, LogIn, Plus, RefreshCw, Share2, UserPlus } from "lucide-react";
import { signInWithGoogle, useAuthState } from "@/lib/auth";
import { buildJoinUrl } from "@/lib/inviteLinks";
import {
  activeMembers,
  buddyPartnerName,
  createSharedStreak,
  isBuddyStreak,
  isMyTurn,
  isPersonalStreak,
  joinSharedStreak,
  loadMySharedStreaks,
  type SharedStreak,
} from "@/lib/sharedStreaks";
import { APP_NAME, APP_VERSION } from "@/lib/version";

export const Route = createFileRoute("/streak")({
  head: () => ({ meta: [{ title: `Streak — ${APP_NAME}` }] }),
  component: StreakPage,
});

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    try {
      const remote = error as { message?: string; code?: string; details?: string; hint?: string };
      const parts = [
        remote.message,
        remote.code ? `code: ${remote.code}` : null,
        remote.details ? `details: ${remote.details}` : null,
        remote.hint ? `hint: ${remote.hint}` : null,
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" | ") : JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return fallback;
}

function displayName(value: string | null | undefined) {
  return value?.trim() || "Medlem";
}

function members(streak: SharedStreak) {
  return activeMembers(streak);
}

function isOldGroup(streak: SharedStreak) {
  return isBuddyStreak(streak) && members(streak).length > 2;
}

function isOpenBuddy(streak: SharedStreak) {
  return isBuddyStreak(streak) && members(streak).length < 2;
}

function isFullBuddy(streak: SharedStreak) {
  return isBuddyStreak(streak) && members(streak).length === 2;
}

function holderName(streak: SharedStreak) {
  const holder = streak.members.find((member) => member.user_id === streak.current_turn_user_id);
  return displayName(holder?.display_name);
}

function titleFor(streak: SharedStreak, userId: string | undefined) {
  if (isPersonalStreak(streak)) return "Min streak";
  if (isOldGroup(streak)) return "Gammal gruppstreak";
  if (isOpenBuddy(streak)) return "Inbjudan till någon";
  return userId ? `Med ${buddyPartnerName(streak, userId)}` : "Med någon";
}

function metaFor(streak: SharedStreak) {
  const count = members(streak).length;
  if (isPersonalStreak(streak)) return "bara du";
  if (isOldGroup(streak)) return `${count} medlemmar · äldre modell`;
  if (isOpenBuddy(streak)) return "Dela koden med en person";
  return "2 personer";
}

function statusFor(streak: SharedStreak, userId: string | undefined) {
  if (isPersonalStreak(streak)) return "Alltid";
  if (isOldGroup(streak)) return "Gammal";
  if (isOpenBuddy(streak)) return "Väntar på person 2";
  if (!userId) return "";
  return isMyTurn(streak, userId) ? "Din tur" : `Väntar på ${holderName(streak)}`;
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
        if (alive) setMessage(`Kunde inte ladda streak.\nTekniskt fel: ${errorText(error, "Okänt fel.")}`);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [auth.configured, auth.user, reload]);

  async function createBuddy() {
    setBusy(true);
    setMessage(null);
    setCopyNote(null);
    try {
      const result = await createSharedStreak("Streak med någon");
      setStreaks((items) => [result, ...items.filter((item) => item.id !== result.id)]);
      setSelectedId(result.id);
      setMessage("Inbjudan skapad. Dela koden med en person.");
    } catch (error) {
      console.error("[streak-page] create failed", error);
      setMessage(`Kunde inte skapa inbjudan.\nTekniskt fel: ${errorText(error, "Okänt fel.")}`);
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
      setMessage(`Kunde inte gå med i streak.\nTekniskt fel: ${errorText(error, "Okänt fel.")}`);
    } finally {
      setBusy(false);
    }
  }

  const userId = auth.user?.id;
  const personal = streaks.find(isPersonalStreak) ?? null;
  const fullBuddies = streaks.filter(isFullBuddy);
  const openBuddies = streaks.filter(isOpenBuddy);
  const oldGroups = streaks.filter(isOldGroup);
  const buddiesMyTurn = userId ? fullBuddies.filter((item) => isMyTurn(item, userId)) : [];
  const buddiesWaiting = userId ? fullBuddies.filter((item) => !isMyTurn(item, userId)) : fullBuddies;
  const visibleStreaks = [personal, ...buddiesMyTurn, ...buddiesWaiting, ...openBuddies, ...oldGroups].filter((item): item is SharedStreak => Boolean(item));
  const selected = visibleStreaks.find((item) => item.id === selectedId) ?? visibleStreaks[0] ?? null;
  const selectedMembers = selected ? members(selected) : [];
  const selectedOpenInvite = Boolean(selected && isOpenBuddy(selected));
  const selectedOldGroup = Boolean(selected && isOldGroup(selected));
  const selectedFullBuddy = Boolean(selected && isFullBuddy(selected));
  const shareUrl = selectedOpenInvite && selected ? buildJoinUrl(selected.invite_code) : "";
  const shareText = selectedOpenInvite && selected ? `Gå med i min Vardagsstyrka-streak:\n${shareUrl}\n\nKod: ${selected.invite_code}` : "";

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
    if (!selectedOpenInvite || !selected) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vardagsstyrka streak", text: shareText, url: shareUrl });
        return;
      } catch {
        // fallback to copy
      }
    }
    await copy(shareText, "Inbjudan kopierad");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Streak</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{APP_VERSION}</p>
          </div>
          <button
            type="button"
            disabled={loading || busy || !auth.user}
            onClick={() => setReload((value) => value + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary disabled:opacity-60"
            aria-label="Ladda om"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        {auth.configured && auth.loading && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">Laddar konto...</p>
          </section>
        )}

        {auth.configured && !auth.loading && !auth.user && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm font-medium">Logga in för att använda streak</p>
            <p className="mt-1 text-sm text-muted-foreground">Du får alltid Min streak och kan skapa streaks med en person i taget.</p>
            <button onClick={() => signInWithGoogle()} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground">
              <LogIn className="h-4 w-4" /> Logga in med Google
            </button>
          </section>
        )}

        {auth.user && loading && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
            <p className="text-sm text-muted-foreground">Laddar streaks...</p>
          </section>
        )}

        {auth.user && !loading && (
          <>
            <section className="rounded-3xl bg-card p-5 ring-1 ring-primary/25">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dagens 3 påverkar</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">Min streak + {buddiesMyTurn.length} med någon</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Första Dagens 3 idag uppdaterar Min streak och de person-streaks där det är din tur. Extra pass påverkar inte streak.</p>
                  <Link to="/workout" search={{ mode: "dagens3" }} className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-base font-medium text-primary-foreground active:scale-[0.99]">
                    Gör Dagens 3
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mina streaks</p>
                  <p className="mt-1 text-xs text-muted-foreground">Varje rad har egen siffra och egen tur.</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{visibleStreaks.length}</span>
              </div>
              <div className="mt-3 grid gap-2">
                {visibleStreaks.map((item) => {
                  const rowActive = item.id === selected?.id;
                  const rowIsPrimary = isPersonalStreak(item) || (userId && isMyTurn(item, userId) && isFullBuddy(item));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm ring-1 ${rowActive ? "bg-primary/10 ring-primary/30" : "bg-secondary/60 ring-transparent"}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-base font-semibold">{item.streak_count}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{titleFor(item, userId)}</span>
                        <span className="block text-xs text-muted-foreground">{metaFor(item)}</span>
                      </span>
                      <span className={`shrink-0 text-xs font-medium ${rowIsPrimary ? "text-primary" : "text-muted-foreground"}`}>{statusFor(item, userId)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
              <p className="text-sm font-medium">Streak med någon</p>
              <p className="mt-1 text-xs text-muted-foreground">Skapa en inbjudan direkt, eller gå med med en kod du fått.</p>
              <button disabled={busy} onClick={createBuddy} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-medium text-primary-foreground disabled:opacity-60">
                <Plus className="h-4 w-4" /> Skapa inbjudan
              </button>
              <div className="mt-3 flex gap-2">
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="KOD"
                  className="h-11 min-w-0 flex-1 rounded-2xl bg-secondary px-4 text-center text-sm font-semibold uppercase tracking-[0.18em] outline-none ring-1 ring-border/60"
                  maxLength={12}
                />
                <button disabled={busy || joinCode.trim().length < 4} onClick={join} className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-secondary px-4 text-sm font-medium disabled:opacity-60">
                  <UserPlus className="h-4 w-4" /> Gå med
                </button>
              </div>
            </section>

            {selectedOpenInvite && selected && (
              <section className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-primary/25">
                <p className="text-sm font-medium">Dela inbjudan</p>
                <p className="mt-1 text-xs text-muted-foreground">Skicka koden eller länken till en person. När personen gått med försvinner koden.</p>
                <ul className="mt-3 space-y-1.5">
                  {selectedMembers.map((member) => (
                    <li key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2 text-sm">
                      <span className="truncate">{displayName(member.display_name)}{member.user_id === auth.user?.id ? " (du)" : ""}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Inbjudningskod</p>
                <div className="relative mt-1 rounded-2xl bg-secondary px-4 py-3 pr-12 text-center text-2xl font-semibold tracking-[0.2em]">
                  <span>{selected.invite_code}</span>
                  <button type="button" onClick={() => copy(selected.invite_code, "Kod kopierad")} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80" aria-label="Kopiera kod">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <button type="button" onClick={share} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground">
                  <Share2 className="h-4 w-4" /> Dela inbjudan
                </button>
                {copyNote && <p className="mt-2 text-center text-xs text-muted-foreground">{copyNote}</p>}
              </section>
            )}

            {selected && !selectedOpenInvite && (
              <details className="mt-4 rounded-2xl bg-card p-5 ring-1 ring-border/60">
                <summary className="cursor-pointer text-sm font-medium">Detaljer: {titleFor(selected, userId)}</summary>
                <ul className="mt-3 space-y-1.5">
                  {selectedMembers.map((member) => (
                    <li key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2 text-sm">
                      <span className="truncate">{displayName(member.display_name)}{member.user_id === auth.user?.id ? " (du)" : ""}</span>
                      {member.user_id === selected.current_turn_user_id && isFullBuddy(selected) && <span className="shrink-0 text-xs font-medium text-primary">Tur</span>}
                    </li>
                  ))}
                </ul>
                {isPersonalStreak(selected) && <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">Min streak är bara din. Den uppdateras första gången du gör Dagens 3 varje dag.</p>}
                {selectedFullBuddy && <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">Den här streaken har två personer. Den kan inte delas vidare.</p>}
                {selectedOldGroup && <p className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground">Det här är en äldre gruppstreak med fler än två medlemmar. Nya streaks bör skapas med en person i taget.</p>}
              </details>
            )}
          </>
        )}

        {message && <section className="mt-4 rounded-2xl bg-secondary/60 p-3 text-sm text-muted-foreground"><p className="whitespace-pre-line break-words">{message}</p></section>}
      </div>
    </div>
  );
}
