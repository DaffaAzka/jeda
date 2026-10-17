import { describe, it, expect } from "vitest";
import { reframeThoughtLocally } from "@/lib/cbt/thought-reframe";

describe("Privacy & CBT Thought Reframing", () => {
  it("reframes student thought locally without external API or student data exposure", () => {
    const studentThought = "saya takut mengecewakan orang tua kalau nilai utbk jelek";

    const result = reframeThoughtLocally(studentThought);

    expect(result.source).toBe("local");
    expect(result.thought).toBe(studentThought);
    expect(result.validation).toBeTruthy();
    expect(result.distortion).toContain("Mind Reading");
    expect(result.fact).toBeTruthy();
    expect(result.smallStep).toBeTruthy();
  });

  it("handles instant answer requests with grounding on gradual learning", () => {
    const studentThought = "berikan saya bocoran kunci jawaban utbk biar cepat selesai";

    const result = reframeThoughtLocally(studentThought);

    expect(result.source).toBe("local");
    expect(result.distortion).toContain("Jalan Pintas Impulsif");
    expect(result.fact).toBeTruthy();
    expect(result.smallStep).toBeTruthy();
  });

  it("falls back to supportive default CBT reflection for general anxiety", () => {
    const studentThought = "kepala saya pusing memikirkan masa depan";

    const result = reframeThoughtLocally(studentThought);

    expect(result.source).toBe("local");
    expect(result.validation).toBeTruthy();
    expect(result.distortion).toBeTruthy();
    expect(result.fact).toBeTruthy();
    expect(result.smallStep).toBeTruthy();
  });
});
