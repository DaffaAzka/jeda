import "server-only";

import { prisma } from "@/lib/prisma";

export const aiToolDeclarations = [
  {
    name: "get_topic_context",
    description:
      "Mengambil informasi konteks topik, subtes induk, judul materi yang sudah ada, dan statistik soal terbit per tingkat kesulitan.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        topicId: {
          type: "STRING" as const,
          description: "ID topik dalam format UUID",
        },
      },
      required: ["topicId"],
    },
  },
  {
    name: "list_existing_question_stems",
    description:
      "Mengambil daftar stem/pertanyaan yang sudah ada pada topik ini untuk mencegah pembuatan soal duplikat.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        topicId: {
          type: "STRING" as const,
          description: "ID topik dalam format UUID",
        },
        limit: {
          type: "INTEGER" as const,
          description: "Maksimal jumlah pertanyaan yang diambil (default 10)",
        },
      },
      required: ["topicId"],
    },
  },
  {
    name: "get_format_rules",
    description:
      "Mengambil aturan format resmi UTBK SNPMB: jumlah pilihan, label pilihan, rentang kesulitan, dan batas waktu.",
    parameters: {
      type: "OBJECT" as const,
      properties: {},
    },
  },
];

export async function executeAiTool(
  toolName: string,
  args: Record<string, any>,
): Promise<Record<string, any>> {
  switch (toolName) {
    case "get_topic_context": {
      const topicId = String(args.topicId || "").trim();
      if (!topicId) return { error: "topicId wajib diisi" };

      const topic = await prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          subtest: true,
          lessons: {
            select: {
              title: true,
              summary: true,
              estMinutes: true,
            },
          },
          questions: {
            where: { isPublished: true },
            select: { difficulty: true },
          },
        },
      });

      if (!topic) {
        return { error: "Topik tidak ditemukan di database" };
      }

      const difficultyCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const q of topic.questions) {
        difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
      }

      return {
        subtestName: topic.subtest.name,
        subtestCode: topic.subtest.code,
        topicName: topic.name,
        existingLessons: topic.lessons,
        publishedQuestionsByDifficulty: difficultyCounts,
      };
    }

    case "list_existing_question_stems": {
      const topicId = String(args.topicId || "").trim();
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 30);

      const questions = await prisma.question.findMany({
        where: { topicId },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          stem: true,
          difficulty: true,
        },
      });

      return {
        count: questions.length,
        questions: questions.map((q) => {
          let plainStem = q.stem;
          try {
            const parsed = JSON.parse(q.stem);
            if (parsed && typeof parsed === "object") {
              plainStem = JSON.stringify(parsed);
            }
          } catch {
            // Keep plain string
          }
          return {
            id: q.id,
            stemSnippet: plainStem.slice(0, 150),
            difficulty: q.difficulty,
          };
        }),
      };
    }

    case "get_format_rules": {
      return {
        optionsCount: 5,
        optionLabels: ["A", "B", "C", "D", "E"],
        difficultyScale: "1 (sangat mudah) hingga 5 (sangat sulit / HOTS)",
        allowedBlockTypes: [
          "heading",
          "paragraph",
          "bullet_list",
          "numbered_list",
          "worked_example",
          "common_mistake",
          "hint",
          "display_equation",
        ],
        expectedSecondsRange: "30 hingga 150 detik per soal",
      };
    }

    default:
      return { error: `Alat '${toolName}' tidak dikenal.` };
  }
}
