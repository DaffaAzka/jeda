import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { proxy } from "@/proxy";

describe("Rate Limiting & Security", () => {
  describe("getClientIp", () => {
    it("extracts cf-connecting-ip first if present", () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "cf-connecting-ip": "203.0.113.195",
          "x-forwarded-for": "198.51.100.1, 198.51.100.2",
          "x-real-ip": "192.0.2.1",
        },
      });
      expect(getClientIp(req)).toBe("203.0.113.195");
    });

    it("extracts first ip from x-forwarded-for if cf-connecting-ip is missing", () => {
      const req = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          "x-forwarded-for": "198.51.100.42, 10.0.0.1",
        },
      });
      expect(getClientIp(req)).toBe("198.51.100.42");
    });

    it("falls back to 127.0.0.1 when no ip headers exist", () => {
      const req = new NextRequest("http://localhost:3000/api/test");
      expect(getClientIp(req)).toBe("127.0.0.1");
    });
  });

  describe("In-memory rate limit enforcement", () => {
    it("enforces auth tier limit of 5 requests", async () => {
      const uniqueIp = "192.168.100.1";
      const makeReq = () =>
        new NextRequest("http://localhost:3000/login", {
          headers: { "x-forwarded-for": uniqueIp },
        });

      // Requests 1 to 5 should succeed
      for (let i = 0; i < 5; i++) {
        const res = await checkRateLimit(makeReq(), "auth");
        expect(res.success).toBe(true);
        expect(res.remaining).toBe(4 - i);
      }

      // 6th request must fail
      const sixth = await checkRateLimit(makeReq(), "auth");
      expect(sixth.success).toBe(false);
      expect(sixth.remaining).toBe(0);
    });

    it("proxy function returns 429 when rate limit is exceeded on /api/test", async () => {
      const uniqueIp = "192.168.200.2";
      const makeReq = () =>
        new NextRequest("http://localhost:3000/api/auth/sign-in", {
          headers: { "x-forwarded-for": uniqueIp },
        });

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        const res = await proxy(makeReq());
        expect(res.status).toBe(200);
      }

      // Next request through proxy should return 429
      const blockedRes = await proxy(makeReq());
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();
      expect(blockedRes.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(blockedRes.headers.get("X-RateLimit-Remaining")).toBe("0");

      const body = await blockedRes.json();
      expect(body.error).toBe("Too Many Requests");
    });
  });
});
