import "server-only";

import katex from "katex";
import { prisma } from "@/lib/prisma";
import { getGenAiClient, getGeminiModel } from "./client";
import { aiToolDeclarations, executeAiTool } from "./tools";
import { AI_SYSTEM_PROMPTS } from "./prompts";
import {
  questionSetDraftSchema,
  questionDraftItemSchema,
  type QuestionDraftItem,
} from "./schema";
import { AI_CONFIG } from "@/config/ai";

export interface GenerateQuestionsResult {
  validQuestions: QuestionDraftItem[];
  droppedCount: number;
  totalGenerated: number;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  const status = err?.status || err?.code || 0;
  return (
    status === 429 ||
    status === 503 ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("unavailable")
  );
}

function hasValidLatex(text: string): boolean {
  const matches = text.match(/\$\$?([^$]+)\$\$?/g);
  if (!matches) return true;
  for (const match of matches) {
    const raw = match.replace(/^\$\$?|\$\$?$/g, "").trim();
    if (!raw) continue;
    try {
      katex.renderToString(raw, { throwOnError: true });
    } catch {
      return false;
    }
  }
  return true;
}

function normalizeStem(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function generateQuestionsDraft(
  topicId: string,
  count: number = 5,
  difficulty?: number,
  brief: string = "",
): Promise<GenerateQuestionsResult> {
  const ai = getGenAiClient();
  const model = getGeminiModel();

  const requestedCount = Math.min(
    Math.max(count, 1),
    AI_CONFIG.maxQuestionsPerRequest,
  );

  const diffPrompt = difficulty ? `Tingkat kesulitan target: ${difficulty}/5.` : "";
  const briefPrompt = brief ? `Fokus / Catatan khusus: "${brief.slice(0, AI_CONFIG.maxBriefChars)}"` : "";

  const userPrompt = `Buatkan ${requestedCount} draf soal latihan UTBK SNPMB baru untuk topik dengan ID "${topicId}".
${diffPrompt}
${briefPrompt}

Gunakan tool get_topic_context dan list_existing_question_stems terlebih dahulu agar kamu tahu soal apa saja yang sudah ada di topik ini dan tidak membuat soal duplikat.`;

  const contents: any[] = [
    {
      role: "user",
      parts: [{ text: userPrompt }],
    },
  ];

  let rounds = 0;
  let lastUsageMetadata: any = null;

  // Function calling loop
  while (rounds < AI_CONFIG.maxToolRounds) {
    rounds++;

    let response: any;
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: AI_SYSTEM_PROMPTS.questionAuthoring,
          tools: [{ functionDeclarations: aiToolDeclarations as any }],
        },
      });
    } catch (err: any) {
      if (isRetryableError(err)) {
        await delay(1500);
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: AI_SYSTEM_PROMPTS.questionAuthoring,
              tools: [{ functionDeclarations: aiToolDeclarations as any }],
            },
          });
        } catch {
          throw new Error("Draf belum jadi. Coba lagi beberapa menit lagi.");
        }
      } else {
        throw err;
      }
    }

    if (response.usageMetadata) {
      lastUsageMetadata = response.usageMetadata;
    }

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      break;
    }

    const assistantParts = response.candidates?.[0]?.content?.parts || [];
    contents.push({
      role: "model",
      parts: assistantParts,
    });

    const responseParts: any[] = [];
    for (const call of functionCalls) {
      const output = await executeAiTool(call.name, (call.args || {}) as Record<string, any>);
      responseParts.push({
        functionResponse: {
          name: call.name,
          response: { output },
        },
      });
    }

    contents.push({
      role: "user",
      parts: responseParts,
    });
  }

  // Request final structured JSON output conforming to questionSetDraftSchema
  const finalPrompt = `Berdasarkan konteks topik dan petunjuk admin di atas, buatkan daftar ${requestedCount} soal lengkap sekarang.
Keluarkan HANYA dokumen JSON valid yang mematuhi struktur ini:
{
  "questions": [
    {
      "stem": "string teks soal (gunakan LaTeX jika ada rumus)",
      "options": [
        { "label": "A", "body": "teks pilihan A", "isCorrect": false },
        { "label": "B", "body": "teks pilihan B", "isCorrect": true },
        { "label": "C", "body": "teks pilihan C", "isCorrect": false },
        { "label": "D", "body": "teks pilihan D", "isCorrect": false },
        { "label": "E", "body": "teks pilihan E", "isCorrect": false }
      ],
      "explanation": "string pembahasan lengkap langkah demi langkah",
      "difficulty": number (1 sampai 5),
      "expectedSeconds": number (30 sampai 150)
    }
  ]
}
Pastikan setiap soal memiliki tepat 5 pilihan (A-E) dan tepat satu jawaban benar.`;

  let finalResponse: any;
  try {
    finalResponse = await ai.models.generateContent({
      model,
      contents: [
        ...contents,
        {
          role: "user",
          parts: [{ text: finalPrompt }],
        },
      ],
      config: {
        systemInstruction: AI_SYSTEM_PROMPTS.questionAuthoring,
        responseMimeType: "application/json",
      },
    });
  } catch (err: any) {
    if (isRetryableError(err)) {
      await delay(1500);
      try {
        finalResponse = await ai.models.generateContent({
          model,
          contents: [
            ...contents,
            {
              role: "user",
              parts: [{ text: finalPrompt }],
            },
          ],
          config: {
            systemInstruction: AI_SYSTEM_PROMPTS.questionAuthoring,
            responseMimeType: "application/json",
          },
        });
      } catch {
        throw new Error("Draf belum jadi. Coba lagi beberapa menit lagi.");
      }
    } else {
      throw err;
    }
  }

  const rawText = finalResponse.text?.trim() || "";
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new Error("Model tidak menghasilkan format JSON yang valid. Silakan coba lagi.");
  }

  const rawQuestions = Array.isArray(parsedJson?.questions)
    ? parsedJson.questions
    : Array.isArray(parsedJson)
    ? parsedJson
    : [];

  // Fetch existing stems in topic for duplicate detection
  const existingQuestions = await prisma.question.findMany({
    where: { topicId },
    select: { stem: true },
  });
  const existingStemSet = new Set(
    existingQuestions.map((eq) => normalizeStem(eq.stem)),
  );

  const validQuestions: QuestionDraftItem[] = [];
  let droppedCount = 0;

  for (const item of rawQuestions) {
    // 1. Schema validity
    const parsed = questionDraftItemSchema.safeParse(item);
    if (!parsed.success) {
      droppedCount++;
      continue;
    }
    const q = parsed.data;

    // 2. Exactly one correct option
    const correctOptions = q.options.filter((o) => o.isCorrect);
    if (correctOptions.length !== 1) {
      droppedCount++;
      continue;
    }

    // 3. LaTeX that KaTeX can render with throwOnError: true
    const isStemMathValid = hasValidLatex(q.stem);
    const isExplanationMathValid = hasValidLatex(q.explanation);
    const areOptionsMathValid = q.options.every((opt) => hasValidLatex(opt.body));

    if (!isStemMathValid || !isExplanationMathValid || !areOptionsMathValid) {
      droppedCount++;
      continue;
    }

    // 4. Duplicate check against existing stems in topic
    const norm = normalizeStem(q.stem);
    if (existingStemSet.has(norm)) {
      droppedCount++;
      continue;
    }

    existingStemSet.add(norm);
    validQuestions.push(q);
  }

  return {
    validQuestions,
    droppedCount,
    totalGenerated: rawQuestions.length,
    model,
    inputTokens: finalResponse.usageMetadata?.promptTokenCount ?? lastUsageMetadata?.promptTokenCount,
    outputTokens: finalResponse.usageMetadata?.candidatesTokenCount ?? lastUsageMetadata?.candidatesTokenCount,
  };
}
