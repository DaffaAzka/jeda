import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { siteCopy } from "@/lib/copy/id";
import { getLessonDetailData } from "@/features/learn/queries";
import { LessonView } from "@/features/learn/components/lesson-view";

interface LessonPageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

export async function generateMetadata({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const session = await getAuthSession();
  const lesson = await getLessonDetailData(lessonId, session?.user.id);
  if (!lesson) return { title: `Materi | ${siteCopy.brand}` };

  return {
    title: `${lesson.title} | ${siteCopy.brand}`,
    description: lesson.summary ?? undefined,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const isAdmin = getUserRole(session.user.role) === "admin";
  const lesson = await getLessonDetailData(lessonId, session.user.id);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="min-w-0 flex-1 px-4 py-8 pb-24 sm:px-6 lg:px-10 lg:pb-12">
      <LessonView lesson={lesson} />
    </main>
  );
}
