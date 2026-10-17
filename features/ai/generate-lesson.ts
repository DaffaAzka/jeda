import "server-only";

import { getGenAiClient, getGeminiModel } from "./client";
import { aiToolDeclarations, executeAiTool } from "./tools";
import { AI_SYSTEM_PROMPTS } from "./prompts";
import { lessonDraftSchema, type LessonDraft } from "./schema";
import { AI_CONFIG } from "@/config/ai";

export interface GenerateLessonResult {
  draft: LessonDraft;
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

export async function generateLessonDraft(
  topicId: string,
  brief: string,
): Promise<GenerateLessonResult> {
  const ai = getGenAiClient();
  const model = getGeminiModel();

  const userPrompt = `Buatkan draf materi pembelajaran baru untuk topik dengan ID "${topicId}".
Petunjuk / Fokus materi dari admin:
"${brief.slice(0, AI_CONFIG.maxBriefChars)}"

Gunakan tool get_topic_context terlebih dahulu untuk membaca judul materi yang sudah ada dan statistik topik ini.`;

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
          systemInstruction: AI_SYSTEM_PROMPTS.lessonAuthoring,
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
              systemInstruction: AI_SYSTEM_PROMPTS.lessonAuthoring,
              tools: [{ functionDeclarations: aiToolDeclarations as any }],
            },
          });
        } catch (retryErr: any) {
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

  // Request final structured JSON output conforming to lessonDraftSchema
  const finalPrompt = `Berdasarkan konteks topik dan petunjuk admin di atas, buatkan draf materi lengkap sekarang.
Keluarkan HANYA dokumen JSON valid yang mematuhi struktur ini:
{
  "title": "string (maksimal 160 karakter)",
  "summary": "string ringkasan 1-2 kalimat (maksimal 280 karakter)",
  "estMinutes": number (durasi estimasi belajar, contoh: 10),
  "blocks": [
    { "type": "heading", "level": 1 | 2 | 3, "text": "..." },
    { "type": "paragraph", "text": "..." },
    { "type": "bullet_list", "items": ["..."] },
    { "type": "numbered_list", "items": ["..."] },
    { "type": "worked_example", "problem": "...", "solution": "..." },
    { "type": "common_mistake", "mistake": "...", "correction": "..." },
    { "type": "hint", "title": "...", "content": "..." },
    { "type": "display_equation", "equation": "..." }
  ]
}
Pastikan seluruh blok menggunakan salah satu dari 8 tipe blok di atas.`;

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
        systemInstruction: AI_SYSTEM_PROMPTS.lessonAuthoring,
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
            systemInstruction: AI_SYSTEM_PROMPTS.lessonAuthoring,
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
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    throw new Error("Model tidak menghasilkan format JSON yang valid. Silakan coba lagi.");
  }

  const validatedDraft = lessonDraftSchema.parse(parsedJson);

  return {
    draft: validatedDraft,
    model,
    inputTokens: finalResponse.usageMetadata?.promptTokenCount ?? lastUsageMetadata?.promptTokenCount,
    outputTokens: finalResponse.usageMetadata?.candidatesTokenCount ?? lastUsageMetadata?.candidatesTokenCount,
  };
}
