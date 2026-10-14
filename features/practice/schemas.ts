import { z } from "zod";
import { PRACTICE } from "@/config/practice";

const uuidSchema = z.string().uuid();

export const startSessionSchema = z.object({
  scopeType: z.enum(["topic", "subtest"]),
  scopeId: uuidSchema,
  level: z.enum(["relaxed", "timed", "full_simulation", "loose", "full"]),
  questionCount: z.number().int().min(1).max(100).optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;

export const saveAnswerSchema = z.object({
  sessionId: uuidSchema,
  questionId: uuidSchema,
  selectedOptionId: uuidSchema.nullable(),
});

export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;

export const saveErrorTagSchema = z.object({
  sessionId: uuidSchema,
  questionId: uuidSchema,
  errorTag: z.enum(["didnt_know", "out_of_time", "panic", "careless"]),
});

export type SaveErrorTagInput = z.infer<typeof saveErrorTagSchema>;

export const pauseSessionTimerSchema = z.object({
  sessionId: uuidSchema,
  pausedSeconds: z.number().int().min(1).max(PRACTICE.panicMaxSeconds),
});

export type PauseSessionTimerInput = z.infer<typeof pauseSessionTimerSchema>;
