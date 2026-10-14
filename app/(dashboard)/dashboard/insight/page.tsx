import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getInsightDashboardData } from "@/features/insight/queries";
import { InsightDashboard } from "@/features/insight/components/insight-dashboard";
import { siteCopy } from "@/lib/copy/id";

export const metadata = {
  title: `Insight & Evaluasi | ${siteCopy.brand}`,
};

export default async function InsightPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const data = await getInsightDashboardData(session.user.id);

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto max-w-5xl">
        <InsightDashboard data={data} />
      </div>
    </main>
  );
}
