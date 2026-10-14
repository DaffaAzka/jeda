import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { getSessionForRunner } from "@/features/practice/queries";
import { finishSessionService } from "@/features/practice/services/finish-session";
import { SessionRunner, type RunnerQuestion } from "@/features/practice/components/session-runner";
import { seededShuffle } from "@/lib/practice/shuffle";
import { PRACTICE } from "@/config/practice";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const metadata = {
  title: "Sesi Pengerjaan | MOODI",
};

export default async function SessionRunnerPage({
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

  const sessionData = await getSessionForRunner(sessionId, authSession.user.id);
  if (!sessionData) {
    notFound();
  }

  // If already finished, redirect to review
  if (sessionData.finishedAt) {
    redirect(`/dashboard/sessions/${sessionId}/review`);
  }

  const now = new Date();

  // Lazy expiry check on full_simulation
  if (sessionData.mode === "full_simulation" && sessionData.endsAt) {
    const deadline =
      sessionData.endsAt.getTime() + PRACTICE.answerGraceSeconds * 1000;
    if (now.getTime() > deadline) {
      await finishSessionService(sessionId, authSession.user.id);
      redirect(`/dashboard/sessions/${sessionId}/review`);
    }
  }

  // Stable seeded shuffle of options per question so order doesn't shift on reload
  const preparedQuestions: RunnerQuestion[] = sessionData.answers.map((ans) => {
    const rawOptions = ans.question.options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      body: opt.body,
    }));

    const shuffled = seededShuffle(
      rawOptions,
      `${sessionData.id}_${ans.question.id}`,
    );

    return {
      id: ans.question.id,
      stem: ans.question.stem,
      imageUrl: ans.question.imageUrl,
      options: shuffled,
    };
  });

  const initialAnswers: Record<string, string | null> = {};
  for (const ans of sessionData.answers) {
    initialAnswers[ans.question.id] = ans.selectedOptionId;
  }

  return (
    <SessionRunner
      endsAt={sessionData.endsAt ? sessionData.endsAt.toISOString() : null}
      initialAnswers={initialAnswers}
      mode={sessionData.mode}
      questions={preparedQuestions}
      serverNow={now.toISOString()}
      sessionId={sessionData.id}
      startedAt={sessionData.startedAt.toISOString()}
      subtestName={sessionData.subtest?.name ?? "Latihan UTBK"}
      topicName={sessionData.topic?.name ?? null}
    />
  );
}
