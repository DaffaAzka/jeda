import Link from "next/link";
import { redirect } from "next/navigation";
import { TopicsManager } from "@/features/question-bank/components/topics-manager";
import { getTopicManagerData } from "@/features/question-bank/queries";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

const copy = siteCopy.questionBank;

export const metadata = {
  title: `${copy.topicsTitle} | ${siteCopy.brand}`,
};

export default async function TopicsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const { subtests, topics } = await getTopicManagerData();

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
          <TopicsManager subtests={subtests} topics={topics} />
        </div>
      </div>
    </main>
  );
}
