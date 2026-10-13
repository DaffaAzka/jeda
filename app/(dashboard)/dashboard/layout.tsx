import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AuthenticatedDashboardLayout>{children}</AuthenticatedDashboardLayout>
    </Suspense>
  );
}

async function AuthenticatedDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  const role = getUserRole(session.user.role);

  return (
    <div className="flex min-h-screen flex-1 bg-background">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background lg:hidden">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <Link
              className="font-pixelify text-2xl font-bold tracking-wide"
              href="/dashboard"
            >
              {siteCopy.brand}
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
