import "server-only";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";

/** Call inside a Suspense-wrapped server component, never at the page top level,
 *  so the static page shell can render before the session is read. */
export async function requireAdminPage() {
  const session = await getAuthSession();

  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  return session;
}
