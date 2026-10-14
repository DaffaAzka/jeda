import { z } from "zod";

export const checkinFormSchema = z.object({
  sleepHours: z.number().min(0).max(16),
  energy: z
    .number()
    .int()
    .min(1, "Minimal skor 1")
    .max(5, "Maksimal skor 5"),
  mood: z
    .number()
    .int()
    .min(1, "Minimal skor 1")
    .max(5, "Maksimal skor 5"),
  stress: z
    .number()
    .int()
    .min(1, "Minimal skor 1")
    .max(5, "Maksimal skor 5"),
  note: z
    .string()
    .max(280, "Catatan maksimal 280 karakter")
    .optional()
    .nullable(),
  wellbeingConsent: z.boolean().optional(),
});

export type CheckinFormData = z.infer<typeof checkinFormSchema>;
