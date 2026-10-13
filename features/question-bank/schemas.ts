import type { JSONContent } from "@tiptap/core";
import { z } from "zod";
import { siteCopy } from "@/lib/copy/id";

const copy = siteCopy.questionBank;
const uuidSchema = z.string().uuid(copy.notFound);

export const subtestInputSchema = z.object({
  id: uuidSchema.nullable(),
  code: z
    .string()
    .min(2, copy.invalidCode)
    .max(30, copy.invalidCode)
    .regex(/^[A-Z0-9_-]{2,30}$/, copy.invalidCode),
  name: z.string().trim().min(1, copy.messages.subtest.nameRequired).max(
    120,
    copy.messages.subtest.nameRequired,
  ),
  defaultSeconds: z
    .number()
    .int(copy.messages.subtest.secondsRange)
    .min(30, copy.messages.subtest.secondsRange)
    .max(7200, copy.messages.subtest.secondsRange),
});

export const topicInputSchema = z.object({
  id: uuidSchema.nullable(),
  subtestId: uuidSchema,
  name: z.string().trim().min(1, copy.messages.topic.nameRequired).max(
    150,
    copy.messages.topic.nameRequired,
  ),
});

export const questionOptionInputSchema = z.object({
  id: uuidSchema.optional(),
  content: z.custom<JSONContent>(),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z.object({
  id: uuidSchema.nullable(),
  topicId: uuidSchema,
  difficulty: z.number().int().min(1).max(5),
  stem: z.custom<JSONContent>(),
  imageUrl: z
    .string()
    .url(copy.invalidImageUrl)
    .refine((value) => value.startsWith("https://"), copy.invalidImageUrl)
    .nullable(),
  explanation: z.custom<JSONContent>(),
  expectedSeconds: z.number().int().min(1).max(3600),
  isPublished: z.boolean(),
  options: z.array(questionOptionInputSchema).min(2).max(5),
}).superRefine(({ options }, context) => {
  if (options.filter(({ isCorrect }) => isCorrect).length !== 1) {
    context.addIssue({
      code: "custom",
      message: copy.invalidOptions,
      path: ["options"],
    });
  }
  const ids = options.flatMap(({ id }) => (id ? [id] : []));
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: "custom",
      message: copy.invalidOptions,
      path: ["options"],
    });
  }
});

export type SubtestInput = z.infer<typeof subtestInputSchema>;
export type TopicInput = z.infer<typeof topicInputSchema>;
export type QuestionOptionInput = z.infer<typeof questionOptionInputSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
