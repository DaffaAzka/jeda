import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { siteCopy } from "@/lib/copy/id";
import { getStudyHubData } from "@/features/learn/queries";
import { StudyHub } from "@/features/learn/components/study-hub";

export const metadata = {
  title: `${siteCopy.learn.studyTitle} | ${siteCopy.brand}`,
};

export default async function StudyPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) === "admin") redirect("/dashboard");

  const data = await getStudyHubData(session.user.id);

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {siteCopy.learn.studyTitle}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {siteCopy.learn.studyDescription}
          </p>
        </header>

        <StudyHub data={data} />
      </div>
    </main>
  );
}
