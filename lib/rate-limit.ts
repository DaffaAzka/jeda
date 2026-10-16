import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export type RateLimitTier = "auth" | "api";

interface MemoryEntry {
  count: number;
  resetAt: number; // Timestamp in milliseconds
}

// In-memory fallback store for development or when Redis is not configured
const memoryStore = new Map<string, MemoryEntry>();

if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (typeof cleanup.unref === "function") {
    cleanup.unref();
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(resetAt / 1000),
    };
  }

  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

let upstashAuthLimiter: Ratelimit | null = null;
let upstashApiLimiter: Ratelimit | null = null;

function getUpstashLimiters(): { auth: Ratelimit; api: Ratelimit } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!upstashAuthLimiter || !upstashApiLimiter) {
    const redis = new Redis({ url, token });

    // Strict tier: 5 requests per 60 seconds (anti brute-force)
    upstashAuthLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "jeda:ratelimit:auth",
      analytics: true,
    });

    // Standard tier: 30 requests per 10 seconds (general API protection)
    upstashApiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "10 s"),
      prefix: "jeda:ratelimit:api",
      analytics: true,
    });
  }

  return {
    auth: upstashAuthLimiter,
    api: upstashApiLimiter,
  };
}

/**
 * Extracts client IP address with proxy / CDN support
 */
export function getClientIp(request: NextRequest): string {
  // Cloudflare Connecting IP
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Standard X-Forwarded-For (take the first IP in chain)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  // Real IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // NextRequest.ip (checked safely for environments where it is defined)
  const reqWithIp = request as unknown as { ip?: string };
  if (reqWithIp.ip) return reqWithIp.ip;

  return "127.0.0.1";
}

/**
 * Checks rate limit for a request.
 * Falls back safely to in-memory sliding window if Upstash Redis credentials are not configured.
 */
export async function checkRateLimit(
  request: NextRequest,
  tier: RateLimitTier = "api",
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const key = `${tier}:${ip}`;

  const limiters = getUpstashLimiters();
  if (limiters) {
    try {
      const limiter = tier === "auth" ? limiters.auth : limiters.api;
      const res = await limiter.limit(key);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: Math.ceil(res.reset / 1000),
      };
    } catch (error) {
      console.warn(
        "[RateLimit] Upstash Redis check failed, falling back to memory:",
        error,
      );
    }
  }

  // In-memory fallback
  const limit = tier === "auth" ? 5 : 30;
  const windowMs = tier === "auth" ? 60 * 1000 : 10 * 1000;
  return memoryRateLimit(key, limit, windowMs);
}
