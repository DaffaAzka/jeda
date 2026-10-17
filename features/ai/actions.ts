"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import { AI_CONFIG } from "@/config/ai";
import { getGeminiModel } from "./client";
import { generateLessonDraft } from "./generate-lesson";
import { generateQuestionsDraft } from "./generate-questions";
import { blocksToLexicalState } from "./blocks-to-lexical";

class AiActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiActionError";
  }
}

async function requireAdmin() {
  const session = await getAuthSession();
  if (!session) {
    throw new AiActionError("Sesi telah berakhir. Silakan masuk kembali.");
  }
  if (getUserRole(session.user.role) !== "admin") {
    throw new AiActionError("Fitur AI authoring hanya dapat diakses oleh administrator.");
  }
  return session;
}

export async function checkAdminHourlyLimit(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentCount = await prisma.aiGeneration.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });

  return recentCount < AI_CONFIG.requestsPerAdminPerHour;
}

export async function generateLessonWithAiAction(input: {
  topicId: string;
  brief?: string;
}) {
  const session = await requireAdmin();
  const userId = session.user.id;
  const topicId = input.topicId.trim();
  const brief = (input.brief || "").trim();
  const modelName = getGeminiModel();

  // Hourly rate limit check
  const isAllowed = await checkAdminHourlyLimit(userId);
  if (!isAllowed) {
    return {
      error: `Batas kuota tercapai (maksimal ${AI_CONFIG.requestsPerAdminPerHour} pembuatan draf per jam). Silakan coba lagi nanti.`,
    };
  }

  try {
    const result = await generateLessonDraft(topicId, brief);

    // Convert structured blocks into validated Lexical JSON AST
    const lexicalContent = blocksToLexicalState(result.draft.blocks);

    // Calculate sort order
    const lastLesson = await prisma.lesson.findFirst({
      where: { topicId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextOrder = (lastLesson?.sortOrder ?? -1) + 1;

    // Save lesson as unpublished draft with source = "ai_assisted"
    const lesson = await prisma.lesson.create({
      data: {
        topicId,
        title: result.draft.title,
        summary: result.draft.summary || null,
        estMinutes: result.draft.estMinutes,
        content: lexicalContent as any,
        sortOrder: nextOrder,
        status: "draft",
        source: "ai_assisted",
      },
    });

    // Record generation audit row
    await prisma.aiGeneration.create({
      data: {
        userId,
        topicId,
        kind: "lesson_draft",
        status: "succeeded",
        model: result.model,
        params: {
          topicId,
          briefChars: brief.length,
          title: result.draft.title,
        },
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
      },
    });

    revalidatePath(`/dashboard/question-bank/topics/${topicId}/lessons`);
    revalidatePath(`/dashboard/study`);

    return {
      success: true,
      lessonId: lesson.id,
      topicId,
      title: lesson.title,
    };
  } catch (err: any) {
    // Record failed generation
    await prisma.aiGeneration.create({
      data: {
        userId,
        topicId,
        kind: "lesson_draft",
        status: "failed",
        model: modelName,
        params: { topicId, briefChars: brief.length },
        errorCode: err.name || "GENERATION_FAILED",
      },
    });

    return {
      error: err.message || "Gagal menyusun draf materi dengan AI. Silakan coba lagi.",
    };
  }
}

export async function generateQuestionsWithAiAction(input: {
  topicId: string;
  count?: number;
  difficulty?: number;
  brief?: string;
  lessonIdToLink?: string;
}) {
  const session = await requireAdmin();
  const userId = session.user.id;
  const topicId = input.topicId.trim();
  const count = input.count ?? 5;
  const difficulty = input.difficulty;
  const brief = (input.brief || "").trim();
  const modelName = getGeminiModel();

  // Hourly rate limit check
  const isAllowed = await checkAdminHourlyLimit(userId);
  if (!isAllowed) {
    return {
      error: `Batas kuota tercapai (maksimal ${AI_CONFIG.requestsPerAdminPerHour} pembuatan draf per jam). Silakan coba lagi nanti.`,
    };
  }

  try {
    const result = await generateQuestionsDraft(
      topicId,
      count,
      difficulty,
      brief,
    );

    if (result.validQuestions.length === 0) {
      throw new Error(
        "Semua soal yang dihasilkan tidak lolos validasi (format LaTeX atau duplikat). Silakan coba lagi.",
      );
    }

    // Insert valid questions as unpublished drafts with source = "ai_assisted"
    const createdQuestionIds: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const q of result.validQuestions) {
        const created = await tx.question.create({
          data: {
            topicId,
            stem: q.stem,
            explanation: q.explanation,
            difficulty: q.difficulty,
            expectedSeconds: q.expectedSeconds,
            isPublished: false,
            source: "ai_assisted",
            options: {
              create: q.options.map((opt) => ({
                label: opt.label,
                body: opt.body,
                isCorrect: opt.isCorrect,
              })),
            },
          },
        });
        createdQuestionIds.push(created.id);
      }

      // If requested to link to a lesson (e.g. check questions for a lesson)
      if (input.lessonIdToLink && createdQuestionIds.length > 0) {
        const existingLinks = await tx.lessonQuestion.count({
          where: { lessonId: input.lessonIdToLink },
        });

        const linksToCreate = createdQuestionIds.slice(0, 5 - existingLinks);
        for (let i = 0; i < linksToCreate.length; i++) {
          await tx.lessonQuestion.create({
            data: {
              lessonId: input.lessonIdToLink,
              questionId: linksToCreate[i],
              sortOrder: existingLinks + i,
            },
          });
        }
      }
    });

    // Record generation audit row
    await prisma.aiGeneration.create({
      data: {
        userId,
        topicId,
        kind: "question_set",
        status: "succeeded",
        model: result.model,
        params: {
          topicId,
          count: result.validQuestions.length,
          droppedCount: result.droppedCount,
          difficulty: difficulty ?? null,
        },
        inputTokens: result.inputTokens ?? null,
        outputTokens: result.outputTokens ?? null,
      },
    });

    revalidatePath(`/dashboard/question-bank/topics/${topicId}/lessons`);
    revalidatePath(`/dashboard/question-bank/questions`);

    return {
      success: true,
      createdCount: result.validQuestions.length,
      droppedCount: result.droppedCount,
      topicId,
    };
  } catch (err: any) {
    // Record failed generation
    await prisma.aiGeneration.create({
      data: {
        userId,
        topicId,
        kind: "question_set",
        status: "failed",
        model: modelName,
        params: { topicId, count, difficulty },
        errorCode: err.name || "GENERATION_FAILED",
      },
    });

    return {
      error: err.message || "Gagal membuat draf soal dengan AI. Silakan coba lagi.",
    };
  }
}
