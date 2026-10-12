export const userRoles = ["student", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

export function getUserRole(
  role: string | null | undefined,
): UserRole {
  const matchedRole = userRoles.find((userRole) => userRole === role);

  if (matchedRole) {
    return matchedRole;
  }

  throw new Error(`Unexpected user role in auth session: ${role ?? "missing"}`);
}
