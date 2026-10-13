import { redirect } from "next/navigation";
import { QuestionBankOverview } from "@/features/question-bank/components/question-bank-overview";
import { getQuestionBankCounts } from "@/features/question-bank/queries";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

export const metadata = {
  title: `${siteCopy.questionBank.title} | ${siteCopy.brand}`,
};

export default async function QuestionBankPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const counts = await getQuestionBankCounts();
  return <QuestionBankOverview counts={counts} />;
}
