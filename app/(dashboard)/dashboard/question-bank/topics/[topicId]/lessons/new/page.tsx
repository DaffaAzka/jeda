import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { siteCopy } from "@/lib/copy/id";
import { getAdminTopicLessonsData } from "@/features/learn/queries";
import { AdminLessonForm } from "@/features/learn/components/admin-lesson-form";

interface NewLessonPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export async function generateMetadata({ params }: NewLessonPageProps) {
  const { topicId } = await params;
  const data = await getAdminTopicLessonsData(topicId);
  return {
    title: `${siteCopy.questionBank.addLesson} - ${data?.topic.name ?? "Topik"} | ${siteCopy.brand}`,
  };
}

export default async function NewLessonPage({ params }: NewLessonPageProps) {
  const { topicId } = await params;
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const data = await getAdminTopicLessonsData(topicId);
  if (!data) {
    notFound();
  }

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto max-w-5xl">
        <AdminLessonForm
          subtestName={data.topic.subtestName}
          topicId={data.topic.id}
          topicName={data.topic.name}
          topicQuestions={data.topicQuestions}
        />
      </div>
    </main>
  );
}
