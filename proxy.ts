import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, type RateLimitTier } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine rate limit tier based on sensitivity of the endpoint
  const isAuthRoute =
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/register";

  const tier: RateLimitTier = isAuthRoute ? "auth" : "api";
  const rateLimitResult = await checkRateLimit(request, tier);

  const retryAfter = Math.max(
    1,
    rateLimitResult.reset - Math.floor(Date.now() / 1000),
  );

  const rateLimitHeaders = {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Limit": String(rateLimitResult.limit),
    "X-RateLimit-Remaining": String(rateLimitResult.remaining),
    "X-RateLimit-Reset": String(rateLimitResult.reset),
  };

  if (!rateLimitResult.success) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Too Many Requests",
          message:
            "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.",
          retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        },
      );
    }

    return new NextResponse(
      "Terlalu banyak percobaan akses (Rate Limit Exceeded). Silakan coba lagi nanti.",
      {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          ...rateLimitHeaders,
        },
      },
    );
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/login", "/register"],
};
