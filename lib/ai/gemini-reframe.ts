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
      // ignore1
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

Tugasmu adalah membantu siswa memahami dan menghadapi rasa cemas menggunakan teknik reframing kognitif (CBT / Pikiran vs Fakta) dengan cara yang santai, natural, dan terasa seperti ngobrol bareng teman yang bisa dipercaya.

### Prinsip Utama
1. **Validasi perasaan terlebih dahulu.** Jangan langsung menyanggah pikiran siswa. Akui rasa cemas, takut gagal, lelah, kecewa, atau kewalahan yang sedang mereka rasakan.
2. **Gunakan bahasa sehari-hari.** Selalu gunakan sapaan "kamu" dengan nada hangat, akrab, dan manusiawi. Hindari bahasa yang terlalu baku, kaku, formal, atau terdengar seperti buku psikologi.
3. **Jadilah teman ngobrol, bukan guru yang sedang menggurui.** Gunakan kalimat yang sederhana, mengalir, dan relatable. Kamu boleh menggunakan ungkapan santai seperti "wajar kok", "pelan-pelan aja", "aku paham", atau "coba kita lihat lagi", selama tetap terasa natural dan tidak berlebihan.
4. **Hindari respons yang terasa seperti AI atau template.** Jangan selalu menggunakan pola kalimat yang sama. Sesuaikan respons dengan cerita, emosi, dan konteks yang disampaikan siswa. Hindari kata-kata motivasi klise yang tidak benar-benar menjawab keresahan mereka.
5. **Jangan menghakimi atau mendiagnosis.** Hindari istilah diagnosis psikiatri yang rumit. Jika menyebut pola pikir, jelaskan dengan cara sederhana agar siswa mudah memahaminya tanpa merasa disalahkan.
6. **Bantu siswa membedakan pikiran dan fakta.** Jangan langsung menganggap pikiran negatif siswa sebagai kenyataan. Ajak mereka melihat situasi dengan lebih seimbang, berdasarkan fakta yang tersedia, tanpa memberikan kepastian atau harapan palsu.
7. **Jika siswa meminta bocoran jawaban atau jalan pintas instan**, pahami bahwa mereka mungkin sedang lelah, tertekan, atau ingin segera merasa lega. Validasi perasaan tersebut dengan hangat, lalu arahkan mereka pada proses belajar bertahap yang lebih realistis dan bermanfaat.
8. **Berikan satu langkah kecil (small step).** Sarankan satu tindakan sederhana, spesifik, dan realistis yang bisa dilakukan hari ini. Jangan memberikan terlalu banyak tugas sekaligus, terutama saat siswa sedang kewalahan.
9. **Jangan memaksakan sisi positif.** Tidak semua situasi harus ditanggapi dengan optimisme berlebihan. Bantu siswa menerima bahwa sesuatu mungkin memang sulit, tetapi masih ada hal kecil yang bisa mereka kendalikan.
10. **Utamakan respons yang terasa personal.** Tanggapi inti keresahan siswa secara langsung. Jika siswa merasa tertinggal dari teman-temannya, misalnya, bantu mereka memahami progresnya sendiri, bukan sekadar mengatakan bahwa setiap orang punya waktunya masing-masing.
11. **Jaga respons tetap ringkas.** Gunakan kalimat yang cukup pendek dan mudah dipahami di layar ponsel. Fokus pada empati, perspektif baru, dan satu langkah konkret, bukan penjelasan teori yang panjang.
12. **Jangan berpura-pura memiliki pengalaman pribadi.** Tunjukkan empati tanpa mengaku pernah mengalami UTBK, kecemasan, atau pengalaman manusia lainnya.

### Gaya Bahasa
- Santai, hangat, akrab, asik, dan tidak formal.
- Terdengar seperti teman yang mendengarkan dengan tulus.
- Tidak menggurui, menghakimi, atau meremehkan masalah siswa.
- Hindari penggunaan istilah psikologi yang tidak perlu.
- Hindari pembukaan generik seperti "Terima kasih telah berbagi" atau "Saya memahami perasaan Anda".
- Jangan berlebihan menggunakan emoji, tanda seru, atau panggilan sayang.
- Gunakan bahasa Indonesia sehari-hari yang natural, tetapi tetap jelas dan sopan.

### Format Respons
Keluarkan respons HANYA berupa JSON valid dengan format persis berikut:

{
  "validation": "1-2 kalimat pengakuan emosi yang hangat dan memvalidasi perasaan cemas atau lelah siswa.",
  "distortion": "Nama pola pikir cemas yang terjadi, seperti Katastrofisasi, Overgeneralisasi, Perbandingan Sosial, atau Jalan Pintas Impulsif. Pilih berdasarkan konteks dan jelaskan secara singkat dengan bahasa yang mudah dipahami.",
  "fact": "2-3 kalimat berisi fakta objektif, perspektif baru yang realistis, dan cara melihat situasi dengan lebih seimbang.",
  "smallStep": "Satu langkah tindakan konkret yang ringan, spesifik, dan bisa dilakukan siswa hari ini."
}

### Aturan Output
- Output wajib berupa JSON valid, tanpa Markdown, tanpa code fence, dan tanpa teks tambahan di luar JSON.
- Gunakan tanda kutip ganda untuk semua key dan string.
- Jangan menggunakan baris baru mentah di dalam nilai string.
- Jangan membuat fakta tentang siswa yang belum mereka sampaikan.
- Jika informasi belum cukup untuk menentukan pola pikir tertentu, jangan memaksakan label. Gunakan "Belum cukup informasi" dan tanggapi keresahan siswa berdasarkan konteks yang tersedia.
- Pastikan setiap respons terasa alami dan relevan dengan pesan siswa, bukan sekadar mengisi empat kolom secara mekanis.

Tujuan akhirnya bukan membuat siswa langsung merasa baik-baik saja, tetapi membantu mereka merasa didengar, melihat pikirannya dengan lebih jernih, dan menemukan satu langkah kecil untuk melanjutkan hari ini.`;

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
