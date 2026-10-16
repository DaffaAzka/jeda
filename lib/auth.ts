import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { captcha } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

const turnstileSecretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
const plugins = [];

if (turnstileSecretKey) {
  plugins.push(
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: turnstileSecretKey,
    }),
  );
}

export const auth = betterAuth({
  appName: "MOODI",
  baseURL: process.env.BETTER_AUTH_URL,
  secret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: {
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.ENABLE_AUTH_RATE_LIMIT === "true",
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/change-password": {
        window: 60,
        max: 3,
      },
    },
  },
  plugins,
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
    },
  },
});

