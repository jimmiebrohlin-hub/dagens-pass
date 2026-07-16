import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  challengePlan,
  createChallengeAttempt,
  createChallengeResult,
  planTotal,
} from "../src/lib/hundredChallenge.ts";

describe("100 challenge-progression", () => {
  it("fryser genomförd plan och räknar nästa plan separat", () => {
    const attempt = createChallengeAttempt(8);
    const result = createChallengeResult(attempt, "latt");

    assert.deepEqual(attempt, { baseReps: 8, plan: [8, 12, 6], total: 26 });
    assert.equal(result.attempt, attempt);
    assert.deepEqual(result.attempt.plan, [8, 12, 6]);
    assert.equal(result.nextBaseReps, 10);
    assert.deepEqual(result.nextPlan, [10, 14, 8]);
  });

  const feedbackCases = [
    ["latt", 10],
    ["medel", 9],
    ["svart", 8],
    ["misslyckat", 6],
  ];

  for (const [feedback, expectedBase] of feedbackCases) {
    it(`justerar basnivån korrekt för ${feedback}`, () => {
      const result = createChallengeResult(createChallengeAttempt(8), feedback);

      assert.equal(result.nextBaseReps, expectedBase);
      assert.deepEqual(result.nextPlan, challengePlan(expectedBase));
    });
  }

  it("håller progressionen inom min- och maxgränser", () => {
    assert.equal(createChallengeResult(createChallengeAttempt(34), "latt").nextBaseReps, 34);
    assert.equal(createChallengeResult(createChallengeAttempt(4), "misslyckat").nextBaseReps, 4);
    assert.deepEqual(challengePlan(34), [34, 34, 32]);
    assert.deepEqual(challengePlan(4), [4, 8, 4]);
  });

  it("summerar planen utan att ändra den", () => {
    const plan = [10, 14, 8];

    assert.equal(planTotal(plan), 32);
    assert.deepEqual(plan, [10, 14, 8]);
  });
});
