import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getActiveSession = cache(async (userId: string) => {
  return prisma.tryoutSession.findFirst({
    where: {
      userId,
      finishedAt: null,
    },
    select: {
      id: true,
      mode: true,
      startedAt: true,
      endsAt: true,
      timeLimitSeconds: true,
      subtest: {
        select: { id: true, name: true, code: true },
      },
      topic: {
        select: { id: true, name: true },
      },
      _count: {
        select: { answers: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });
});

export const getStudyCatalogData = cache(async (userId: string) => {
  const [subtestsWithTopics, topicStats, activeSession] = await Promise.all([
    prisma.subtest.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        topics: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                questions: {
                  where: { isPublished: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.topicStat.findMany({
      where: { userId },
      select: {
        topicId: true,
        attempts: true,
        correct: true,
      },
    }),
    getActiveSession(userId),
  ]);

  const statsMap = new Map(
    topicStats.map((s) => [s.topicId, { attempts: s.attempts, correct: s.correct }]),
  );

  // Filter out topics with 0 published questions, and subtests with no active topics
  const catalog = subtestsWithTopics
    .map((subtest) => {
      const activeTopics = subtest.topics
        .filter((t) => t._count.questions > 0)
        .map((t) => {
          const stats = statsMap.get(t.id);
          const attempts = stats?.attempts ?? 0;
          const correct = stats?.correct ?? 0;
          const accuracy =
            attempts > 0 ? Math.round((correct / attempts) * 100) : null;

          return {
            id: t.id,
            name: t.name,
            questionCount: t._count.questions,
            attempts,
            correct,
            accuracy,
          };
        });

      return {
        id: subtest.id,
        name: subtest.name,
        code: subtest.code,
        topics: activeTopics,
      };
    })
    .filter((s) => s.topics.length > 0);

  return {
    catalog,
    activeSession,
  };
});

export const getMockExamData = cache(async (userId: string) => {
  const [subtests, recentSessions, activeSession] = await Promise.all([
    prisma.subtest.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        defaultSeconds: true,
        topics: {
          select: {
            _count: {
              select: {
                questions: {
                  where: { isPublished: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.tryoutSession.findMany({
      where: {
        userId,
        finishedAt: { not: null },
      },
      orderBy: { finishedAt: "desc" },
      take: 5,
      select: {
        id: true,
        mode: true,
        startedAt: true,
        finishedAt: true,
        score: true,
        subtest: {
          select: { id: true, name: true, code: true },
        },
        topic: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
    }),
    getActiveSession(userId),
  ]);

  const subtestsWithCounts = subtests
    .map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      defaultSeconds: s.defaultSeconds,
      questionCount: s.topics.reduce((acc, t) => acc + t._count.questions, 0),
    }))
    .filter((s) => s.questionCount > 0);

  const formattedRecentSessions = recentSessions.map((s) => ({
    ...s,
    score: s.score !== null ? Number(s.score) : null,
  }));

  return {
    subtests: subtestsWithCounts,
    recentSessions: formattedRecentSessions,
    activeSession,
  };
});

export const getSessionForRunner = cache(
  async (sessionId: string, userId: string) => {
    const session = await prisma.tryoutSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        mode: true,
        startedAt: true,
        endsAt: true,
        finishedAt: true,
        timeLimitSeconds: true,
        subtest: {
          select: { id: true, name: true, code: true },
        },
        topic: {
          select: { id: true, name: true },
        },
        answers: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            questionId: true,
            sortOrder: true,
            selectedOptionId: true,
            elapsedSeconds: true,
            secondsSpent: true,
            question: {
              select: {
                id: true,
                stem: true,
                imageUrl: true,
                options: {
                  orderBy: { label: "asc" },
                  select: {
                    id: true,
                    label: true,
                    body: true,
                    // isCorrect is NOT included in runner payload
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.userId !== userId) {
      return null;
    }

    return session;
  },
);

export const getSessionReviewData = cache(
  async (sessionId: string, userId: string) => {
    const session = await prisma.tryoutSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        mode: true,
        startedAt: true,
        finishedAt: true,
        timeLimitSeconds: true,
        score: true,
        subtest: {
          select: { id: true, name: true, code: true },
        },
        topic: {
          select: { id: true, name: true },
        },
        answers: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            questionId: true,
            sortOrder: true,
            selectedOptionId: true,
            isCorrect: true,
            elapsedSeconds: true,
            secondsSpent: true,
            errorTag: true,
            tagSource: true,
            question: {
              select: {
                id: true,
                stem: true,
                imageUrl: true,
                explanation: true,
                topic: {
                  select: { id: true, name: true },
                },
                options: {
                  orderBy: { label: "asc" },
                  select: {
                    id: true,
                    label: true,
                    body: true,
                    isCorrect: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.userId !== userId || !session.finishedAt) {
      return null;
    }

    return {
      ...session,
      score: session.score !== null ? Number(session.score) : null,
    };
  },
);

export type StudyCatalogData = Awaited<ReturnType<typeof getStudyCatalogData>>;
export type MockExamData = Awaited<ReturnType<typeof getMockExamData>>;
export type SessionRunnerData = NonNullable<
  Awaited<ReturnType<typeof getSessionForRunner>>
>;
export type SessionReviewData = NonNullable<
  Awaited<ReturnType<typeof getSessionReviewData>>
>;
