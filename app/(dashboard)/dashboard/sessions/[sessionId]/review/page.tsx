import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { getSessionReviewData } from "@/features/practice/queries";
import { ReviewList } from "@/features/practice/components/review-list";
import { siteCopy } from "@/lib/copy/id";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata = {
  title: `${siteCopy.practice.reviewTitle} | ${siteCopy.brand}`,
};

export default async function SessionReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const authSession = await getAuthSession();
  if (!authSession) redirect("/login");
  if (getUserRole(authSession.user.role) === "admin") redirect("/dashboard");

  const { sessionId } = await params;
  if (!uuidPattern.test(sessionId)) {
    notFound();
  }

  const sessionData = await getSessionReviewData(sessionId, authSession.user.id);
  if (!sessionData) {
    notFound();
  }

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <ReviewList session={sessionData} />
      </div>
    </main>
  );
}
