import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  StudyHubData,
  LessonDetailData,
  AdminTopicLessonsData,
  AdminLessonListItem,
  ResumeLessonData,
  StudentSubtestItem,
  StudentTopicItem,
  StudentLessonItem,
  CheckQuestionData,
} from "./types";
import type { SerializedEditorStateJson } from "@/lib/editor/validate-lexical";

export const getStudyHubData = cache(async (userId: string): Promise<StudyHubData> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch user lesson progress
  const allProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    select: {
      lessonId: true,
      status: true,
      lastViewedAt: true,
      completedAt: true,
    },
  });

  const progressMap = new Map(
    allProgress.map((p) => [
      p.lessonId,
      {
        status: p.status,
        lastViewedAt: p.lastViewedAt,
        completedAt: p.completedAt,
      },
    ]),
  );

  // 2. Resume lesson (last viewed unfinished lesson)
  const lastUnfinished = await prisma.lessonProgress.findFirst({
    where: {
      userId,
      status: "in_progress",
      lesson: {
        status: "published",
      },
    },
    orderBy: { lastViewedAt: "desc" },
    include: {
      lesson: {
        include: {
          topic: {
            include: {
              subtest: true,
            },
          },
        },
      },
    },
  });

  let resumeLesson: ResumeLessonData | null = null;
  if (lastUnfinished) {
    resumeLesson = {
      lessonId: lastUnfinished.lesson.id,
      lessonTitle: lastUnfinished.lesson.title,
      topicId: lastUnfinished.lesson.topic.id,
      topicName: lastUnfinished.lesson.topic.name,
      subtestName: lastUnfinished.lesson.topic.subtest.name,
      estMinutes: lastUnfinished.lesson.estMinutes,
      lastViewedAt: lastUnfinished.lastViewedAt,
    };
  }

  // 3. Recommended lessons from today's plan
  const todayPlan = await prisma.dailyPlan.findUnique({
    where: {
      userId_planDate: {
        userId,
        planDate: today,
      },
    },
    include: {
      tasks: {
        where: {
          type: "lesson",
          lessonId: { not: null },
        },
        include: {
          lesson: {
            include: {
              topic: {
                include: {
                  subtest: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const recommendedLessons: StudyHubData["recommendedLessons"] = [];

  if (todayPlan && todayPlan.tasks.length > 0) {
    for (const task of todayPlan.tasks) {
      if (task.lesson && task.lesson.status === "published") {
        recommendedLessons.push({
          lessonId: task.lesson.id,
          lessonTitle: task.lesson.title,
          topicId: task.lesson.topic.id,
          topicName: task.lesson.topic.name,
          subtestName: task.lesson.topic.subtest.name,
          estMinutes: task.lesson.estMinutes,
          reason: task.reason,
        });
      }
    }
  }

  // If no recommendations from daily plan, fallback to topics with low accuracy or first unfinished
  if (recommendedLessons.length === 0) {
    const fallbackLessons = await prisma.lesson.findMany({
      where: {
        status: "published",
        progress: {
          none: {
            userId,
            status: "completed",
          },
        },
      },
      take: 2,
      orderBy: { sortOrder: "asc" },
      include: {
        topic: {
          include: {
            subtest: true,
          },
        },
      },
    });

    for (const l of fallbackLessons) {
      recommendedLessons.push({
        lessonId: l.id,
        lessonTitle: l.title,
        topicId: l.topic.id,
        topicName: l.topic.name,
        subtestName: l.topic.subtest.name,
        estMinutes: l.estMinutes,
        reason: "Materi yang siap dipelajari untuk memperkuat konsep dasar.",
      });
    }
  }

  // 4. Subtests, topics, and lessons tree
  const subtests = await prisma.subtest.findMany({
    orderBy: { name: "asc" },
    include: {
      topics: {
        orderBy: { name: "asc" },
        include: {
          lessons: {
            where: { status: "published" },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              estMinutes: true,
              sortOrder: true,
              status: true,
            },
          },
        },
      },
    },
  });

  let totalLessonsCount = 0;
  let totalCompletedLessonsCount = 0;

  const formattedSubtests: StudentSubtestItem[] = subtests
    .map((subtest) => {
      let subtestCompleted = 0;
      let subtestTotal = 0;

      const topics: StudentTopicItem[] = subtest.topics
        .map((topic) => {
          let topicCompleted = 0;
          const topicLessons: StudentLessonItem[] = topic.lessons.map((lesson) => {
            const p = progressMap.get(lesson.id);
            const isCompleted = p?.status === "completed";
            if (isCompleted) {
              topicCompleted++;
            }
            return {
              id: lesson.id,
              title: lesson.title,
              summary: lesson.summary,
              estMinutes: lesson.estMinutes,
              sortOrder: lesson.sortOrder,
              status: lesson.status,
              progressStatus: p?.status,
              completedAt: p?.completedAt,
            };
          });

          subtestCompleted += topicCompleted;
          subtestTotal += topicLessons.length;

          return {
            id: topic.id,
            name: topic.name,
            subtestId: subtest.id,
            subtestName: subtest.name,
            lessons: topicLessons,
            completedCount: topicCompleted,
            totalCount: topicLessons.length,
          };
        })
        .filter((t) => t.totalCount > 0);

      totalLessonsCount += subtestTotal;
      totalCompletedLessonsCount += subtestCompleted;

      return {
        id: subtest.id,
        code: subtest.code,
        name: subtest.name,
        topics,
        completedLessons: subtestCompleted,
        totalLessons: subtestTotal,
      };
    })
    .filter((s) => s.totalLessons > 0);

  return {
    resumeLesson,
    recommendedLessons,
    subtests: formattedSubtests,
    totalLessons: totalLessonsCount,
    completedLessons: totalCompletedLessonsCount,
  };
});

export const getLessonDetailData = cache(
  async (lessonId: string, userId?: string): Promise<LessonDetailData | null> => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        topic: {
          include: {
            subtest: true,
          },
        },
        checkQuestions: {
          orderBy: { sortOrder: "asc" },
          include: {
            question: {
              include: {
                options: {
                  orderBy: { label: "asc" },
                },
              },
            },
          },
        },
        progress: userId
          ? {
              where: { userId },
            }
          : false,
      },
    });

    if (!lesson) {
      return null;
    }

    // Find next and previous published lessons in this topic
    const [prevLesson, nextLesson] = await Promise.all([
      prisma.lesson.findFirst({
        where: {
          topicId: lesson.topicId,
          status: "published",
          sortOrder: { lt: lesson.sortOrder },
        },
        orderBy: { sortOrder: "desc" },
        select: { id: true },
      }),
      prisma.lesson.findFirst({
        where: {
          topicId: lesson.topicId,
          status: "published",
          sortOrder: { gt: lesson.sortOrder },
        },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      }),
    ]);

    const userProgress = lesson.progress?.[0] ?? null;

    const checkQuestions: CheckQuestionData[] = lesson.checkQuestions.map((lq) => ({
      id: lq.question.id,
      stem: lq.question.stem,
      explanation: lq.question.explanation,
      sortOrder: lq.sortOrder,
      options: lq.question.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        body: opt.body,
        isCorrect: opt.isCorrect,
      })),
    }));

    return {
      id: lesson.id,
      topicId: lesson.topicId,
      topicName: lesson.topic.name,
      subtestId: lesson.topic.subtestId,
      subtestName: lesson.topic.subtest.name,
      title: lesson.title,
      summary: lesson.summary,
      content: lesson.content as SerializedEditorStateJson | string,
      estMinutes: lesson.estMinutes,
      source: lesson.source,
      reviewedAt: lesson.reviewedAt,
      sortOrder: lesson.sortOrder,
      nextLessonId: nextLesson?.id ?? null,
      prevLessonId: prevLesson?.id ?? null,
      progress: userProgress
        ? {
            status: userProgress.status,
            checkCorrect: userProgress.checkCorrect,
            checkTotal: userProgress.checkTotal,
            completedAt: userProgress.completedAt,
          }
        : null,
      checkQuestions,
    };
  },
);

export const getAdminTopicLessonsData = cache(
  async (topicId: string): Promise<AdminTopicLessonsData | null> => {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subtest: true,
        lessons: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: { checkQuestions: true },
            },
          },
        },
        questions: {
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            stem: true,
            difficulty: true,
            isPublished: true,
          },
        },
      },
    });

    if (!topic) return null;

    const lessons: AdminLessonListItem[] = topic.lessons.map((l) => ({
      id: l.id,
      topicId: l.topicId,
      title: l.title,
      summary: l.summary,
      estMinutes: l.estMinutes,
      sortOrder: l.sortOrder,
      status: l.status,
      source: l.source,
      reviewedAt: l.reviewedAt,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      checkQuestionsCount: l._count.checkQuestions,
    }));

    return {
      topic: {
        id: topic.id,
        name: topic.name,
        subtestId: topic.subtestId,
        subtestName: topic.subtest.name,
      },
      lessons,
      topicQuestions: topic.questions,
    };
  },
);

export const getAdminLessonDetail = cache(async (lessonId: string) => {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      topic: {
        include: {
          subtest: true,
        },
      },
      checkQuestions: {
        orderBy: { sortOrder: "asc" },
        select: {
          questionId: true,
          sortOrder: true,
        },
      },
    },
  });
});
