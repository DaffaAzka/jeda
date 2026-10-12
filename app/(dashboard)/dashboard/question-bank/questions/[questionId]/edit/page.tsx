import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuestionForm } from "@/features/question-bank/components/question-form";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { prisma } from "@/lib/prisma";
import { getUserRole } from "@/lib/user-role";

export const metadata = {
  title: `${siteCopy.questionBank.editQuestion} | ${siteCopy.brand}`,
};

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const { questionId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      questionId,
    )
  ) {
    notFound();
  }

  const [question, topics] = await Promise.all([
    prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { label: "asc" } } },
    }),
    prisma.topic.findMany({
      orderBy: [{ subtest: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        subtest: { select: { name: true } },
      },
    }),
  ]);
  if (!question) notFound();

  const topicChoices = topics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    subtestName: topic.subtest.name,
  }));
  const initialQuestion = {
    id: question.id,
    topicId: question.topicId,
    difficulty: question.difficulty,
    stem: question.stem,
    imageUrl: question.imageUrl,
    explanation: question.explanation,
    expectedSeconds: question.expectedSeconds,
    isPublished: question.isPublished,
    options: question.options.map((option) => ({
      id: option.id,
      body: option.body,
      label: option.label,
      isCorrect: option.isCorrect,
    })),
  };

  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-4xl">
        <Link
          className="text-sm font-semibold text-link underline underline-offset-4"
          href="/dashboard/question-bank"
        >
          {siteCopy.questionBank.backToBank}
        </Link>
        <h1 className="mt-4 font-pixelify text-4xl">
          {siteCopy.questionBank.editQuestion}
        </h1>
        <div className="mt-8">
          <QuestionForm question={initialQuestion} topics={topicChoices} />
        </div>
      </div>
    </main>
  );
}
