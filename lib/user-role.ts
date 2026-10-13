import type { UserRole as PrismaUserRole } from "@/app/generated/prisma/client";

export type { UserRole } from "@/app/generated/prisma/client";

export const userRoles = ["student", "admin"] as const;

const validUserRoles = userRoles satisfies readonly PrismaUserRole[];

export function getUserRole(
  role: string | null | undefined,
): PrismaUserRole {
  const matchedRole = validUserRoles.find((userRole) => userRole === role);

  if (matchedRole) {
    return matchedRole;
  }

  throw new Error(`Unexpected user role in auth session: ${role ?? "missing"}`);
}
