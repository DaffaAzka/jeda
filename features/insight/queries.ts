import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { RULES } from "@/config/rules";

export const getInsightDashboardData = cache(async (userId: string) => {
  const [checkinsRaw, errorTagsRaw, topicStatsRaw, tryoutSessionsRaw] =
    await Promise.all([
      prisma.checkin.findMany({
        where: { userId },
        orderBy: { checkinDate: "desc" },
        take: 14,
      }),
      prisma.sessionAnswer.groupBy({
        by: ["errorTag"],
        where: {
          session: { userId },
          errorTag: { not: null },
        },
        _count: { id: true },
      }),
      prisma.topicStat.findMany({
        where: { userId },
        orderBy: [{ attempts: "desc" }],
        take: 15,
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              subtest: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      }),
      prisma.tryoutSession.findMany({
        where: {
          userId,
          finishedAt: { not: null },
          score: { not: null },
        },
        orderBy: { finishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          startedAt: true,
          finishedAt: true,
          score: true,
        },
      }),
    ]);

  const checkins = checkinsRaw
    .map((c) => ({
      ...c,
      sleepHours: Number(c.sleepHours),
    }))
    .reverse(); // chronological for charting

  const errorSpread = errorTagsRaw
    .filter((e) => e.errorTag !== null)
    .map((e) => ({
      tag: e.errorTag!,
      count: e._count.id,
    }));

  const topicMastery = topicStatsRaw.map((ts) => {
    const accuracy =
      ts.attempts > 0 ? Math.round((ts.correct / ts.attempts) * 100) : 0;
    return {
      topicId: ts.topic.id,
      topicName: ts.topic.name,
      subtestName: ts.topic.subtest.name,
      subtestCode: ts.topic.subtest.code,
      attempts: ts.attempts,
      correct: ts.correct,
      accuracy,
    };
  });

  const tryoutScores = tryoutSessionsRaw.map((s) => ({
    id: s.id,
    date: s.finishedAt,
    score: s.score !== null ? Number(s.score) : 0,
  }));

  const hasEnoughCheckins = checkins.length >= RULES.insights.minCheckins;

  return {
    hasEnoughCheckins,
    totalCheckins: checkins.length,
    minRequired: RULES.insights.minCheckins,
    checkins,
    errorSpread,
    topicMastery,
    tryoutScores,
  };
});

export type InsightDashboardData = Awaited<
  ReturnType<typeof getInsightDashboardData>
>;
