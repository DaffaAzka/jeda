import { z } from "zod";

export const lessonFormSchema = z.object({
  id: z.string().uuid().optional(),
  topicId: z.string().uuid("ID topik tidak valid"),
  title: z
    .string()
    .trim()
    .min(1, "Judul materi wajib diisi")
    .max(160, "Judul materi maksimal 160 karakter"),
  summary: z
    .string()
    .trim()
    .max(280, "Ringkasan materi maksimal 280 karakter")
    .optional()
    .nullable(),
  estMinutes: z.coerce
    .number()
    .int()
    .min(1, "Estimasi durasi minimal 1 menit")
    .max(180, "Estimasi durasi maksimal 180 menit")
    .default(10),
  content: z.string().min(1, "Konten materi tidak boleh kosong"),
  checkQuestionIds: z.array(z.string().uuid()).max(5, "Maksimal 5 soal cek pemahaman").default([]),
});

export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export const reorderLessonSchema = z.object({
  topicId: z.string().uuid(),
  lessonId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export type ReorderLessonInput = z.infer<typeof reorderLessonSchema>;

export const lessonCheckSubmissionSchema = z.object({
  lessonId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.string().uuid()),
});

export type LessonCheckSubmissionInput = z.infer<typeof lessonCheckSubmissionSchema>;
