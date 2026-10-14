import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/features/dashboard/components/dashboard-home";
import { getStudentDashboardData } from "@/features/checkin/queries";
import { StudentDashboardHub } from "@/features/checkin/components/student-dashboard-hub";
import { getQuestionBankCounts } from "@/features/question-bank/queries";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

export const metadata = {
  title: `${siteCopy.dashboard.title} | ${siteCopy.brand}`,
};

export default function DashboardRoutePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const role = getUserRole(session.user.role);
  if (role === "student") {
    const data = await getStudentDashboardData(session.user.id);
    return (
      <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
        <div className="mx-auto max-w-5xl">
          <StudentDashboardHub data={data} />
        </div>
      </main>
    );
  }

  const counts = await getQuestionBankCounts();
  return <AdminDashboard counts={counts} userName={session.user.name} />;
}

function DashboardSkeleton() {
  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12 animate-pulse">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="h-44 border-2 border-border bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-48 border-2 border-border bg-muted/50" />
          <div className="h-48 border-2 border-border bg-muted/50" />
          <div className="h-48 border-2 border-border bg-muted/50" />
        </div>
      </div>
    </main>
  );
}
