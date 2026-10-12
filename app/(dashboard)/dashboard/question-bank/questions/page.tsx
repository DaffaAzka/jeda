import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteQuestion } from "@/features/question-bank/actions";
import { MutationForm } from "@/features/question-bank/components/mutation-form";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { prisma } from "@/lib/prisma";
import { getUserRole } from "@/lib/user-role";

const copy = siteCopy.questionBank;

export const metadata = {
  title: `${copy.questionsTitle} | ${siteCopy.brand}`,
};

function QuestionPreview({ value }: { value: string }) {
  try {
    const parsed: unknown = JSON.parse(value);
    const collectText = (node: unknown): string => {
      if (!node || typeof node !== "object") return "";
      const record = node as Record<string, unknown>;
      if (record.type === "text" && typeof record.text === "string") {
        return record.text;
      }
      if (
        (record.type === "inlineMath" || record.type === "blockMath") &&
        record.attrs &&
        typeof record.attrs === "object" &&
        "latex" in record.attrs &&
        typeof record.attrs.latex === "string"
      ) {
        return `$${record.attrs.latex}$`;
      }
      if (Array.isArray(record.content)) {
        return record.content.map(collectText).join(" ");
      }
      return "";
    };

    return collectText(parsed) || copy.editorPlaceholder;
  } catch {
    return value;
  }
}

export default async function QuestionsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const questions = await prisma.question.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      stem: true,
      difficulty: true,
      isPublished: true,
      topic: {
        select: {
          name: true,
          subtest: { select: { name: true } },
        },
      },
      _count: { select: { options: true } },
    },
  });

  return (
    <main className="min-w-0 flex-1 px-4 pb-24 py-8 sm:px-6 lg:px-10 lg:pb-8">
      <div className="mx-auto max-w-6xl">
        <Link
          className="text-sm font-semibold text-link underline underline-offset-4"
          href="/dashboard/question-bank"
        >
          {copy.backToBank}
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-pixelify text-4xl leading-tight sm:text-5xl">
              {copy.questionsTitle}
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              {copy.questionsDescription}
            </p>
          </div>
          <Link
            className="pixel-shadow-sm inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky px-4 font-semibold text-ink"
            href="/dashboard/question-bank/questions/new"
          >
            {copy.addQuestion}
          </Link>
        </div>

        {!questions.length ? (
          <p className="mt-6 border-2 border-border bg-muted p-4">
            {copy.emptyQuestions}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {questions.map((question, index) => (
              <article
                className="flex flex-col gap-4 border-2 border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                key={question.id}
              >
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {question.topic.subtest.name} / {question.topic.name} ·{" "}
                    {question.isPublished
                      ? copy.statusPublished
                      : copy.statusDraft}
                  </p>
                  <p className="mt-1 line-clamp-2 font-medium">
                    {copy.questionNumber} {index + 1}:{" "}
                    {QuestionPreview({ value: question.stem })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question._count.options} {copy.optionCount} ·{" "}
                    {copy.difficulty} {question.difficulty}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    className="inline-flex min-h-10 items-center border-2 border-border px-3 text-sm font-semibold hover:bg-muted"
                    href={`/dashboard/question-bank/questions/${question.id}/edit`}
                  >
                    {copy.edit}
                  </Link>
                  <MutationForm
                    action={deleteQuestion}
                    buttonLabel={copy.delete}
                    className="flex items-center"
                    destructive
                  >
                    <input name="id" type="hidden" value={question.id} />
                  </MutationForm>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
