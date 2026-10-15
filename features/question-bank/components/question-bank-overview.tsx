import Link from "next/link";
import type { QuestionBankCounts } from "@/features/question-bank/queries";
import { siteCopy } from "@/lib/copy/id";
import { ArrowRightIcon } from "@/components/icons";

interface QuestionBankOverviewProps {
  counts: QuestionBankCounts;
}

export function QuestionBankOverview({ counts }: QuestionBankOverviewProps) {
  const copy = siteCopy.questionBank;
  const { subtestCount, topicCount, publishedCount, draftCount } = counts;
  const totalQuestions = publishedCount + draftCount;

  const quickActions = [
    {
      label: copy.subtestsTitle,
      description: copy.subtestsDescription,
      href: "/dashboard/question-bank/subtests",
      count: subtestCount,
      detail: `${subtestCount} subtes aktif`,
      accent: "bg-moodi-sky",
    },
    {
      label: copy.topicsTitle,
      description: copy.topicsDescription,
      href: "/dashboard/question-bank/topics",
      count: topicCount,
      detail: `${topicCount} topik terdaftar`,
      accent: "bg-moodi-butter",
    },
    {
      label: copy.questionsTitle,
      description: copy.questionsDescription,
      href: "/dashboard/question-bank/questions",
      count: totalQuestions,
      detail: `${publishedCount} terbit · ${draftCount} draf`,
      accent: "bg-moodi-peach",
    },
  ];

  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-pixelify text-3xl leading-tight sm:text-4xl">
          {copy.overviewLabel}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {copy.overviewDescription}
        </p>

        <section className="mt-8" id="quick-actions">
          <div className="grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                className="pixel-press pixel-shadow group flex flex-col justify-between border-2 border-border bg-card p-5"
                href={action.href}
                key={action.label}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block border border-border px-3 py-1 font-pixelify text-2xl font-bold text-ink ${action.accent}`}
                    >
                      {action.count}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {action.detail}
                    </span>
                  </div>
                  <h2 className="mt-4 font-pixelify text-xl font-bold text-foreground group-hover:underline">
                    {action.label}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {action.description}
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
      </div>
    </main>
  );
}
