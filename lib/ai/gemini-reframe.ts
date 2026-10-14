import "server-only";

import { z } from "zod";

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

const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

const LOCAL_FALLBACKS: Record<string, Omit<ReframedThoughtResult, "thought" | "source">> = {
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
};

export async function reframeThoughtWithGemini(
  studentThought: string,
): Promise<ReframedThoughtResult> {
  const cleanThought = studentThought.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined. Using local reframing fallback.");
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
3. Bantu siswa melihat fakta objektif yang menenangkan dan realistis.
4. Berikan satu langkah kecil (small step) yang ringan dan praktis dilakukan hari ini.

Keluarkan response HANYA berupa JSON valid dengan format persis berikut:
{
  "validation": "1-2 kalimat pengakuan emosi yang hangat dan memvalidasi perasaan cemas siswa",
  "distortion": "Nama pola pikir cemas yang terjadi (contoh: Katastrofisasi, Overgeneralisasi, Perbandingan Sosial, All-or-Nothing)",
  "fact": "2-3 kalimat fakta objektif dan perspektif baru yang menenangkan dan realistis",
  "smallStep": "1 langkah tindakan konkret yang ringan dan bisa dilakukan siswa hari ini"
}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3500),
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
          },
        }),
      });

      if (!res.ok) {
        console.warn(`Gemini model ${model} returned status ${res.status}`);
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const validated = reframedResponseSchema.safeParse(parsed);

      if (validated.success) {
        return {
          thought: cleanThought,
          validation: validated.data.validation,
          distortion: validated.data.distortion,
          fact: validated.data.fact,
          smallStep: validated.data.smallStep,
          source: "gemini",
        };
      }
    } catch (err) {
      console.warn(`Gemini call error on model ${model}:`, err);
    }
  }

  // Graceful local fallback if network/quota is down
  const isParent = cleanThought.toLowerCase().includes("orang tua") || cleanThought.toLowerCase().includes("ibu") || cleanThought.toLowerCase().includes("ayah");
  const fallback = isParent ? LOCAL_FALLBACKS.orang_tua : LOCAL_FALLBACKS.default;

  return {
    thought: cleanThought,
    ...fallback,
    source: "local_fallback",
  };
}
