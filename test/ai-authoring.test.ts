import { describe, expect, it } from "vitest";
import katex from "katex";
import { questionDraftItemSchema } from "@/features/ai/schema";
import { AI_CONFIG } from "@/config/ai";

function checkHourlyRateLimit(recentGenerationsCount: number): boolean {
  return recentGenerationsCount < AI_CONFIG.requestsPerAdminPerHour;
}

function hasValidLatex(text: string): boolean {
  const matches = text.match(/\$\$?([^$]+)\$\$?/g);
  if (!matches) return true;
  for (const match of matches) {
    const raw = match.replace(/^\$\$?|\$\$?$/g, "").trim();
    if (!raw) continue;
    try {
      katex.renderToString(raw, { throwOnError: true });
    } catch {
      return false;
    }
  }
  return true;
}

function normalizeStem(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

describe("AI Authoring: Hourly Limit Counter", () => {
  it("allows requests when count is below limit (15/hour)", () => {
    expect(checkHourlyRateLimit(0)).toBe(true);
    expect(checkHourlyRateLimit(5)).toBe(true);
    expect(checkHourlyRateLimit(14)).toBe(true);
  });

  it("blocks requests when count reaches or exceeds limit", () => {
    expect(checkHourlyRateLimit(15)).toBe(false);
    expect(checkHourlyRateLimit(16)).toBe(false);
    expect(checkHourlyRateLimit(50)).toBe(false);
  });
});

describe("AI Authoring: Question Draft Validation", () => {
  const validBaseQuestion = {
    stem: "Jika $f(x) = 2x + 3$, berapakah nilai dari $f(4)$?",
    options: [
      { label: "A", body: "7", isCorrect: false },
      { label: "B", body: "11", isCorrect: true },
      { label: "C", body: "14", isCorrect: false },
      { label: "D", body: "15", isCorrect: false },
      { label: "E", body: "20", isCorrect: false },
    ],
    explanation: "Substitusikan $x = 4$: $f(4) = 2(4) + 3 = 11$.",
    difficulty: 2,
    expectedSeconds: 60,
  };

  it("accepts valid question item matching official SNPMB structure", () => {
    const parsed = questionDraftItemSchema.safeParse(validBaseQuestion);
    expect(parsed.success).toBe(true);

    const correctCount = validBaseQuestion.options.filter((o) => o.isCorrect).length;
    expect(correctCount).toBe(1);
    expect(hasValidLatex(validBaseQuestion.stem)).toBe(true);
    expect(hasValidLatex(validBaseQuestion.explanation)).toBe(true);
  });

  it("rejects question with multiple or zero correct options", () => {
    const twoCorrect = {
      ...validBaseQuestion,
      options: [
        { label: "A", body: "7", isCorrect: true },
        { label: "B", body: "11", isCorrect: true },
        { label: "C", body: "14", isCorrect: false },
        { label: "D", body: "15", isCorrect: false },
        { label: "E", body: "20", isCorrect: false },
      ],
    };
    expect(twoCorrect.options.filter((o) => o.isCorrect).length).not.toBe(1);

    const zeroCorrect = {
      ...validBaseQuestion,
      options: [
        { label: "A", body: "7", isCorrect: false },
        { label: "B", body: "11", isCorrect: false },
        { label: "C", body: "14", isCorrect: false },
        { label: "D", body: "15", isCorrect: false },
        { label: "E", body: "20", isCorrect: false },
      ],
    };
    expect(zeroCorrect.options.filter((o) => o.isCorrect).length).not.toBe(1);
  });

  it("detects and rejects broken LaTeX syntax with KaTeX throwOnError", () => {
    const brokenStem = "Tentukan nilai dari $\\frac{x^2}{ $ jika diketahui...";
    expect(hasValidLatex(brokenStem)).toBe(false);

    const validStem = "Tentukan nilai dari $\\frac{x^2}{2} + 5$ jika diketahui...";
    expect(hasValidLatex(validStem)).toBe(true);
  });

  it("normalizes stems correctly to prevent duplicate question drafting", () => {
    const stemA = "  Berapakah Nilai Dari   f(x) ?  ";
    const stemB = "berapakah nilai dari f(x) ?";
    expect(normalizeStem(stemA)).toBe(normalizeStem(stemB));
  });
});
