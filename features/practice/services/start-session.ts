import "server-only";

import { prisma } from "@/lib/prisma";
import { siteCopy } from "@/lib/copy/id";
import { getTimerPlan, normalizeLevel } from "@/lib/practice/level-policy";
import { isQuestionReady } from "@/lib/practice/question-ready";
import { PRACTICE } from "@/config/practice";
import type { StartSessionInput } from "@/features/practice/schemas";

export type StartSessionResult =
  | { success: true; sessionId: string; message?: string }
  | { success: false; hasActiveSession: true; activeSessionId: string; message: string }
  | { success: false; error: string };

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}

export async function startSessionService(
  userId: string,
  input: StartSessionInput,
): Promise<StartSessionResult> {
  const now = new Date();

  // 1. Check if user already has an unfinished active session
  const activeSession = await prisma.tryoutSession.findFirst({
    where: {
      userId,
      finishedAt: null,
    },
    select: {
      id: true,
      mode: true,
      endsAt: true,
    },
    orderBy: { startedAt: "desc" },
  });

  if (activeSession) {
    // If it was a timed session and endsAt has passed (plus grace seconds),
    // we let it be finalized or resume. But if still within time or relaxed, offer resume.
    const isExpired =
      activeSession.endsAt &&
      activeSession.endsAt.getTime() + PRACTICE.answerGraceSeconds * 1000 < now.getTime();

    if (!isExpired) {
      return {
        success: false,
        hasActiveSession: true,
        activeSessionId: activeSession.id,
        message: siteCopy.practice.activeSessionFound,
      };
    }
  }

  // 2. Resolve scope and subtest limit
  let subtestId: string;
  let topicId: string | null = null;
  let baseLimitSeconds: number;

  if (input.scopeType === "topic") {
    const topic = await prisma.topic.findUnique({
      where: { id: input.scopeId },
      select: {
        id: true,
        subtestId: true,
        subtest: { select: { id: true, defaultSeconds: true } },
      },
    });

    if (!topic) {
      return { success: false, error: siteCopy.questionBank.notFound };
    }

    subtestId = topic.subtestId;
    topicId = topic.id;
    baseLimitSeconds = topic.subtest.defaultSeconds;
  } else {
    const subtest = await prisma.subtest.findUnique({
      where: { id: input.scopeId },
      select: { id: true, defaultSeconds: true },
    });

    if (!subtest) {
      return { success: false, error: siteCopy.questionBank.notFound };
    }

    subtestId = subtest.id;
    baseLimitSeconds = subtest.defaultSeconds;
  }

  // 3. Load candidate questions with correct options
  const candidateQuestions = await prisma.question.findMany({
    where:
      input.scopeType === "topic"
        ? {
            topicId: input.scopeId,
            isPublished: true,
            options: { some: { isCorrect: true } },
          }
        : {
            topic: { subtestId: input.scopeId },
            isPublished: true,
            options: { some: { isCorrect: true } },
          },
    select: {
      id: true,
      isPublished: true,
      stem: true,
      options: {
        select: { id: true, isCorrect: true, body: true },
      },
    },
  });

  // Filter with isQuestionReady
  const readyQuestions = candidateQuestions.filter((q) => isQuestionReady(q));

  if (readyQuestions.length === 0) {
    return {
      success: false,
      error: siteCopy.practice.notEnoughQuestions,
    };
  }

  // Determine question count
  const requestedCap =
    input.scopeType === "topic"
      ? (input.questionCount ?? PRACTICE.studyQuestionPresets[0] ?? 5)
      : Math.min(
          input.questionCount ?? PRACTICE.mockExamMaxQuestions,
          PRACTICE.mockExamMaxQuestions,
        );

  const selectedCount = Math.min(requestedCap, readyQuestions.length);
  const shuffledCandidates = shuffleArray(readyQuestions);
  const chosenQuestions = shuffledCandidates.slice(0, selectedCount);

  // 4. Calculate timer plan
  const normalizedLevel = normalizeLevel(input.level);

  // For topic practice, scale limit proportionally if needed, or use subtest limit
  const limitSecondsForSession =
    input.scopeType === "topic"
      ? Math.min(baseLimitSeconds, chosenQuestions.length * 90)
      : baseLimitSeconds;

  const timerPlan = getTimerPlan(normalizedLevel, limitSecondsForSession);
  const endsAt = timerPlan.limitSeconds
    ? new Date(now.getTime() + timerPlan.limitSeconds * 1000)
    : null;

  // 5. Create session & answer rows atomically
  const session = await prisma.$transaction(async (tx) => {
    const newSession = await tx.tryoutSession.create({
      data: {
        userId,
        subtestId,
        topicId,
        mode: normalizedLevel,
        timeLimitSeconds: timerPlan.limitSeconds,
        startedAt: now,
        endsAt,
      },
      select: { id: true },
    });

    await tx.sessionAnswer.createMany({
      data: chosenQuestions.map((q, index) => ({
        sessionId: newSession.id,
        questionId: q.id,
        sortOrder: index,
        secondsSpent: 0,
        elapsedSeconds: 0,
        isCorrect: false,
      })),
    });

    return newSession;
  });

  const message =
    selectedCount < requestedCap
      ? siteCopy.practice.fewerQuestionsUsed.replace(
          "{available}",
          String(selectedCount),
        )
      : undefined;

  return {
    success: true,
    sessionId: session.id,
    message,
  };
}
