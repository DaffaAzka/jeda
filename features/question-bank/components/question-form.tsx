"use client";

import Link from "next/link";
import { useActionState, useId, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { useFormStatus } from "react-dom";
import { saveQuestion, type ActionState } from "@/features/question-bank/actions";
import { RichTextEditor } from "@/features/question-bank/components/rich-text-editor";
import { siteCopy } from "@/lib/copy/id";

type TopicChoice = {
  id: string;
  name: string;
  subtestName: string;
};

type ExistingOption = {
  id: string;
  body: string;
  label: string;
  isCorrect: boolean;
};

export type ExistingQuestion = {
  id: string;
  topicId: string;
  difficulty: number;
  stem: string;
  imageUrl: string | null;
  explanation: string | null;
  expectedSeconds: number;
  isPublished: boolean;
  options: ExistingOption[];
};

type OptionDraft = {
  key: string;
  id?: string;
  content: JSONContent;
  isCorrect: boolean;
};

const copy = siteCopy.questionBank;
const blankDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function readEditorContent(value: string | null | undefined): JSONContent {
  if (!value) return blankDocument;

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === "object" &&
      "type" in parsed &&
      parsed.type === "doc"
    ) {
      return parsed as JSONContent;
    }
  } catch {
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: value }] }],
    };
  }

  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: value }] }],
  };
}

function SubmitQuestionButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="pixel-press pixel-shadow min-h-12 border-2 border-border bg-moodi-sky px-5 font-semibold text-ink disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending
        ? siteCopy.auth.submitting
        : editing
          ? copy.editQuestion
          : copy.createQuestion}
    </button>
  );
}

export function QuestionForm({
  topics,
  question,
}: {
  topics: TopicChoice[];
  question?: ExistingQuestion;
}) {
  const [state, formAction] = useActionState(saveQuestion, {
    error: "",
    success: "",
  } satisfies ActionState);
  const nextKey = useRef(0);
  const [stem, setStem] = useState(() => JSON.stringify(readEditorContent(question?.stem)));
  const [explanation, setExplanation] = useState(() =>
    JSON.stringify(readEditorContent(question?.explanation)),
  );
  const [options, setOptions] = useState<OptionDraft[]>(() => {
    if (question?.options.length) {
      return question.options.map((option) => ({
        key: option.id,
        id: option.id,
        content: readEditorContent(option.body),
        isCorrect: option.isCorrect,
      }));
    }
    return Array.from({ length: 5 }, (_, index) => ({
      key: `new-${index}`,
      content: blankDocument,
      isCorrect: index === 0,
    }));
  });
  const selectId = useId();

  function updateOptionContent(key: string, value: string) {
    const content = readEditorContent(value);
    setOptions((current) =>
      current.map((option) =>
        option.key === key ? { ...option, content } : option,
      ),
    );
  }

  function addOption() {
    if (options.length >= 5) return;
    const key = `new-${nextKey.current++}`;
    setOptions((current) => [
      ...current,
      { key, content: blankDocument, isCorrect: false },
    ]);
  }

  function removeOption(key: string) {
    if (options.length <= 2) return;
    setOptions((current) => {
      const removedIndex = current.findIndex((option) => option.key === key);
      const remaining = current.filter((option) => option.key !== key);
      if (current[removedIndex]?.isCorrect) {
        remaining[0] = { ...remaining[0], isCorrect: true };
      }
      return remaining;
    });
  }

  function selectCorrectOption(key: string) {
    setOptions((current) =>
      current.map((option) => ({
        ...option,
        isCorrect: option.key === key,
      })),
    );
  }

  if (!topics.length) {
    return (
      <div className="border-2 border-border bg-moodi-butter p-5 text-ink">
        <p>{copy.noTopicsAvailable}</p>
        <Link
          className="mt-3 inline-flex min-h-11 items-center border-2 border-border bg-card px-4 font-semibold"
          href="/dashboard/question-bank#topics"
        >
          {copy.backToBank}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-7">
      {question && <input name="id" type="hidden" value={question.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="block text-sm font-semibold" htmlFor={selectId}>
            {copy.parentTopic}
          </label>
          <select
            className="min-h-12 w-full border-2 border-border bg-background px-3"
            defaultValue={question?.topicId ?? topics[0].id}
            id={selectId}
            name="topicId"
            required
          >
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.subtestName} / {topic.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold" htmlFor="difficulty">
            {copy.difficulty}
          </label>
          <select
            className="min-h-12 w-full border-2 border-border bg-background px-3"
            defaultValue={question?.difficulty ?? 2}
            id="difficulty"
            name="difficulty"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            className="block text-sm font-semibold"
            htmlFor="expectedSeconds"
          >
            {copy.expectedSeconds}
          </label>
          <input
            className="min-h-12 w-full border-2 border-border bg-background px-3"
            defaultValue={question?.expectedSeconds ?? 90}
            id="expectedSeconds"
            max={3600}
            min={1}
            name="expectedSeconds"
            required
            type="number"
          />
        </div>
      </div>

      <input name="stem" type="hidden" value={stem} />
      <RichTextEditor
        id="question-stem"
        initialValue={JSON.stringify(readEditorContent(question?.stem))}
        label={copy.stem}
        onChange={setStem}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-pixelify text-2xl">{copy.answerOptions}</h2>
          <button
            className="min-h-10 border-2 border-border px-3 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            disabled={options.length >= 5}
            onClick={addOption}
            type="button"
          >
            {copy.addOption}
          </button>
        </div>
        <input
          name="options"
          type="hidden"
          value={JSON.stringify(
            options.map(({ id, content, isCorrect }) => ({
              ...(id ? { id } : {}),
              content,
              isCorrect,
            })),
          )}
        />
        <div className="space-y-5">
          {options.map((option, index) => {
            const label = String.fromCharCode(65 + index);
            return (
              <fieldset
                className="space-y-3 border-2 border-border bg-card p-4"
                key={option.key}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <legend className="font-pixelify text-lg">
                    {copy.answerOptions} {label}
                  </legend>
                  <button
                    className="min-h-10 border border-border px-3 text-sm hover:bg-muted disabled:opacity-50"
                    disabled={options.length <= 2}
                    onClick={() => removeOption(option.key)}
                    type="button"
                  >
                    {copy.removeOption}
                  </button>
                </div>
                <RichTextEditor
                  compact
                  id={`option-${option.key}`}
                  initialValue={JSON.stringify(option.content)}
                  label={`${copy.answerOptions} ${label}`}
                  onChange={(value) => updateOptionContent(option.key, value)}
                />
                <label className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold">
                  <input
                    checked={option.isCorrect}
                    className="size-5 accent-current"
                    name="correctOption"
                    onChange={() => selectCorrectOption(option.key)}
                    type="radio"
                    value={option.key}
                  />
                  {copy.correctAnswer}
                </label>
              </fieldset>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" htmlFor="imageUrl">
          {copy.imageUrl}
        </label>
        <input
          className="min-h-12 w-full border-2 border-border bg-background px-3"
          defaultValue={question?.imageUrl ?? ""}
          id="imageUrl"
          maxLength={500}
          name="imageUrl"
          type="url"
        />
      </div>

      <input name="explanation" type="hidden" value={explanation} />
      <RichTextEditor
        compact
        id="question-explanation"
        initialValue={JSON.stringify(readEditorContent(question?.explanation))}
        label={copy.explanation}
        onChange={setExplanation}
      />

      <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
        <input
          className="size-5 accent-current"
          defaultChecked={question?.isPublished ?? false}
          name="isPublished"
          type="checkbox"
        />
        {copy.published}
      </label>

      {state.error && (
        <p
          className="border-2 border-border bg-moodi-peach p-3 text-sm text-ink"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          className="border-2 border-border bg-moodi-sky p-3 text-sm text-ink"
          role="status"
        >
          {state.success}{" "}
          <Link
            className="font-semibold underline underline-offset-4"
            href="/dashboard/question-bank"
          >
            {copy.backToBank}
          </Link>
        </p>
      )}
      <div className="flex flex-wrap gap-4">
        <SubmitQuestionButton editing={Boolean(question)} />
        <Link
          className="inline-flex min-h-12 items-center border-2 border-border px-5 font-semibold hover:bg-muted"
          href="/dashboard/question-bank"
        >
          {copy.cancel}
        </Link>
      </div>
    </form>
  );
}
