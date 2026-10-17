import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { siteCopy } from "@/lib/copy/id";
import {
  getAdminTopicLessonsData,
  getAdminLessonDetail,
} from "@/features/learn/queries";
import { AdminLessonForm } from "@/features/learn/components/admin-lesson-form";
import type { SerializedEditorStateJson } from "@/lib/editor/validate-lexical";

interface EditLessonPageProps {
  params: Promise<{
    topicId: string;
    lessonId: string;
  }>;
}

export async function generateMetadata({ params }: EditLessonPageProps) {
  const { lessonId } = await params;
  const lesson = await getAdminLessonDetail(lessonId);
  return {
    title: `${siteCopy.questionBank.editLesson} - ${lesson?.title ?? "Materi"} | ${siteCopy.brand}`,
  };
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { topicId, lessonId } = await params;
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (getUserRole(session.user.role) !== "admin") redirect("/dashboard");

  const [topicData, lesson] = await Promise.all([
    getAdminTopicLessonsData(topicId),
    getAdminLessonDetail(lessonId),
  ]);

  if (!topicData || !lesson || lesson.topicId !== topicId) {
    notFound();
  }

  const initialData = {
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    estMinutes: lesson.estMinutes,
    content: lesson.content as SerializedEditorStateJson | string,
    checkQuestionIds: lesson.checkQuestions.map((cq) => cq.questionId),
  };

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <div className="mx-auto max-w-5xl">
        <AdminLessonForm
          initialData={initialData}
          subtestName={topicData.topic.subtestName}
          topicId={topicData.topic.id}
          topicName={topicData.topic.name}
          topicQuestions={topicData.topicQuestions}
        />
      </div>
    </main>
  );
}
