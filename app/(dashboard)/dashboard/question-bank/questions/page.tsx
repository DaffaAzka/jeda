import Link from "next/link";
import { redirect } from "next/navigation";
import { QuestionsList } from "@/features/question-bank/components/questions-list";
import { getQuestions } from "@/features/question-bank/queries";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

const copy = siteCopy.questionBank;

export const metadata = {
  title: `${copy.questionsTitle} | ${siteCopy.brand}`,
};

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const { page: rawPage } = await searchParams;
  const requestedPage = Number(rawPage ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { questions, hasNextPage } = await getQuestions(page);

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

        <QuestionsList
          hasNextPage={hasNextPage}
          page={page}
          questions={questions}
        />
      </div>
    </main>
  );
}
