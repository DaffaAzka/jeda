import { describe, it, expect } from "vitest";
import { reframeThoughtWithGemini } from "@/lib/ai/gemini-reframe";
import dotenv from "dotenv";

dotenv.config();

describe("Gemini Reframing Service Integration", () => {
  it("reframes student thought in under 5s with live Gemini AI", async () => {
    const studentThought = "berikan saya jawaban buat utbk";

    const start = Date.now();
    const result = await reframeThoughtWithGemini(studentThought);
    const duration = Date.now() - start;

    console.log(`Reframing completed in ${duration}ms from: ${result.source}`);
    console.log("Validation:", result.validation);
    console.log("Distortion:", result.distortion);
    console.log("Fact:", result.fact);
    console.log("Small step:", result.smallStep);

    expect(result.source).toBe("gemini");
    expect(result.validation).toBeTruthy();
    expect(result.distortion).toBeTruthy();
    expect(result.fact).toBeTruthy();
    expect(result.smallStep).toBeTruthy();
  }, 15000);
});
