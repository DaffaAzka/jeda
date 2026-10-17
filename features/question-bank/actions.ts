"use server";

import type { JSONContent } from "@tiptap/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { siteCopy } from "@/lib/copy/id";
import { getAuthSession } from "@/lib/auth-session";
import { getUserRole } from "@/lib/user-role";
import {
  questionInputSchema,
  questionOptionInputSchema,
  subtestInputSchema,
  topicInputSchema,
  type QuestionInput,
  type QuestionOptionInput,
  type SubtestInput,
  type TopicInput,
} from "@/features/question-bank/schemas";
import type { ActionState, MutationConfig } from "@/features/question-bank/types";
import { validateLexicalState } from "@/lib/editor/validate-lexical";

const questionBankPath = "/dashboard/question-bank";
const dashboardPath = "/dashboard";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class InputError extends Error {}
class AuthorizationError extends Error {}

function lexicalNodeHasContent(node: any): boolean {
  if (!node || typeof node !== "object") return false;
  if (typeof node.text === "string" && node.text.trim()) return true;
  if (node.type === "equation" && typeof node.equation === "string" && node.equation.trim()) return true;
  if (Array.isArray(node.children)) {
    return node.children.some(lexicalNodeHasContent);
  }
  return false;
}

function editorDocumentHasContent(node: JSONContent): boolean {
  if (node.type === "text" && node.text?.trim()) return true;
  if (
    (node.type === "inlineMath" || node.type === "blockMath") &&
    typeof node.attrs?.latex === "string" &&
    node.attrs.latex.trim()
  ) {
    return true;
  }
  return node.content?.some(editorDocumentHasContent) ?? false;
}

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== "string") {
    throw new InputError(siteCopy.questionBank.required);
  }

  return value.trim();
}

function readRequiredString(
  formData: FormData,
  name: string,
  maxLength: number,
  message: string = siteCopy.questionBank.required,
): string {
  const value = formData.get(name);

  if (typeof value !== "string") throw new InputError(message);

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) throw new InputError(message);

  return trimmed;
}

function readId(
  formData: FormData,
  name = "id",
  message: string = siteCopy.questionBank.notFound,
): string {
  const value = readRequiredString(formData, name, 36, message);

  if (!uuidPattern.test(value)) throw new InputError(message);

  return value;
}

function readOptionalId(formData: FormData): string | null {
  return formData.has("id") ? readId(formData) : null;
}

function readNumber(
  formData: FormData,
  name: string,
  range: { min: number; max: number },
  message: string,
): number {
  const value = Number(readString(formData, name));

  if (!Number.isInteger(value) || value < range.min || value > range.max) {
    throw new InputError(message);
  }

  return value;
}

async function requireAdmin() {
  const session = await getAuthSession();

  if (!session || getUserRole(session.user.role) !== "admin") {
    throw new AuthorizationError(siteCopy.questionBank.adminOnly);
  }
}

function readPrismaErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

async function handleMutation<T>(
  formData: FormData,
  config: MutationConfig<T>,
): Promise<ActionState> {
  try {
    await requireAdmin();
    await config.mutate(config.parse(formData));
  } catch (error) {
    if (error instanceof InputError || error instanceof AuthorizationError) {
      return { error: error.message, success: "" };
    }

    // P2025: the row vanished between page load and submit (another tab deleted it).
    if (readPrismaErrorCode(error) === "P2025") {
      return { error: siteCopy.questionBank.notFound, success: "" };
    }

    console.error(`[question-bank] ${config.operation} failed`, error);
    return { error: config.failure, success: "" };
  }

  revalidatePath(questionBankPath, "layout");
  revalidatePath(dashboardPath);
  return { error: "", success: config.success };
}

function parseEditorNode(value: unknown, depth = 0): JSONContent {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    depth > 12
  ) {
    throw new InputError(siteCopy.questionBank.invalidContent);
  }

  const node = value as Record<string, unknown>;
  const allowedTypes = new Set([
    "doc",
    "paragraph",
    "text",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "hardBreak",
    "blockquote",
    "codeBlock",
    "inlineMath",
    "blockMath",
  ]);

  if (typeof node.type !== "string" || !allowedTypes.has(node.type)) {
    throw new InputError(siteCopy.questionBank.invalidContent);
  }

  const normalized: JSONContent = { type: node.type };

  if (node.type === "text") {
    if (typeof node.text !== "string") {
      throw new InputError(siteCopy.questionBank.invalidContent);
    }
    normalized.text = node.text;
  }

  if (node.type === "inlineMath" || node.type === "blockMath") {
    const attrs = node.attrs;
    if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) {
      throw new InputError(siteCopy.questionBank.invalidContent);
    }
    const latex = (attrs as Record<string, unknown>).latex;
    if (typeof latex !== "string" || latex.length > 2000) {
      throw new InputError(siteCopy.questionBank.invalidContent);
    }
    normalized.attrs = { latex };
  }

  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) {
      throw new InputError(siteCopy.questionBank.invalidContent);
    }
    const allowedMarks = new Set(["bold", "italic", "strike", "code"]);
    normalized.marks = node.marks.map((mark) => {
      if (
        !mark ||
        typeof mark !== "object" ||
        Array.isArray(mark) ||
        typeof (mark as Record<string, unknown>).type !== "string" ||
        !allowedMarks.has((mark as Record<string, string>).type)
      ) {
        throw new InputError(siteCopy.questionBank.invalidContent);
      }
      return { type: (mark as Record<string, string>).type };
    });
  }

  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) {
      throw new InputError(siteCopy.questionBank.invalidContent);
    }
    normalized.content = node.content.map((child) =>
      parseEditorNode(child, depth + 1),
    );
  }

  return normalized;
}

const emptyEditorDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

/** Pass `requiredMessage` for required fields; omit it to allow an empty document. */
function readEditorDocument(
  formData: FormData,
  name: string,
  requiredMessage?: string,
): unknown {
  const rawValue = readString(formData, name);

  if (rawValue.length > 50000) {
    throw new InputError(siteCopy.questionBank.invalidContent);
  }

  let parsed: unknown = emptyEditorDocument;
  if (rawValue) {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      parsed = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: rawValue }] }],
      };
    }
  }

  // Support and validate Lexical state
  if (parsed && typeof parsed === "object" && "root" in parsed) {
    try {
      const validated = validateLexicalState(parsed);
      if (!lexicalNodeHasContent(validated.root)) {
        if (requiredMessage) throw new InputError(requiredMessage);
      }
      return validated;
    } catch (err: any) {
      throw new InputError(err.message ?? siteCopy.questionBank.invalidContent);
    }
  }

  const document = parseEditorNode(parsed);
  if (document.type !== "doc") {
    throw new InputError(siteCopy.questionBank.invalidContent);
  }

  if (!editorDocumentHasContent(document)) {
    if (requiredMessage) throw new InputError(requiredMessage);
    return emptyEditorDocument;
  }

  return document;
}

function parseQuestionOptions(rawValue: string): QuestionOptionInput[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new InputError(siteCopy.questionBank.invalidOptions);
  }

  if (!Array.isArray(parsed) || parsed.length < 2 || parsed.length > 5) {
    throw new InputError(siteCopy.questionBank.invalidOptions);
  }

  const options = parsed.map((option): QuestionOptionInput => {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      throw new InputError(siteCopy.questionBank.invalidOptions);
    }

    const rawOption = option as Record<string, unknown>;
    let content = rawOption.content;
    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        // preserve as string
      }
    }

    if (content && typeof content === "object" && "root" in content) {
      try {
        const validated = validateLexicalState(content);
        if (!lexicalNodeHasContent(validated.root)) {
          throw new InputError(siteCopy.questionBank.invalidOptions);
        }
        content = validated;
      } catch {
        throw new InputError(siteCopy.questionBank.invalidOptions);
      }
    } else {
      const parsedContent = parseEditorNode(content);
      if (parsedContent.type !== "doc" || !editorDocumentHasContent(parsedContent)) {
        throw new InputError(siteCopy.questionBank.invalidOptions);
      }
      content = parsedContent;
    }

    const isCorrect = rawOption.isCorrect === true;
    let id: string | undefined;
    if (rawOption.id !== undefined) {
      if (typeof rawOption.id !== "string" || !uuidPattern.test(rawOption.id)) {
        throw new InputError(siteCopy.questionBank.invalidOptions);
      }
      id = rawOption.id;
    }

    return questionOptionInputSchema.parse({
      id,
      content,
      isCorrect,
    });
  });

  const optionIds = options.flatMap((option) =>
    option.id ? [option.id] : [],
  );
  if (
    options.filter((option) => option.isCorrect).length !== 1 ||
    new Set(optionIds).size !== optionIds.length
  ) {
    throw new InputError(siteCopy.questionBank.invalidOptions);
  }

  return options;
}

function readOptions(formData: FormData): QuestionOptionInput[] {
  return parseQuestionOptions(readRequiredString(formData, "options", 100000));
}

function readCode(formData: FormData): string {
  const message = siteCopy.questionBank.invalidCode;
  const code = readRequiredString(formData, "code", 30, message).toUpperCase();

  if (!/^[A-Z0-9_-]{2,30}$/.test(code)) throw new InputError(message);

  return code;
}

function readImageUrl(formData: FormData): string | null {
  const value = readString(formData, "imageUrl");

  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new InputError(siteCopy.questionBank.invalidImageUrl);
  }
  if (url.protocol !== "https:") {
    throw new InputError(siteCopy.questionBank.invalidImageUrl);
  }

  return value;
}

/* ---------- Subtests ---------- */

const subtestCopy = siteCopy.questionBank.messages.subtest;

function parseSubtest(formData: FormData): SubtestInput {
  return parseWithSchema(subtestInputSchema, {
    id: readOptionalId(formData),
    code: readCode(formData),
    name: readRequiredString(formData, "name", 120, subtestCopy.nameRequired),
    defaultSeconds: readNumber(
      formData,
      "defaultSeconds",
      { min: 30, max: 7200 },
      subtestCopy.secondsRange,
    ),
  }, subtestCopy.saveError);
}

async function upsertSubtest({ id, ...fields }: SubtestInput) {
  const duplicate = await prisma.subtest.findUnique({
    where: { code: fields.code },
    select: { id: true },
  });
  if (duplicate && duplicate.id !== id) {
    throw new InputError(siteCopy.questionBank.duplicateCode);
  }

  if (id) {
    await prisma.subtest.update({ where: { id }, data: fields });
    return;
  }
  await prisma.subtest.create({ data: fields });
}

async function removeSubtest(id: string) {
  const usedQuestions = await prisma.question.count({
    where: { topic: { subtestId: id }, sessionAnswers: { some: {} } },
  });
  if (usedQuestions > 0) {
    throw new InputError(siteCopy.questionBank.deleteReferencedSubtest);
  }
  await prisma.subtest.delete({ where: { id } });
}

export async function saveSubtest(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleMutation(formData, {
    operation: "save subtest",
    success: subtestCopy.saveSuccess,
    failure: subtestCopy.saveError,
    parse: parseSubtest,
    mutate: upsertSubtest,
  });
}

export async function deleteSubtest(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleMutation(formData, {
    operation: "delete subtest",
    success: subtestCopy.deleteSuccess,
    failure: subtestCopy.deleteError,
    parse: (data) => readId(data),
    mutate: removeSubtest,
  });
}

/* ---------- Topics ---------- */

const topicCopy = siteCopy.questionBank.messages.topic;

function parseTopic(formData: FormData): TopicInput {
  return parseWithSchema(topicInputSchema, {
    id: readOptionalId(formData),
    subtestId: readId(formData, "subtestId", topicCopy.subtestRequired),
    name: readRequiredString(formData, "name", 150, topicCopy.nameRequired),
  }, topicCopy.saveError);
}

async function upsertTopic({ id, ...fields }: TopicInput) {
  const subtest = await prisma.subtest.findUnique({
    where: { id: fields.subtestId },
    select: { id: true },
  });
  if (!subtest) throw new InputError(topicCopy.subtestMissing);

  const duplicate = await prisma.topic.findUnique({
    where: { subtestId_name: fields },
    select: { id: true },
  });
  if (duplicate && duplicate.id !== id) {
    throw new InputError(siteCopy.questionBank.duplicateTopic);
  }

  if (id) {
    await prisma.topic.update({ where: { id }, data: fields });
    return;
  }
  await prisma.topic.create({ data: fields });
}

async function removeTopic(id: string) {
  const usedQuestions = await prisma.question.count({
    where: { topicId: id, sessionAnswers: { some: {} } },
  });
  if (usedQuestions > 0) {
    throw new InputError(siteCopy.questionBank.deleteReferencedTopic);
  }
  await prisma.topic.delete({ where: { id } });
}

export async function saveTopic(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleMutation(formData, {
    operation: "save topic",
    success: topicCopy.saveSuccess,
    failure: topicCopy.saveError,
    parse: parseTopic,
    mutate: upsertTopic,
  });
}

export async function deleteTopic(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleMutation(formData, {
    operation: "delete topic",
    success: topicCopy.deleteSuccess,
    failure: topicCopy.deleteError,
    parse: (data) => readId(data),
    mutate: removeTopic,
  });
}

/* ---------- Questions ---------- */

const questionCopy = siteCopy.questionBank.messages.question;

function parseQuestion(formData: FormData): QuestionInput {
  return parseWithSchema(questionInputSchema, {
    id: readOptionalId(formData),
    topicId: readId(formData, "topicId", questionCopy.topicRequired),
    difficulty: readNumber(
      formData,
      "difficulty",
      { min: 1, max: 5 },
      questionCopy.difficultyRange,
    ),
    stem: readEditorDocument(formData, "stem", questionCopy.stemRequired),
    imageUrl: readImageUrl(formData),
    explanation: readEditorDocument(formData, "explanation"),
    expectedSeconds: readNumber(
      formData,
      "expectedSeconds",
      { min: 1, max: 3600 },
      questionCopy.secondsRange,
    ),
    isPublished: formData.get("isPublished") === "on",
    options: readOptions(formData),
  }, questionCopy.saveError);
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  input: unknown,
  fallbackMessage: string,
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new InputError(result.error.issues[0]?.message ?? fallbackMessage);
  }
  return result.data;
}

function toQuestionFields(data: QuestionInput) {
  return {
    topicId: data.topicId,
    difficulty: data.difficulty,
    stem: JSON.stringify(data.stem),
    imageUrl: data.imageUrl,
    explanation: JSON.stringify(data.explanation),
    expectedSeconds: data.expectedSeconds,
    isPublished: data.isPublished,
  };
}

function toOptionFields(option: QuestionOptionInput, index: number) {
  return {
    label: String.fromCharCode(65 + index),
    body: JSON.stringify(option.content),
    isCorrect: option.isCorrect,
  };
}

async function createQuestion(data: QuestionInput) {
  await prisma.question.create({
    data: {
      ...toQuestionFields(data),
      options: { create: data.options.map(toOptionFields) },
    },
  });
}

async function updateQuestion(id: string, data: QuestionInput) {
  const question = await prisma.question.findUnique({
    where: { id },
    select: { options: { select: { id: true } } },
  });
  if (!question) throw new InputError(siteCopy.questionBank.notFound);

  const existingOptionIds = new Set(question.options.map((option) => option.id));
  if (data.options.some((option) => option.id && !existingOptionIds.has(option.id))) {
    throw new InputError(siteCopy.questionBank.invalidOptions);
  }

  const keepIds = data.options.flatMap((option) => (option.id ? [option.id] : []));

  await prisma.$transaction(async (transaction) => {
    await transaction.question.update({ where: { id }, data: toQuestionFields(data) });
    await transaction.questionOption.deleteMany({
      where: { questionId: id, id: { notIn: keepIds } },
    });

    for (const [index, option] of data.options.entries()) {
      const fields = toOptionFields(option, index);
      if (option.id) {
        await transaction.questionOption.update({ where: { id: option.id }, data: fields });
      } else {
        await transaction.questionOption.create({ data: { ...fields, questionId: id } });
      }
    }
  });
}

async function upsertQuestion(data: QuestionInput) {
  const topic = await prisma.topic.findUnique({
    where: { id: data.topicId },
    select: { id: true },
  });
  if (!topic) throw new InputError(questionCopy.topicMissing);

  if (data.id) {
    await updateQuestion(data.id, data);
    return;
  }
  await createQuestion(data);
}

async function removeQuestion(id: string) {
  const answers = await prisma.sessionAnswer.count({ where: { questionId: id } });
  if (answers > 0) {
    throw new InputError(siteCopy.questionBank.deleteReferencedQuestion);
  }
  await prisma.question.delete({ where: { id } });
}

export async function saveQuestion(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleMutation(formData, {
    operation: "save question",
    success: questionCopy.saveSuccess,
    failure: questionCopy.saveError,
    parse: parseQuestion,
    mutate: upsertQuestion,
  });
}

export async function deleteQuestion(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return handleMutation(formData, {
    operation: "delete question",
    success: questionCopy.deleteSuccess,
    failure: questionCopy.deleteError,
    parse: (data) => readId(data),
    mutate: removeQuestion,
  });
}
