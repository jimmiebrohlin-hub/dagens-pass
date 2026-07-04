import { useEffect, useRef } from "react";
import { useAuthState } from "./auth";
import { downloadCloudDataToLocal, uploadLocalDataToCloud } from "./cloudSync";
import { loadState } from "./storage";

const STATE_EVENT = "vardagsstyrka:state";
const AUTO_SYNC_USER_KEY = "vardagsstyrka-auto-sync-user-id";
const AUTO_SYNC_AT_KEY = "vardagsstyrka-auto-sync-at";

function hasMeaningfulLocalData() {
  const state = loadState();
  return state.sessions.length > 0 || Object.keys(state.hundred).length > 0 || state.completedDates.length > 0;
}

export function AutoCloudSync() {
  const auth = useAuthState();
  const syncingRef = useRef(false);
  const readyUserRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!auth.configured || auth.loading || !auth.user) {
      readyUserRef.current = null;
      return;
    }

    let cancelled = false;
    const userId = auth.user.id;

    async function bootstrapSync() {
      syncingRef.current = true;
      try {
        const previousUserId = localStorage.getItem(AUTO_SYNC_USER_KEY);

        if (previousUserId && previousUserId !== userId) {
          await downloadCloudDataToLocal();
        } else if (hasMeaningfulLocalData()) {
          await uploadLocalDataToCloud();
        } else {
          await downloadCloudDataToLocal();
        }

        localStorage.setItem(AUTO_SYNC_USER_KEY, userId);
        localStorage.setItem(AUTO_SYNC_AT_KEY, new Date().toISOString());
        if (!cancelled) readyUserRef.current = userId;
      } catch (error) {
        console.warn("Auto cloud sync failed", error);
        if (!cancelled) readyUserRef.current = userId;
      } finally {
        syncingRef.current = false;
      }
    }

    void bootstrapSync();

    return () => {
      cancelled = true;
    };
  }, [auth.configured, auth.loading, auth.user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function scheduleUpload() {
      const userId = auth.user?.id;
      if (!userId || readyUserRef.current !== userId || syncingRef.current) return;

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        void (async () => {
          syncingRef.current = true;
          try {
            await uploadLocalDataToCloud();
            localStorage.setItem(AUTO_SYNC_USER_KEY, userId);
            localStorage.setItem(AUTO_SYNC_AT_KEY, new Date().toISOString());
          } catch (error) {
            console.warn("Auto cloud upload failed", error);
          } finally {
            syncingRef.current = false;
          }
        })();
      }, 1200);
    }

    window.addEventListener(STATE_EVENT, scheduleUpload);
    window.addEventListener("beforeunload", scheduleUpload);

    return () => {
      window.removeEventListener(STATE_EVENT, scheduleUpload);
      window.removeEventListener("beforeunload", scheduleUpload);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [auth.user]);

  return null;
}
