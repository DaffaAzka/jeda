import Link from "next/link";
import { redirect } from "next/navigation";
import { TopicsManager } from "@/features/question-bank/components/topics-manager";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { prisma } from "@/lib/prisma";
import { getUserRole } from "@/lib/user-role";

const copy = siteCopy.questionBank;

export const metadata = {
  title: `${copy.topicsTitle} | ${siteCopy.brand}`,
};

export default async function TopicsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const subtests = await prisma.subtest.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      topics: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          subtestId: true,
          _count: { select: { questions: true } },
        },
      },
    },
  });

  // Flatten to a plain list for the client component
  const topics = subtests.flatMap((s) =>
    s.topics.map((t) => ({
      id: t.id,
      name: t.name,
      subtestId: t.subtestId,
      subtestName: s.name,
      questionCount: t._count.questions,
    })),
  );

  const subtestOptions = subtests.map((s) => ({ id: s.id, name: s.name }));

  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-semibold text-link underline underline-offset-4"
          href="/dashboard/question-bank"
        >
          ← {copy.backToBank}
        </Link>
        <h1 className="mt-4 font-pixelify text-4xl leading-tight sm:text-5xl">
          {copy.topicsTitle}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.topicsDescription}
        </p>

        <div className="mt-8">
          <TopicsManager subtests={subtestOptions} topics={topics} />
        </div>
      </div>
    </main>
  );
}
