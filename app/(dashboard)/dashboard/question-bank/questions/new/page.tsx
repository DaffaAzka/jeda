import Link from "next/link";
import { redirect } from "next/navigation";
import { QuestionForm } from "@/features/question-bank/components/question-form";
import { getQuestionTopicChoices } from "@/features/question-bank/queries";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

export const metadata = {
  title: `${siteCopy.questionBank.createQuestion} | ${siteCopy.brand}`,
};

export default async function NewQuestionPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const topicChoices = await getQuestionTopicChoices();

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
          {siteCopy.questionBank.createQuestion}
        </h1>
        <div className="mt-8">
          <QuestionForm topics={topicChoices} />
        </div>
      </div>
    </main>
  );
}
