import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  AdminDashboard,
  StudentDashboard,
} from "@/features/dashboard/components/dashboard-home";
import { getQuestionBankCounts } from "@/features/question-bank/queries";
import { getAuthSession } from "@/lib/auth-session";
import { siteCopy } from "@/lib/copy/id";
import { getUserRole } from "@/lib/user-role";

export const metadata = {
  title: `${siteCopy.dashboard.title} | ${siteCopy.brand}`,
};

export default function DashboardRoutePage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const role = getUserRole(session.user.role);
  if (role === "student") {
    return <StudentDashboard userName={session.user.name} />;
  }

  const counts = await getQuestionBankCounts();
  return <AdminDashboard counts={counts} userName={session.user.name} />;
}
