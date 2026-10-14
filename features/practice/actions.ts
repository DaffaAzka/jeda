"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { siteCopy } from "@/lib/copy/id";
import { PRACTICE } from "@/config/practice";
import {
  startSessionSchema,
  saveAnswerSchema,
  saveErrorTagSchema,
  pauseSessionTimerSchema,
  type StartSessionInput,
} from "@/features/practice/schemas";
import { startSessionService } from "@/features/practice/services/start-session";
import { finishSessionService } from "@/features/practice/services/finish-session";

export interface ImmediateFeedback {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string | null;
}

export async function startSessionAction(
  input: StartSessionInput,
): Promise<{ error?: string; redirectUrl?: string }> {
  const session = await getAuthSession();
  if (!session) {
    return { error: siteCopy.auth.loginRequired };
  }
  if (getUserRole(session.user.role) === "admin") {
    redirect("/dashboard");
  }

  const parsed = startSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? siteCopy.questionBank.genericError };
  }

  const result = await startSessionService(session.user.id, parsed.data);

  if (!result.success) {
    if ("hasActiveSession" in result && result.hasActiveSession) {
      redirect(`/dashboard/sessions/${result.activeSessionId}`);
    }
    return { error: "error" in result ? result.error : siteCopy.questionBank.genericError };
  }

  revalidatePath("/dashboard/study");
  revalidatePath("/dashboard/mock-exam");
  redirect(`/dashboard/sessions/${result.sessionId}`);
}

export async function saveAnswerAction(
  sessionId: string,
  questionId: string,
  selectedOptionId: string | null,
): Promise<{
  success: boolean;
  error?: string;
  expired?: boolean;
  immediateFeedback?: ImmediateFeedback;
}> {
  const authSession = await getAuthSession();
  if (!authSession) {
    return { success: false, error: siteCopy.auth.loginRequired };
  }

  const parsed = saveAnswerSchema.safeParse({
    sessionId,
    questionId,
    selectedOptionId,
  });
  if (!parsed.success) {
    return { success: false, error: siteCopy.practice.saveAnswerError };
  }

  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      mode: true,
      startedAt: true,
      endsAt: true,
      finishedAt: true,
    },
  });

  if (!session || session.userId !== authSession.user.id) {
    return { success: false, error: siteCopy.questionBank.notFound };
  }

  if (session.finishedAt) {
    return { success: false, expired: true };
  }

  const now = new Date();

  // For full_simulation: enforce hard server expiry plus grace seconds
  if (session.mode === "full_simulation" && session.endsAt) {
    const expiryDeadline =
      session.endsAt.getTime() + PRACTICE.answerGraceSeconds * 1000;
    if (now.getTime() > expiryDeadline) {
      await finishSessionService(sessionId, authSession.user.id);
      return { success: false, expired: true };
    }
  }

  // Validate answer belongs to session and option belongs to question
  const answerRecord = await prisma.sessionAnswer.findUnique({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId,
      },
    },
    select: {
      id: true,
      answeredAt: true,
      secondsSpent: true,
    },
  });

  if (!answerRecord) {
    return { success: false, error: siteCopy.questionBank.notFound };
  }

  let selectedOption = null;
  if (selectedOptionId) {
    selectedOption = await prisma.questionOption.findFirst({
      where: {
        id: selectedOptionId,
        questionId,
      },
      select: {
        id: true,
        isCorrect: true,
        question: {
          select: {
            explanation: true,
            options: {
              where: { isCorrect: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!selectedOption) {
      return { success: false, error: siteCopy.questionBank.notFound };
    }
  }

  // Calculate elapsed time from session start
  const elapsedSeconds = Math.max(
    0,
    Math.floor((now.getTime() - session.startedAt.getTime()) / 1000),
  );

  // Approximate time spent on this question
  const lastActivity = answerRecord.answeredAt ?? session.startedAt;
  const deltaSeconds = Math.max(
    1,
    Math.floor((now.getTime() - lastActivity.getTime()) / 1000),
  );
  const secondsSpent = (answerRecord.secondsSpent || 0) + deltaSeconds;

  await prisma.sessionAnswer.update({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId,
      },
    },
    data: {
      selectedOptionId,
      elapsedSeconds,
      secondsSpent,
      answeredAt: now,
    },
  });

  let immediateFeedback: ImmediateFeedback | undefined;
  // In Santai (relaxed) mode, show explanation and answer immediately
  if (session.mode === "relaxed" && selectedOption) {
    const correctOptionId =
      selectedOption.question.options[0]?.id ?? selectedOption.id;
    immediateFeedback = {
      isCorrect: selectedOption.isCorrect,
      correctOptionId,
      explanation: selectedOption.question.explanation,
    };
  }

  return { success: true, immediateFeedback };
}

export async function pauseSessionTimerAction(
  sessionId: string,
  pausedSeconds: number,
): Promise<{ success: boolean; newEndsAt?: string; error?: string }> {
  const authSession = await getAuthSession();
  if (!authSession) {
    return { success: false, error: siteCopy.auth.loginRequired };
  }

  const parsed = pauseSessionTimerSchema.safeParse({ sessionId, pausedSeconds });
  if (!parsed.success) {
    return { success: false, error: siteCopy.questionBank.genericError };
  }

  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      mode: true,
      endsAt: true,
      finishedAt: true,
    },
  });

  if (!session || session.userId !== authSession.user.id || session.finishedAt) {
    return { success: false, error: siteCopy.questionBank.notFound };
  }

  // Only loose/timed mode pauses timer
  if (session.mode !== "timed" || !session.endsAt) {
    return { success: true };
  }

  const clampedPause = Math.min(
    Math.max(1, parsed.data.pausedSeconds),
    PRACTICE.panicMaxSeconds,
  );
  const newEndsAt = new Date(session.endsAt.getTime() + clampedPause * 1000);

  await prisma.tryoutSession.update({
    where: { id: sessionId },
    data: { endsAt: newEndsAt },
  });

  return { success: true, newEndsAt: newEndsAt.toISOString() };
}

export async function finishSessionAction(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const authSession = await getAuthSession();
  if (!authSession) {
    return { success: false, error: siteCopy.auth.loginRequired };
  }

  try {
    await finishSessionService(sessionId, authSession.user.id);
    revalidatePath(`/dashboard/sessions/${sessionId}`);
    revalidatePath(`/dashboard/sessions/${sessionId}/review`);
    revalidatePath("/dashboard/study");
    revalidatePath("/dashboard/mock-exam");
    return { success: true };
  } catch {
    return { success: false, error: siteCopy.questionBank.genericError };
  }
}

export async function saveErrorTagAction(
  sessionId: string,
  questionId: string,
  errorTag: "didnt_know" | "out_of_time" | "panic" | "careless",
): Promise<{ success: boolean; error?: string }> {
  const authSession = await getAuthSession();
  if (!authSession) {
    return { success: false, error: siteCopy.auth.loginRequired };
  }

  const parsed = saveErrorTagSchema.safeParse({ sessionId, questionId, errorTag });
  if (!parsed.success) {
    return { success: false, error: siteCopy.practice.tagSaveError };
  }

  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true, finishedAt: true },
  });

  if (!session || session.userId !== authSession.user.id || !session.finishedAt) {
    return { success: false, error: siteCopy.questionBank.notFound };
  }

  await prisma.sessionAnswer.update({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId,
      },
    },
    data: {
      errorTag: parsed.data.errorTag,
      tagSource: "user",
    },
  });

  revalidatePath(`/dashboard/sessions/${sessionId}/review`);
  return { success: true };
}
