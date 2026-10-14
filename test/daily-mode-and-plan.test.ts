import { describe, expect, it } from "vitest";
import { evaluateDailyMode } from "@/lib/rules/daily-mode";
import { generateDailyPlanTasks } from "@/lib/rules/plan-generator";

describe("Rule Engine: evaluateDailyMode", () => {
  it("determines recovery mode when sleep is under 5 hours", () => {
    const res = evaluateDailyMode({
      sleepHours: 4.5,
      energy: 3,
      mood: 3,
      stress: 2,
    });
    expect(res.mode).toBe("recovery");
    expect(res.ruleKey).toBe("recovery");
    expect(res.isReferralTriggered).toBe(false);
  });

  it("determines recovery mode when stress is 4 or higher", () => {
    const res = evaluateDailyMode({
      sleepHours: 7.0,
      energy: 3,
      mood: 3,
      stress: 4,
    });
    expect(res.mode).toBe("recovery");
    expect(res.ruleKey).toBe("recovery");
  });

  it("determines challenge mode when sleep >= 7, energy >= 4, and stress <= 2", () => {
    const res = evaluateDailyMode({
      sleepHours: 7.5,
      energy: 5,
      mood: 4,
      stress: 1,
    });
    expect(res.mode).toBe("challenge");
    expect(res.ruleKey).toBe("challenge");
    expect(res.isReferralTriggered).toBe(false);
  });

  it("defaults to balanced mode for moderate conditions", () => {
    const res = evaluateDailyMode({
      sleepHours: 6.5,
      energy: 3,
      mood: 3,
      stress: 3,
    });
    expect(res.mode).toBe("balanced");
    expect(res.ruleKey).toBe("balanced");
  });

  it("forces balanced mode without consent (AGENTS.md rule)", () => {
    const res = evaluateDailyMode(
      {
        sleepHours: 3.0, // normally recovery
        energy: 1,
        mood: 1,
        stress: 5,
      },
      [],
      false, // wellbeingConsent = false
    );
    expect(res.mode).toBe("balanced");
    expect(res.ruleKey).toBe("no_consent");
    expect(res.isReferralTriggered).toBe(false);
  });

  it("triggers referral alert when low mood and high stress persist for 3 consecutive days", () => {
    const history = [
      { mood: 2, stress: 4, checkinDate: new Date("2026-10-13") },
      { mood: 1, stress: 5, checkinDate: new Date("2026-10-12") },
    ];

    const res = evaluateDailyMode(
      {
        sleepHours: 5.0,
        energy: 2,
        mood: 2,
        stress: 4, // 3rd consecutive day
      },
      history,
      true,
    );

    expect(res.mode).toBe("recovery");
    expect(res.isReferralTriggered).toBe(true);
  });

  it("does not trigger referral if condition was high strain for only 1 or 2 days", () => {
    const history = [
      { mood: 4, stress: 2, checkinDate: new Date("2026-10-13") }, // not high strain
      { mood: 1, stress: 5, checkinDate: new Date("2026-10-12") },
    ];

    const res = evaluateDailyMode(
      {
        sleepHours: 4.0,
        energy: 2,
        mood: 2,
        stress: 4,
      },
      history,
      true,
    );

    expect(res.isReferralTriggered).toBe(false);
  });
});

describe("Plan Generator: generateDailyPlanTasks", () => {
  const topics = [
    { id: "top-1", name: "Aljabar & Persamaan" },
    { id: "top-2", name: "Penalaran Deduktif" },
  ];

  it("generates calm, review, and gentle practice for recovery mode", () => {
    const tasks = generateDailyPlanTasks("recovery", topics);
    expect(tasks).toHaveLength(3);
    expect(tasks.some((t) => t.type === "calm")).toBe(true);
    expect(tasks.some((t) => t.type === "review")).toBe(true);
    expect(tasks.some((t) => t.type === "practice")).toBe(true);
    expect(tasks[0]?.title).toContain("Aljabar & Persamaan");
  });

  it("generates timed challenge and tryout for challenge mode", () => {
    const tasks = generateDailyPlanTasks("challenge", topics);
    expect(tasks).toHaveLength(3);
    expect(tasks.some((t) => t.type === "tryout")).toBe(true);
  });

  it("generates balanced steady tasks for balanced mode", () => {
    const tasks = generateDailyPlanTasks("balanced", topics);
    expect(tasks).toHaveLength(3);
    expect(tasks.some((t) => t.type === "review")).toBe(true);
    expect(tasks.some((t) => t.type === "practice")).toBe(true);
  });
});
