import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getActiveSession } from "@/features/practice/queries";

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

export const getStudentDashboardData = cache(async (userId: string) => {
  const today = getStartOfToday();

  const [user, todayCheckinRaw, todayPlan, recentCheckinsRaw, activeSession] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          studentProfile: {
            select: {
              targetUniversity: true,
              targetMajor: true,
              examDate: true,
              wellbeingConsent: true,
              consentedAt: true,
            },
          },
        },
      }),
      prisma.checkin.findUnique({
        where: {
          userId_checkinDate: {
            userId,
            checkinDate: today,
          },
        },
      }),
      prisma.dailyPlan.findUnique({
        where: {
          userId_planDate: {
            userId,
            planDate: today,
          },
        },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
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
          },
        },
      }),
      prisma.checkin.findMany({
        where: { userId },
        orderBy: { checkinDate: "desc" },
        take: 14,
      }),
      getActiveSession(userId),
    ]);

  const todayCheckin = todayCheckinRaw
    ? {
        ...todayCheckinRaw,
        sleepHours: Number(todayCheckinRaw.sleepHours),
      }
    : null;

  const recentCheckins = recentCheckinsRaw.map((c) => ({
    ...c,
    sleepHours: Number(c.sleepHours),
  }));

  // Calculate days left to exam
  let daysUntilExam: number | null = null;
  if (user?.studentProfile?.examDate) {
    const examTime = new Date(user.studentProfile.examDate).getTime();
    const nowTime = today.getTime();
    const diffDays = Math.ceil((examTime - nowTime) / (1000 * 60 * 60 * 24));
    daysUntilExam = diffDays > 0 ? diffDays : 0;
  }

  return {
    user,
    profile: user?.studentProfile ?? null,
    todayCheckin,
    todayPlan,
    recentCheckins,
    activeSession,
    daysUntilExam,
  };
});

export type StudentDashboardData = Awaited<
  ReturnType<typeof getStudentDashboardData>
>;
