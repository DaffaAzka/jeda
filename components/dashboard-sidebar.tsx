import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteCopy } from "@/lib/copy/id";

function NavigationIcon({ icon }: { icon: string }) {
  const iconPaths: Record<string, string> = {
    home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
    book: "M4 4h7v16H4zm9 0h7v16h-7zM6 7h3m7 0h3",
    timer: "M9 2h6m-3 4v2m7.07.93 1.41-1.41M12 10v4l3 2m5-2a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    chart: "M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z",
    calm: "M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12M9 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z",
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={iconPaths[icon] ?? iconPaths.home} />
    </svg>
  );
}

function DashboardNavigation({ mobile = false }: { mobile?: boolean }) {
  const navigation = siteCopy.dashboard.navigation;

  return (
    <ul className={mobile ? "grid grid-cols-5" : "flex flex-col gap-2"}>
      {navigation.map((item) => (
        <li className={mobile ? "min-w-0" : ""} key={item.label}>
          {item.available ? (
            <Link
              aria-current="page"
              className={
                mobile
                  ? "flex min-h-16 flex-col items-center justify-center gap-1 border-t-4 border-moodi-sky bg-muted px-1 text-center text-xs font-semibold text-foreground"
                  : "flex min-h-12 items-center gap-3 border-2 border-border bg-moodi-sky px-3 font-semibold text-ink shadow-[2px_2px_0_var(--border)]"
              }
              href="/dashboard"
            >
              <NavigationIcon icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          ) : (
            <div
              aria-disabled="true"
              className={
                mobile
                  ? "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-xs text-muted-foreground"
                  : "flex min-h-12 items-center gap-3 border-2 border-transparent px-3 text-muted-foreground"
              }
              title={siteCopy.dashboard.comingSoon}
            >
              <NavigationIcon icon={item.icon} />
              <span className={mobile ? "leading-none" : "flex-1"}>
                {item.label}
              </span>
              {!mobile && (
                <span className="text-xs">
                  {siteCopy.dashboard.comingSoon}
                </span>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function DashboardSidebar() {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r-2 border-border bg-card px-5 py-6 lg:flex">
        <Link
          className="font-pixelify text-2xl font-bold tracking-wide"
          href="/dashboard"
        >
          {siteCopy.brand}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          {siteCopy.dashboard.dashboardLabel}
        </p>

        <div className="mt-9">
          <nav aria-label={siteCopy.dashboard.navigationLabel}>
            <DashboardNavigation />
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-5">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>

      <nav
        aria-label={siteCopy.dashboard.navigationLabel}
        className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <DashboardNavigation mobile />
      </nav>
    </>
  );
}
