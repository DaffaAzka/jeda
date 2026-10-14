import { describe, it, expect } from "vitest";
import { reframeThoughtWithGemini } from "@/lib/ai/gemini-reframe";
import dotenv from "dotenv";

dotenv.config();

describe("Gemini Reframing Service", () => {
  it("reframes catastrophic thought with valid structured fields", async () => {
    const studentThought =
      "Aku baru aja tryout dan nilaiku di bawah 500. Masa depanku hancur, aku gak bakalan lolos PTN impian.";

    const result = await reframeThoughtWithGemini(studentThought);

    expect(result.thought).toBe(studentThought);
    expect(result.validation).toBeTruthy();
    expect(result.distortion).toBeTruthy();
    expect(result.fact).toBeTruthy();
    expect(result.smallStep).toBeTruthy();
    expect(["gemini", "local_fallback"]).toContain(result.source);

    console.log("Reframed result from:", result.source);
    console.log("Validation:", result.validation);
    console.log("Distortion:", result.distortion);
    console.log("Fact:", result.fact);
    console.log("Small step:", result.smallStep);
  }, 20000);
});
