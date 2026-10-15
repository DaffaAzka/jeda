import Link from "next/link";
import type { QuestionBankCounts } from "@/features/question-bank/queries";
import { siteCopy } from "@/lib/copy/id";
import { ArrowRightIcon } from "@/components/icons";

const copy = siteCopy.questionBank;

export function StudentDashboard({ userName }: { userName: string }) {
  const roleCopy = siteCopy.dashboard.roles.student;

  return (
    <main className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-8">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-pixelify text-3xl leading-tight sm:text-4xl">
          {roleCopy.title}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {roleCopy.greeting} {userName}
        </p>

        <div className="mt-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0_var(--border)] sm:p-10">
          <h2 className="font-pixelify text-2xl sm:text-3xl">
            {roleCopy.emptyTitle}
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            {roleCopy.emptyDescription}
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center border-2 border-border px-4 font-semibold text-link underline underline-offset-4"
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
      detail: `${subtestCount} subtes aktif`,
      accent: "bg-moodi-sky",
    },
    {
      label: copy.manageTopics,
      description: copy.manageTopicsDesc,
      href: "/dashboard/question-bank/topics",
      count: topicCount,
      detail: `${topicCount} topik terdaftar`,
      accent: "bg-moodi-butter",
    },
    {
      label: copy.manageQuestions,
      description: copy.manageQuestionsDesc,
      href: "/dashboard/question-bank/questions",
      count: publishedCount + draftCount,
      detail: `${publishedCount} terbit · ${draftCount} draf`,
      accent: "bg-moodi-peach",
    },
  ];

  return (
    <main className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-8">
      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-pixelify text-3xl leading-tight sm:text-4xl">
          {roleCopy.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {roleCopy.greeting} {userName} · {roleCopy.roleLabel}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              className="pixel-press pixel-shadow group flex flex-col justify-between border-2 border-border bg-card p-5"
              href={link.href}
              key={link.label}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block border border-border px-3 py-1 font-pixelify text-2xl font-bold text-ink ${link.accent}`}
                  >
                    {link.count}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {link.detail}
                  </span>
                </div>
                <h2 className="mt-4 font-pixelify text-xl font-bold text-foreground group-hover:underline">
                  {link.label}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {link.description}
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1 border-t border-border/40 pt-3 text-xs font-bold text-link">
                <span>Kelola</span>
                <ArrowRightIcon className="size-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
