import Link from "next/link";
import { redirect } from "next/navigation";
import { SubtestsManager } from "@/features/question-bank/components/subtests-manager";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { prisma } from "@/lib/prisma";
import { getUserRole } from "@/lib/user-role";

const copy = siteCopy.questionBank;

export const metadata = {
  title: `${copy.subtestsTitle} | ${siteCopy.brand}`,
};

export default async function SubtestsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const subtests = await prisma.subtest.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      defaultSeconds: true,
      _count: { select: { topics: true } },
    },
  });

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
          {copy.subtestsTitle}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {copy.subtestsDescription}
        </p>

        <div className="mt-8">
          <SubtestsManager subtests={subtests} />
        </div>
      </div>
    </main>
  );
}
