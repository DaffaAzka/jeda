import Link from "next/link";
import type { QuestionBankCounts } from "@/features/question-bank/queries";
import { siteCopy } from "@/lib/copy/id";

const copy = siteCopy.questionBank;

export function StudentDashboard({ userName }: { userName: string }) {
  const roleCopy = siteCopy.dashboard.roles.student;

  return (
    <main className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-8">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-muted-foreground">
          {roleCopy.label}
        </p>
        <h1 className="mt-2 font-pixelify text-4xl leading-tight sm:text-5xl">
          {roleCopy.title}
        </h1>
        <p className="mt-4 text-lg">
          {roleCopy.greeting} {userName}
        </p>
        <p className="mt-2 inline-flex border border-border bg-muted px-2 py-1 text-xs font-semibold">
          {roleCopy.roleLabel}
        </p>

        <div className="mt-10 border-2 border-border bg-card p-6 shadow-[6px_6px_0_var(--border)] sm:p-10">
          <div
            aria-hidden="true"
            className="mb-6 grid h-16 w-16 place-items-center border-2 border-border bg-moodi-butter font-pixelify text-3xl text-ink"
          >
            ···
          </div>
          <h2 className="font-pixelify text-2xl sm:text-3xl">
            {roleCopy.emptyTitle}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            {roleCopy.emptyDescription}
          </p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center border-2 border-border px-4 font-semibold text-link underline underline-offset-4"
            href="/"
          >
            {siteCopy.dashboard.homeLink}
          </Link>
        </div>
      </section>
    </main>
  );
}

export function AdminDashboard({
  userName,
  counts,
}: {
  userName: string;
  counts: QuestionBankCounts;
}) {
  const roleCopy = siteCopy.dashboard.roles.admin;
  const { subtestCount, topicCount, publishedCount, draftCount } = counts;

  const quickLinks = [
    {
      label: copy.manageSubtests,
      description: copy.manageSubtestsDesc,
      href: "/dashboard/question-bank/subtests",
      count: subtestCount,
      accent: "bg-moodi-sky",
    },
    {
      label: copy.manageTopics,
      description: copy.manageTopicsDesc,
      href: "/dashboard/question-bank/topics",
      count: topicCount,
      accent: "bg-moodi-butter",
    },
    {
      label: copy.manageQuestions,
      description: copy.manageQuestionsDesc,
      href: "/dashboard/question-bank/questions",
      count: publishedCount + draftCount,
      accent: "bg-moodi-peach",
    },
  ];

  return (
    <main className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-8">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold text-muted-foreground">
          {roleCopy.label}
        </p>
        <h1 className="mt-2 font-pixelify text-4xl leading-tight sm:text-5xl">
          {roleCopy.title}
        </h1>
        <p className="mt-4 text-lg">
          {roleCopy.greeting} {userName}
        </p>
        <p className="mt-2 inline-flex border border-border bg-muted px-2 py-1 text-xs font-semibold">
          {roleCopy.roleLabel}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: copy.statsSubtests,
              value: subtestCount,
              accent: "bg-moodi-sky",
            },
            {
              label: copy.statsTopics,
              value: topicCount,
              accent: "bg-moodi-butter",
            },
            {
              label: copy.statsPublished,
              value: publishedCount,
              accent: "bg-moodi-pink",
            },
            {
              label: copy.statsDraft,
              value: draftCount,
              accent: "bg-moodi-peach",
            },
          ].map((stat) => (
            <div className="pixel-border bg-card p-4" key={stat.label}>
              <span
                className={`inline-block px-2 font-pixelify text-3xl text-ink ${stat.accent}`}
              >
                {stat.value}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-pixelify text-2xl">
          {copy.quickActionsLabel}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              className="group pixel-border pixel-shadow flex flex-col gap-3 bg-card p-5 transition-transform hover:-translate-y-0.5"
              href={link.href}
              key={link.label}
            >
              <span
                className={`inline-block self-start px-3 py-1 font-pixelify text-lg text-ink ${link.accent}`}
              >
                {link.count}
              </span>
              <div>
                <p className="font-semibold group-hover:underline">
                  {link.label}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {link.description}
                </p>
              </div>
              <span className="mt-auto text-sm font-semibold text-link">
                Buka →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
