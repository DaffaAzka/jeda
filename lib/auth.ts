import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const secret = process.env.BETTER_AUTH_SECRET;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

export const auth = betterAuth({
  appName: "Jeda",
  baseURL: process.env.BETTER_AUTH_URL,
  secret,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
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
