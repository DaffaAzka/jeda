import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";

export const metadata = {
  title: `${siteCopy.dashboard.title} | ${siteCopy.brand}`,
};

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  const copy = siteCopy.dashboard;

  return (
    <div className="flex flex-1 bg-background">
      <DashboardSidebar />
      <main className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <Link
              className="font-pixelify text-2xl font-bold tracking-wide lg:hidden"
              href="/dashboard"
            >
              {siteCopy.brand}
            </Link>
            <span className="hidden font-semibold lg:inline">
              {copy.dashboardLabel}
            </span>
            <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:hidden">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold text-muted-foreground">
            {copy.dashboardLabel}
          </p>
          <h1 className="mt-2 font-pixelify text-4xl leading-tight sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-lg">
            {copy.greeting} {session.user.name}
          </p>

          <div className="mt-10 border-2 border-border bg-card p-6 shadow-[6px_6px_0_var(--border)] sm:p-10">
            <div
              aria-hidden="true"
              className="mb-6 grid h-16 w-16 place-items-center border-2 border-border bg-moodi-butter font-pixelify text-3xl text-ink"
            >
              ···
            </div>
            <h2 className="font-pixelify text-2xl sm:text-3xl">
              {copy.emptyTitle}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              {copy.emptyDescription}
            </p>
            <Link
              className="mt-7 inline-flex min-h-11 items-center border-2 border-border px-4 font-semibold text-link underline underline-offset-4"
              href="/"
            >
              {copy.homeLink}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
