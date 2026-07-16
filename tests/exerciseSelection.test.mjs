import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickDailyThree, pickLarge, pickSmall } from "../src/lib/exercises.ts";

const GENTLE_IDS = new Set([
  "vaggarmhavningar",
  "axelpress",
  "handduksrodd",
  "skulderbladspress",
  "hoftlyft",
  "vadpress",
  "knaboj",
  "dead_bug",
  "bird_dog",
  "rygglyft",
  "planka",
]);

function ids(exercises) {
  return exercises.map((exercise) => exercise.id);
}

function groups(exercises) {
  return exercises.map((exercise) => exercise.muscleGroup);
}

function assertAlternating(exercises) {
  exercises.slice(1).forEach((exercise, index) => {
    assert.notEqual(exercise.muscleGroup, exercises[index].muscleGroup);
  });
}

function groupCounts(exercises) {
  return exercises.reduce(
    (counts, exercise) => ({
      ...counts,
      [exercise.muscleGroup]: counts[exercise.muscleGroup] + 1,
    }),
    { lower: 0, upper: 0, core: 0 },
  );
}

describe("programurval", () => {
  it("väljer deterministiskt en övning per muskelgrupp för Dagens 3", () => {
    const first = pickDailyThree("2026-07-16");
    const second = pickDailyThree("2026-07-16");

    assert.deepEqual(ids(first), ids(second));
    assert.deepEqual(groups(first), ["lower", "upper", "core"]);
  });

  it("respekterar blockerade övningar när alternativ finns", () => {
    const baseline = pickDailyThree("blocked-regression");
    const blockedIds = baseline.map((exercise) => exercise.id);
    const replacement = pickDailyThree("blocked-regression", { blockedIds });

    assert.equal(replacement.length, 3);
    assert.equal(
      ids(replacement).some((id) => blockedIds.includes(id)),
      false,
    );
  });

  const focusCases = [
    ["mix", { lower: 4, upper: 3, core: 3 }],
    ["lower", { lower: 5, upper: 2, core: 3 }],
    ["upper", { lower: 2, upper: 5, core: 3 }],
    ["core", { lower: 3, upper: 2, core: 5 }],
  ];

  for (const [focus, expected] of focusCases) {
    it(`bygger ett litet ${focus}-program med rätt tonvikt och alternering`, () => {
      const program = pickSmall("focus-regression", {}, focus);

      assert.equal(program.length, 10);
      assert.equal(
        program.every((exercise) => exercise.sets === 2),
        true,
      );
      assert.deepEqual(groupCounts(program), expected);
      assertAlternating(program);
    });
  }

  it("bygger ett långt program utan intilliggande upprepning av muskelgrupp", () => {
    const program = pickLarge("large-regression", {}, "mix");

    assert.equal(program.length, 20);
    assertAlternating(program);
  });

  it("begränsar skonsamt fokus till den godkända övningspoolen", () => {
    const program = pickSmall("gentle-regression", {}, "gentle");

    assert.equal(program.length, 10);
    assert.equal(
      program.every((exercise) => GENTLE_IDS.has(exercise.id)),
      true,
    );
    assertAlternating(program);
  });
});
