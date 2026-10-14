import { describe, expect, it } from "vitest";
import { getTimerPlan, getAllowedLevels } from "@/lib/practice/level-policy";
import { seededShuffle } from "@/lib/practice/shuffle";
import { isQuestionReady } from "@/lib/practice/question-ready";
import { evaluateSessionAnswers } from "@/lib/practice/scoring";
import { guessErrorTag } from "@/lib/rules/guess-error-tag";
import { PRACTICE } from "@/config/practice";
import { RULES } from "@/config/rules";

describe("level-policy: getTimerPlan", () => {
  const baseSeconds = 1800; // 30 minutes

  it("handles relaxed level with no timer and no pause", () => {
    const plan = getTimerPlan("relaxed", baseSeconds);
    expect(plan.limitSeconds).toBeNull();
    expect(plan.onExpiry).toBe("none");
    expect(plan.panicPausesTimer).toBe(false);
  });

  it("handles loose/timed level with multiplier and pause enabled", () => {
    const plan = getTimerPlan("timed", baseSeconds);
    expect(plan.limitSeconds).toBe(
      Math.round(baseSeconds * PRACTICE.looseTimeMultiplier),
    );
    expect(plan.onExpiry).toBe("prompt");
    expect(plan.panicPausesTimer).toBe(true);

    // Also supports alias 'loose'
    const planAlias = getTimerPlan("loose", baseSeconds);
    expect(planAlias.limitSeconds).toBe(plan.limitSeconds);
  });

  it("handles full simulation level with strict limit and no timer pause", () => {
    const plan = getTimerPlan("full_simulation", baseSeconds);
    expect(plan.limitSeconds).toBe(baseSeconds);
    expect(plan.onExpiry).toBe("finish");
    expect(plan.panicPausesTimer).toBe(false);

    // Also supports alias 'full'
    const planAlias = getTimerPlan("full", baseSeconds);
    expect(planAlias.limitSeconds).toBe(baseSeconds);
  });

  it("returns allowed levels with recovery warnings when mode is recovery", () => {
    const levels = getAllowedLevels("recovery");
    expect(levels).toHaveLength(3);
    const relaxed = levels.find((l) => l.level === "relaxed");
    const timed = levels.find((l) => l.level === "timed");
    const full = levels.find((l) => l.level === "full_simulation");

    expect(relaxed?.recommended).toBe(true);
    expect(timed?.recommended).toBe(false);
    expect(timed?.recoveryNotice).toBeDefined();
    expect(full?.recommended).toBe(false);
    expect(full?.recoveryNotice).toBeDefined();
  });
});

describe("shuffle: seededShuffle", () => {
  const items = ["A", "B", "C", "D", "E"];

  it("produces identical order for identical seed and input", () => {
    const run1 = seededShuffle(items, "session-1_question-1");
    const run2 = seededShuffle(items, "session-1_question-1");
    expect(run1).toEqual(run2);
  });

  it("does not mutate original array", () => {
    const copy = [...items];
    seededShuffle(items, "any-seed");
    expect(items).toEqual(copy);
  });

  it("handles empty and single-item arrays safely", () => {
    expect(seededShuffle([], "seed")).toEqual([]);
    expect(seededShuffle(["only"], "seed")).toEqual(["only"]);
  });

  it("produces different orders for different seeds", () => {
    const runA = seededShuffle(items, "seed-alpha");
    const runB = seededShuffle(items, "seed-beta");
    // With 5 elements, probability of collision is 1/120
    expect(runA.join("")).not.toEqual(runB.join(""));
  });
});

describe("question-ready: isQuestionReady", () => {
  it("rejects unpublished questions", () => {
    const ready = isQuestionReady({
      id: "q-1",
      isPublished: false,
      stem: "Valid stem text",
      options: [
        { isCorrect: true, body: "A" },
        { isCorrect: false, body: "B" },
      ],
    });
    expect(ready).toBe(false);
  });

  it("rejects questions with empty stem", () => {
    const ready = isQuestionReady({
      id: "q-2",
      isPublished: true,
      stem: "   ",
      options: [
        { isCorrect: true, body: "A" },
        { isCorrect: false, body: "B" },
      ],
    });
    expect(ready).toBe(false);
  });

  it("rejects questions with fewer than 2 options", () => {
    const ready = isQuestionReady({
      id: "q-3",
      isPublished: true,
      stem: "Stem",
      options: [{ isCorrect: true, body: "A" }],
    });
    expect(ready).toBe(false);
  });

  it("rejects questions with more than 5 options", () => {
    const ready = isQuestionReady({
      id: "q-4",
      isPublished: true,
      stem: "Stem",
      options: [
        { isCorrect: true, body: "A" },
        { isCorrect: false, body: "B" },
        { isCorrect: false, body: "C" },
        { isCorrect: false, body: "D" },
        { isCorrect: false, body: "E" },
        { isCorrect: false, body: "F" },
      ],
    });
    expect(ready).toBe(false);
  });

  it("rejects questions with no correct option or multiple correct options", () => {
    const noCorrect = isQuestionReady({
      id: "q-5a",
      isPublished: true,
      stem: "Stem",
      options: [
        { isCorrect: false, body: "A" },
        { isCorrect: false, body: "B" },
      ],
    });
    expect(noCorrect).toBe(false);

    const multiCorrect = isQuestionReady({
      id: "q-5b",
      isPublished: true,
      stem: "Stem",
      options: [
        { isCorrect: true, body: "A" },
        { isCorrect: true, body: "B" },
      ],
    });
    expect(multiCorrect).toBe(false);
  });

  it("accepts valid ready questions", () => {
    const valid = isQuestionReady({
      id: "q-6",
      isPublished: true,
      stem: "Berapa hasil dari 2 + 2?",
      options: [
        { isCorrect: true, body: "4" },
        { isCorrect: false, body: "5" },
        { isCorrect: false, body: "6" },
      ],
    });
    expect(valid).toBe(true);
  });
});

describe("scoring: evaluateSessionAnswers", () => {
  it("evaluates answers and updates topic attempts only for answered questions", () => {
    const { evaluatedAnswers, summary } = evaluateSessionAnswers([
      {
        questionId: "q1",
        topicId: "top-1",
        selectedOptionId: "opt-1",
        correctOptionId: "opt-1", // correct
        elapsedSeconds: 30,
      },
      {
        questionId: "q2",
        topicId: "top-1",
        selectedOptionId: "opt-wrong",
        correctOptionId: "opt-2", // wrong
        elapsedSeconds: 60,
      },
      {
        questionId: "q3",
        topicId: "top-2",
        selectedOptionId: null, // unanswered
        correctOptionId: "opt-3",
        elapsedSeconds: 0,
      },
    ]);

    expect(summary.totalQuestions).toBe(3);
    expect(summary.answeredCount).toBe(2);
    expect(summary.correctCount).toBe(1);
    expect(summary.unansweredCount).toBe(1);
    expect(summary.scorePercentage).toBe(33.33);

    // Topic deltas:
    // top-1 was answered twice, 1 correct
    // top-2 had 1 question but it was NOT answered, so attempts = 0
    const top1 = summary.topicDeltas.find((d) => d.topicId === "top-1");
    const top2 = summary.topicDeltas.find((d) => d.topicId === "top-2");

    expect(top1).toEqual({ topicId: "top-1", attempts: 2, correct: 1 });
    expect(top2).toBeUndefined(); // top-2 had 0 attempts, not added
  });
});

describe("guess-error-tag: guessErrorTag", () => {
  const customRules = { lastWindowSeconds: 900, quickAnswerShare: 0.5 };

  it("returns null for correct answers", () => {
    const result = guessErrorTag({
      isCorrect: true,
      isAnswered: true,
      elapsedSeconds: 100,
      timeLimitSeconds: 1800,
    });
    expect(result).toBeNull();
  });

  it("guesses out_of_time for unanswered questions in timed sessions", () => {
    const result = guessErrorTag({
      isCorrect: false,
      isAnswered: false,
      elapsedSeconds: 0,
      timeLimitSeconds: 1800,
    });
    expect(result).toBe("out_of_time");
  });

  it("guesses out_of_time for answers saved in the last 900s of a timed session", () => {
    // 1800s total, answered at 1000s -> 800s left (<= 900)
    const result = guessErrorTag(
      {
        isCorrect: false,
        isAnswered: true,
        elapsedSeconds: 1000,
        timeLimitSeconds: 1800,
      },
      customRules,
    );
    expect(result).toBe("out_of_time");
  });

  it("guesses careless when answered much faster than average pace", () => {
    // Answered outside last window: 3600s total, elapsed at 500s (3100s left)
    // Avg pace: 90s, secondsSpent: 20s (< 90 * 0.5 = 45s)
    const result = guessErrorTag(
      {
        isCorrect: false,
        isAnswered: true,
        elapsedSeconds: 500,
        secondsSpent: 20,
        timeLimitSeconds: 3600,
        averagePaceSeconds: 90,
      },
      customRules,
    );
    expect(result).toBe("careless");
  });

  it("defaults to didnt_know when normal pace and outside last window", () => {
    const result = guessErrorTag(
      {
        isCorrect: false,
        isAnswered: true,
        elapsedSeconds: 500,
        secondsSpent: 80,
        timeLimitSeconds: 3600,
        averagePaceSeconds: 90,
      },
      customRules,
    );
    expect(result).toBe("didnt_know");
  });
});
