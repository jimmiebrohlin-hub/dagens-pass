import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { createChallengeAttempt } from "../src/lib/hundredChallenge.ts";
import { clearHundredDraft, loadHundredDraft, saveHundredDraft } from "../src/lib/hundredDraft.ts";
import {
  clearWorkoutDraft,
  createWorkoutDraftKey,
  loadWorkoutDraft,
  saveWorkoutDraft,
} from "../src/lib/workoutDraft.ts";

class MemoryStorage {
  values = new Map();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

let storage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
  Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true });
});

afterEach(() => {
  delete globalThis.window;
  delete globalThis.sessionStorage;
});

describe("100 challenge-utkast", () => {
  it("sparar och återställer den pågående planen", () => {
    const draft = {
      activeId: "knaboj",
      phase: "rest",
      setIndex: 1,
      restSeconds: 27,
      attempt: createChallengeAttempt(8),
    };

    saveHundredDraft(draft);

    assert.deepEqual(loadHundredDraft(), draft);
  });

  it("normaliserar gränser och avvisar trasiga utkast", () => {
    storage.setItem(
      "vardagsstyrka-hundred-draft-v1",
      JSON.stringify({
        activeId: "knaboj",
        phase: "rest",
        setIndex: 99,
        restSeconds: -4,
        attempt: createChallengeAttempt(8),
      }),
    );

    assert.deepEqual(
      { setIndex: loadHundredDraft()?.setIndex, restSeconds: loadHundredDraft()?.restSeconds },
      { setIndex: 2, restSeconds: 0 },
    );

    storage.setItem("vardagsstyrka-hundred-draft-v1", "{trasigt");
    assert.equal(loadHundredDraft(), null);
  });

  it("rensar avslutat utkast", () => {
    saveHundredDraft({
      activeId: "knaboj",
      phase: "do",
      setIndex: 0,
      restSeconds: 0,
      attempt: createChallengeAttempt(8),
    });

    clearHundredDraft();

    assert.equal(loadHundredDraft(), null);
  });
});

describe("vanligt träningsutkast", () => {
  const key = createWorkoutDraftKey({
    date: "2026-07-16",
    mode: "dagens3",
    focus: "mix",
    intensity: "normal",
    exerciseIds: ["knaboj", "armhavningar", "dead_bug"],
  });

  it("skapar en stabil nyckel och återställer träningsfasen", () => {
    assert.equal(key, "2026-07-16:dagens3:mix:normal:knaboj.armhavningar.dead_bug");

    const draft = {
      exerciseIndex: 1,
      setNumberIndex: 0,
      done: [true, false, false],
      phase: "rest",
      restSeconds: 31,
      pendingAction: "next-exercise",
    };

    saveWorkoutDraft(key, draft);

    assert.deepEqual(loadWorkoutDraft(key, 3), draft);
  });

  it("anpassar checklistan och säkrar ogiltiga vilodata", () => {
    saveWorkoutDraft(key, {
      exerciseIndex: 99,
      setNumberIndex: 99,
      done: [true, false, true],
      phase: "rest",
      restSeconds: -1,
      pendingAction: null,
    });

    assert.deepEqual(loadWorkoutDraft(key, 2), {
      exerciseIndex: 2,
      setNumberIndex: 20,
      done: [true, false],
      phase: "exercise",
      restSeconds: 0,
      pendingAction: null,
    });
  });

  it("returnerar null för trasig lagring och efter rensning", () => {
    storage.setItem(`vardagsstyrka-workout-draft-v1:${key}`, "{trasigt");
    assert.equal(loadWorkoutDraft(key, 3), null);

    saveWorkoutDraft(key, {
      exerciseIndex: 0,
      setNumberIndex: 0,
      done: [false, false, false],
      phase: "exercise",
      restSeconds: 0,
      pendingAction: null,
    });
    clearWorkoutDraft(key);

    assert.equal(loadWorkoutDraft(key, 3), null);
  });
});
