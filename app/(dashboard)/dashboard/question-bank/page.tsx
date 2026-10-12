import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { prisma } from "@/lib/prisma";
import { getUserRole } from "@/lib/user-role";

const copy = siteCopy.questionBank;

export const metadata = {
  title: `${copy.title} | ${siteCopy.brand}`,
};

export default async function QuestionBankPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const [subtestCount, topicCount, publishedCount, draftCount] =
    await Promise.all([
      prisma.subtest.count(),
      prisma.topic.count(),
      prisma.question.count({ where: { isPublished: true } }),
      prisma.question.count({ where: { isPublished: false } }),
    ]);

  const totalQuestions = publishedCount + draftCount;

  const stats = [
    {
      label: copy.statsSubtests,
      value: subtestCount,
      accent: "bg-moodi-sky",
      href: "/dashboard/question-bank/subtests",
    },
    {
      label: copy.statsTopics,
      value: topicCount,
      accent: "bg-moodi-butter",
      href: "/dashboard/question-bank/topics",
    },
    {
      label: copy.statsQuestions,
      value: totalQuestions,
      accent: "bg-moodi-peach",
      href: "/dashboard/question-bank/questions",
    },
    {
      label: copy.statsPublished,
      value: publishedCount,
      accent: "bg-moodi-pink",
      href: "/dashboard/question-bank/questions",
    },
  ];

  const quickActions = [
    {
      label: copy.manageSubtests,
      description: copy.manageSubtestsDesc,
      href: "/dashboard/question-bank/subtests",
      accent: "bg-moodi-sky",
      icon: "S",
    },
    {
      label: copy.manageTopics,
      description: copy.manageTopicsDesc,
      href: "/dashboard/question-bank/topics",
      accent: "bg-moodi-butter",
      icon: "T",
    },
    {
      label: copy.manageQuestions,
      description: copy.manageQuestionsDesc,
      href: "/dashboard/question-bank/questions",
      accent: "bg-moodi-peach",
      icon: "Q",
    },
  ];

  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-link">{copy.title}</p>
        <h1 className="mt-2 font-pixelify text-4xl leading-tight sm:text-5xl">
          {copy.overviewLabel}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          {copy.overviewDescription}
        </p>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Link
              className="group pixel-border pixel-shadow flex flex-col gap-2 bg-card p-5 transition-transform hover:-translate-y-0.5"
              href={stat.href}
              key={stat.label}
            >
              <span
                className={`inline-grid h-10 w-10 place-items-center border-2 border-border font-pixelify text-xl text-ink ${stat.accent}`}
              >
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">
                {stat.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <section className="mt-12" id="quick-actions">
          <h2 className="font-pixelify text-2xl">{copy.quickActionsLabel}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                className="group pixel-border pixel-shadow flex flex-col gap-4 bg-card p-6 transition-transform hover:-translate-y-0.5"
                href={action.href}
                key={action.label}
              >
                <span
                  className={`inline-grid h-12 w-12 place-items-center border-2 border-border font-pixelify text-2xl text-ink ${action.accent}`}
                >
                  {action.icon}
                </span>
                <div>
                  <p className="font-pixelify text-xl group-hover:underline">
                    {action.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-link">
                  Buka →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
