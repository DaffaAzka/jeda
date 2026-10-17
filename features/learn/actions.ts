"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { validateLexicalState } from "@/lib/editor/validate-lexical";
import {
  lessonFormSchema,
  reorderLessonSchema,
  lessonCheckSubmissionSchema,
  type LessonFormInput,
  type ReorderLessonInput,
  type LessonCheckSubmissionInput,
} from "./schemas";

class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

async function requireAdmin() {
  const session = await getAuthSession();
  if (!session) {
    throw new ActionError("Sesi telah berakhir. Silakan masuk kembali.");
  }
  if (getUserRole(session.user.role) !== "admin") {
    throw new ActionError("Aksi ini hanya dapat dilakukan oleh administrator.");
  }
  return session;
}

async function requireStudent() {
  const session = await getAuthSession();
  if (!session) {
    throw new ActionError("Sesi telah berakhir. Silakan masuk kembali.");
  }
  return session;
}

export async function saveLessonAction(rawInput: unknown) {
  try {
    await requireAdmin();

    const parsed = lessonFormSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return { error: firstIssue?.message ?? "Data materi tidak valid" };
    }

    const { id, topicId, title, summary, estMinutes, content, checkQuestionIds } =
      parsed.data;

    // Validate Lexical editor state
    let contentJson: unknown;
    try {
      contentJson = typeof content === "string" ? JSON.parse(content) : content;
      validateLexicalState(contentJson);
    } catch (e: any) {
      return { error: `Format dokumen materi tidak valid: ${e.message}` };
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
    if (!topic) {
      return { error: "Topik tidak ditemukan." };
    }

    let savedLessonId: string;

    if (id) {
      // Update existing
      const existing = await prisma.lesson.findUnique({
        where: { id },
        select: { id: true, source: true },
      });
      if (!existing) {
        return { error: "Materi tidak ditemukan." };
      }

      await prisma.$transaction(async (tx) => {
        await tx.lesson.update({
          where: { id },
          data: {
            title,
            summary: summary || null,
            estMinutes,
            content: contentJson as any,
          },
        });

        // Re-link check questions
        await tx.lessonQuestion.deleteMany({
          where: { lessonId: id },
        });

        if (checkQuestionIds.length > 0) {
          await tx.lessonQuestion.createMany({
            data: checkQuestionIds.map((qid, idx) => ({
              lessonId: id,
              questionId: qid,
              sortOrder: idx,
            })),
          });
        }
      });

      savedLessonId = id;
    } else {
      // Create new
      const lastLesson = await prisma.lesson.findFirst({
        where: { topicId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const nextOrder = (lastLesson?.sortOrder ?? -1) + 1;

      const created = await prisma.$transaction(async (tx) => {
        const lesson = await tx.lesson.create({
          data: {
            topicId,
            title,
            summary: summary || null,
            estMinutes,
            content: contentJson as any,
            sortOrder: nextOrder,
            status: "draft",
            source: "manual",
          },
        });

        if (checkQuestionIds.length > 0) {
          await tx.lessonQuestion.createMany({
            data: checkQuestionIds.map((qid, idx) => ({
              lessonId: lesson.id,
              questionId: qid,
              sortOrder: idx,
            })),
          });
        }

        return lesson;
      });

      savedLessonId = created.id;
    }

    revalidatePath(`/dashboard/question-bank/topics/${topicId}/lessons`);
    revalidatePath(`/dashboard/study`);
    revalidatePath(`/dashboard/study/lessons/${savedLessonId}`);

    return { success: true, lessonId: savedLessonId };
  } catch (err: any) {
    return { error: err.message || "Gagal menyimpan materi." };
  }
}

export async function toggleLessonPublishAction(lessonId: string) {
  try {
    await requireAdmin();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, status: true, topicId: true, source: true, reviewedAt: true },
    });
    if (!lesson) {
      return { error: "Materi tidak ditemukan." };
    }

    const nextStatus = lesson.status === "published" ? "draft" : "published";
    const reviewedAt =
      nextStatus === "published" && lesson.source === "ai_assisted" && !lesson.reviewedAt
        ? new Date()
        : lesson.reviewedAt;

    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        status: nextStatus,
        reviewedAt,
      },
    });

    revalidatePath(`/dashboard/question-bank/topics/${lesson.topicId}/lessons`);
    revalidatePath(`/dashboard/study`);
    revalidatePath(`/dashboard/study/lessons/${lessonId}`);

    return { success: true, status: nextStatus };
  } catch (err: any) {
    return { error: err.message || "Gagal mengubah status publikasi materi." };
  }
}

export async function deleteLessonAction(lessonId: string) {
  try {
    await requireAdmin();

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, topicId: true },
    });
    if (!lesson) {
      return { error: "Materi tidak ditemukan." };
    }

    await prisma.lesson.delete({
      where: { id: lessonId },
    });

    revalidatePath(`/dashboard/question-bank/topics/${lesson.topicId}/lessons`);
    revalidatePath(`/dashboard/study`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menghapus materi." };
  }
}

export async function reorderLessonAction(rawInput: unknown) {
  try {
    await requireAdmin();

    const parsed = reorderLessonSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: "Parameter pengurutan materi tidak valid." };
    }

    const { topicId, lessonId, direction } = parsed.data;

    const lessons = await prisma.lesson.findMany({
      where: { topicId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, sortOrder: true },
    });

    const currentIndex = lessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) {
      return { error: "Materi tidak ditemukan di topik ini." };
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) {
      return { success: true }; // already at edge
    }

    const currentLesson = lessons[currentIndex];
    const targetLesson = lessons[targetIndex];

    await prisma.$transaction([
      prisma.lesson.update({
        where: { id: currentLesson.id },
        data: { sortOrder: targetLesson.sortOrder },
      }),
      prisma.lesson.update({
        where: { id: targetLesson.id },
        data: { sortOrder: currentLesson.sortOrder },
      }),
    ]);

    revalidatePath(`/dashboard/question-bank/topics/${topicId}/lessons`);
    revalidatePath(`/dashboard/study`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal mengubah urutan materi." };
  }
}

export async function markLessonViewedAction(lessonId: string) {
  try {
    const session = await getAuthSession();
    if (!session) return { success: false };

    const userId = session.user.id;

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        status: "in_progress",
        lastViewedAt: new Date(),
        firstViewedAt: new Date(),
      },
      update: {
        lastViewedAt: new Date(),
      },
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markLessonCompletedAction(lessonId: string) {
  try {
    const session = await requireStudent();
    const userId = session.user.id;

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        status: "completed",
        completedAt: new Date(),
        lastViewedAt: new Date(),
        firstViewedAt: new Date(),
      },
      update: {
        status: "completed",
        completedAt: new Date(),
        lastViewedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/study`);
    revalidatePath(`/dashboard/study/lessons/${lessonId}`);

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menandai materi selesai." };
  }
}

export async function submitCheckAnswersAction(rawInput: unknown) {
  try {
    const session = await requireStudent();
    const userId = session.user.id;

    const parsed = lessonCheckSubmissionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: "Format jawaban cek pemahaman tidak valid." };
    }

    const { lessonId, answers } = parsed.data;

    const checkQuestions = await prisma.lessonQuestion.findMany({
      where: { lessonId },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (checkQuestions.length === 0) {
      return { success: true, correctCount: 0, totalCount: 0 };
    }

    let correctCount = 0;
    const totalCount = checkQuestions.length;

    for (const lq of checkQuestions) {
      const selectedOptionId = answers[lq.questionId];
      if (selectedOptionId) {
        const correctOption = lq.question.options.find((opt) => opt.isCorrect);
        if (correctOption && correctOption.id === selectedOptionId) {
          correctCount++;
        }
      }
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      create: {
        userId,
        lessonId,
        status: "in_progress",
        checkCorrect: correctCount,
        checkTotal: totalCount,
        lastViewedAt: new Date(),
      },
      update: {
        checkCorrect: correctCount,
        checkTotal: totalCount,
        lastViewedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/study`);
    revalidatePath(`/dashboard/study/lessons/${lessonId}`);

    return { success: true, correctCount, totalCount };
  } catch (err: any) {
    return { error: err.message || "Gagal menyimpan hasil cek pemahaman." };
  }
}
