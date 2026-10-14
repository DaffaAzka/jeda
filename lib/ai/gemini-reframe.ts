import "server-only";

import { z } from "zod";
import dotenv from "dotenv";

export interface ReframedThoughtResult {
  thought: string;
  validation: string;
  distortion: string;
  fact: string;
  smallStep: string;
  source: "gemini" | "local_fallback";
}

const reframedResponseSchema = z.object({
  validation: z.string().min(5),
  distortion: z.string().min(2),
  fact: z.string().min(10),
  smallStep: z.string().min(5),
});

// Priority list: ultra-fast, high-availability lite models first to avoid 503 and timeouts
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

const LOCAL_FALLBACKS: Record<
  string,
  Omit<ReframedThoughtResult, "thought" | "source">
> = {
  default: {
    validation:
      "Wajar sekali merasa cemas atau terbebani. Mempersiapkan UTBK adalah perjalanan panjang yang menuntut banyak energi.",
    distortion: "Beban Ekspektasi & Katastrofisasi",
    fact:
      "Perasaan cemas adalah reaksi alami tubuh menghadapi tantangan besar, bukan tanda kegagalan. Yang menentukan hasil adalah langkah kecil konsisten setiap hari, bukan kekhawatiran yang kamu pikirkan saat ini.",
    smallStep:
      "Ambil jeda napas 4-4-4-4 selama 2 menit, lalu pilih 1 topik kecil untuk dipelajari tanpa memikirkan target besar dulu.",
  },
  orang_tua: {
    validation:
      "Rasa takut mengecewakan orang terdekat menunjukkan betapa kamu menghargai mereka.",
    distortion: "Mind Reading (Menebak reaksi sebelum terjadi)",
    fact:
      "Orang tua dan orang yang menyayangimu lebih peduli pada kesehatan dan usahamu daripada angka di lembar ujian. Berproses dengan jujur jauh lebih bermakna.",
    smallStep:
      "Katakan pada diri sendiri bahwa kamu sedang berusaha sebaik mungkin dengan kapasitas hari ini.",
  },
  jawaban_instan: {
    validation:
      "Wajar banget kalau kamu merasa ingin jalan pintas saat lagi capek dan pusing memikirkan beban UTBK.",
    distortion: "Jalan Pintas Impulsif",
    fact:
      "Mencari kunci jawaban instan tidak melatih otakmu menghadapi variasi soal nanti. Belajar bertahap dari topik yang paling mudah jauh lebih aman dan membangun kepercayaan diri asli.",
    smallStep:
      "Coba pelajari pembahasan 1 soal saja hari ini selama 10 menit dengan santai.",
  },
};

export async function reframeThoughtWithGemini(
  studentThought: string,
): Promise<ReframedThoughtResult> {
  const cleanThought = studentThought.trim();

  // Ensure fresh reading of .env even if dev server was started before variable was added
  if (!process.env.GEMINI_API_KEY) {
    try {
      dotenv.config();
    } catch {
      // ignore
    }
  }

  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = rawKey?.replace(/^["']|["']$/g, "").trim();

  if (!apiKey) {
    console.warn(
      "[Gemini Reframe] GEMINI_API_KEY is not defined in process.env. Using local fallback.",
    );
    return {
      thought: cleanThought,
      ...LOCAL_FALLBACKS.default,
      source: "local_fallback",
    };
  }

  const systemPrompt = `Kamu adalah asisten refleksi kognitif yang ramah, hangat, dan suportif untuk siswa persiapan UTBK di aplikasi MOODI.
Tugasmu adalah membantu siswa membedah rasa cemas menggunakan teknik reframing kognitif (CBT / Pikiran vs Fakta).
Prinsip utama:
1. Jangan menghakimi, jangan gunakan istilah diagnosis psikiatri rumit.
2. Selalu gunakan sapaan 'kamu' yang hangat, akrab, dan manusiawi.
3. Jika siswa meminta bocoran jawaban atau jalan pintas instan, validasi rasa ingin instan/lelahnya dengan hangat, lalu ingatkan bahwa proses latihan bertahap jauh lebih aman dan nyata.
4. Bantu siswa melihat fakta objektif yang menenangkan dan realistis.
5. Berikan satu langkah kecil (small step) yang ringan dan praktis dilakukan hari ini.

Keluarkan response HANYA berupa JSON valid dengan format persis berikut:
{
  "validation": "1-2 kalimat pengakuan emosi yang hangat dan memvalidasi perasaan cemas/lelah siswa",
  "distortion": "Nama pola pikir cemas yang terjadi (contoh: Katastrofisasi, Overgeneralisasi, Perbandingan Sosial, Jalan Pintas Impulsif)",
  "fact": "2-3 kalimat fakta objektif dan perspektif baru yang menenangkan dan realistis",
  "smallStep": "1 langkah tindakan konkret yang ringan dan bisa dilakukan siswa hari ini"
}`;

  for (const model of CANDIDATE_MODELS) {
    const start = Date.now();
    try {
      console.log(`[Gemini Reframe] Calling model ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nPikiran Siswa:\n"${cleanThought}"`,
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.7,
            max_output_tokens: 450,
          },
        }),
      });

      const elapsed = Date.now() - start;
      console.log(`[Gemini Reframe] Model ${model} responded: ${res.status} in ${elapsed}ms`);

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        console.warn(
          `[Gemini Reframe] Model ${model} error:`,
          errJson?.error?.message ?? res.statusText,
        );
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const validated = reframedResponseSchema.safeParse(parsed);

      if (validated.success) {
        console.log(`[Gemini Reframe] Successfully reframed via ${model} in ${elapsed}ms!`);
        return {
          thought: cleanThought,
          validation: validated.data.validation,
          distortion: validated.data.distortion,
          fact: validated.data.fact,
          smallStep: validated.data.smallStep,
          source: "gemini",
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Reframe] Model ${model} threw error:`, err?.name ?? err?.message);
      continue;
    }
  }

  // Graceful local fallback if all models fail
  console.warn("[Gemini Reframe] All models failed, using local fallback.");
  const lower = cleanThought.toLowerCase();
  const isParent =
    lower.includes("orang tua") ||
    lower.includes("ibu") ||
    lower.includes("ayah");
  const isInstant =
    lower.includes("jawaban") ||
    lower.includes("bocoran") ||
    lower.includes("kunci");

  const fallback =
    isParent ? LOCAL_FALLBACKS.orang_tua
    : isInstant ? LOCAL_FALLBACKS.jawaban_instan
    : LOCAL_FALLBACKS.default;

  return {
    thought: cleanThought,
    ...fallback,
    source: "local_fallback",
  };
}
