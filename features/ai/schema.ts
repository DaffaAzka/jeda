import { z } from "zod";

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("paragraph"),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("bullet_list"),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("numbered_list"),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("worked_example"),
    problem: z.string().min(1),
    solution: z.string().min(1),
  }),
  z.object({
    type: z.literal("common_mistake"),
    mistake: z.string().min(1),
    correction: z.string().min(1),
  }),
  z.object({
    type: z.literal("hint"),
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal("display_equation"),
    equation: z.string().min(1),
  }),
]);

export type LessonBlock = z.infer<typeof lessonBlockSchema>;

export const lessonDraftSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(280),
  estMinutes: z.number().int().min(1).max(180).default(10),
  blocks: z.array(lessonBlockSchema).min(1),
});

export type LessonDraft = z.infer<typeof lessonDraftSchema>;

export const questionOptionDraftSchema = z.object({
  label: z.enum(["A", "B", "C", "D", "E"]),
  body: z.string().trim().min(1),
  isCorrect: z.boolean(),
});

export const questionDraftItemSchema = z.object({
  stem: z.string().trim().min(1),
  options: z.array(questionOptionDraftSchema).length(5),
  explanation: z.string().trim().min(1),
  difficulty: z.number().int().min(1).max(5),
  expectedSeconds: z.number().int().min(30).max(300),
});

export const questionSetDraftSchema = z.object({
  questions: z.array(questionDraftItemSchema).min(1),
});

export type QuestionDraftItem = z.infer<typeof questionDraftItemSchema>;
export type QuestionSetDraft = z.infer<typeof questionSetDraftSchema>;
