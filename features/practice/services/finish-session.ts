import "server-only";

import { prisma } from "@/lib/prisma";
import { evaluateSessionAnswers } from "@/lib/practice/scoring";
import { guessErrorTag } from "@/lib/rules/guess-error-tag";
import { RULES } from "@/config/rules";
import type { ErrorCause, TagSource } from "@/app/generated/prisma/enums";

export async function finishSessionService(
  sessionId: string,
  userId?: string,
) {
  const session = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              topicId: true,
              options: {
                select: { id: true, isCorrect: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (userId && session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Idempotency: If already finished, return existing state
  if (session.finishedAt) {
    return {
      success: true,
      alreadyFinished: true,
      score: session.score ? Number(session.score) : 0,
    };
  }

  const now = new Date();

  // Prepare input for pure scoring evaluation
  const evaluationInputs = session.answers.map((ans) => {
    const correctOpt = ans.question.options.find((o) => o.isCorrect);
    return {
      questionId: ans.questionId,
      topicId: ans.question.topicId,
      selectedOptionId: ans.selectedOptionId,
      correctOptionId: correctOpt?.id ?? null,
      elapsedSeconds: ans.elapsedSeconds,
    };
  });

  const { evaluatedAnswers, summary } = evaluateSessionAnswers(evaluationInputs);

  // Calculate average pace for answered questions
  const answeredAnswers = session.answers.filter((a) => a.selectedOptionId !== null);
  const totalElapsedAnswered = answeredAnswers.reduce(
    (acc, a) => acc + (a.secondsSpent > 0 ? a.secondsSpent : a.elapsedSeconds),
    0,
  );
  const averagePaceSeconds =
    answeredAnswers.length > 0
      ? Math.round(totalElapsedAnswered / answeredAnswers.length)
      : 90;

  // Run transaction to persist finishes, answers correctness, error tag guesses, and topic stats
  await prisma.$transaction(async (tx) => {
    // 1. Mark session finished
    await tx.tryoutSession.update({
      where: { id: sessionId },
      data: {
        finishedAt: now,
        score: summary.scorePercentage,
      },
    });

    // 2. Update each answer with correctness and error autopsy guess
    for (const evaluated of evaluatedAnswers) {
      let initialErrorTag: ErrorCause | null = null;
      let tagSource: TagSource | null = null;

      if (!evaluated.isCorrect) {
        initialErrorTag = guessErrorTag(
          {
            isCorrect: false,
            isAnswered: evaluated.isAnswered,
            elapsedSeconds: evaluated.elapsedSeconds,
            timeLimitSeconds: session.timeLimitSeconds,
            averagePaceSeconds,
          },
          RULES.autopsy,
        );
        tagSource = "auto";
      }

      await tx.sessionAnswer.update({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: evaluated.questionId,
          },
        },
        data: {
          isCorrect: evaluated.isCorrect,
          errorTag: initialErrorTag,
          tagSource,
        },
      });
    }

    // 3. Atomically upsert topic stats for topics with answered questions
    for (const delta of summary.topicDeltas) {
      if (delta.attempts <= 0) continue;

      await tx.topicStat.upsert({
        where: {
          userId_topicId: {
            userId: session.userId,
            topicId: delta.topicId,
          },
        },
        create: {
          userId: session.userId,
          topicId: delta.topicId,
          attempts: delta.attempts,
          correct: delta.correct,
          lastPracticedAt: now,
        },
        update: {
          attempts: { increment: delta.attempts },
          correct: { increment: delta.correct },
          lastPracticedAt: now,
        },
      });
    }
  });

  return {
    success: true,
    alreadyFinished: false,
    summary,
  };
}
