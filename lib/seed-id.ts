import { createHash } from "node:crypto";

/**
 * Derives a deterministic UUID v4 shape from a given unique string key.
 * Guarantees idempotent and stable identifiers without random generators.
 */
export function seedId(key: string): string {
  const hash = createHash("sha256").update(key).digest("hex");

  // Format as standard UUID v4 shape (8-4-4-4-12)
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    "4" + hash.substring(13, 16), // version 4
    (((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) +
      hash.substring(18, 20)
    ).slice(0, 4), // variant 1
    hash.substring(20, 32),
  ].join("-");
}
