import { describe, expect, it } from "vitest";
import { seedId } from "@/lib/seed-id";

describe("Seeder: seedId deterministic UUID generator", () => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it("produces a valid UUID v4 format string", () => {
    const id = seedId("user:demo-student");
    expect(id).toMatch(uuidRegex);
  });

  it("is completely deterministic for identical keys across multiple runs", () => {
    const key = "lesson:kpu:deductive-reasoning-1";
    const run1 = seedId(key);
    const run2 = seedId(key);
    const run3 = seedId(key);

    expect(run1).toBe(run2);
    expect(run2).toBe(run3);
  });

  it("produces distinct UUIDs for different keys", () => {
    const idA = seedId("question:pk:1");
    const idB = seedId("question:pk:2");
    const idC = seedId("topic:kpu:deduktif");

    expect(idA).not.toBe(idB);
    expect(idA).not.toBe(idC);
    expect(idB).not.toBe(idC);
  });
});
