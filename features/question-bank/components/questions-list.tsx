import Link from "next/link";
import { deleteQuestion } from "@/features/question-bank/actions";
import {
  QUESTION_PAGE_SIZE,
  type QuestionListItem,
} from "@/features/question-bank/queries";
import { siteCopy } from "@/lib/copy/id";
import { MutationForm } from "./mutation-form";

const copy = siteCopy.questionBank;

function QuestionPreview({ value }: { value: string }) {
  try {
    const parsed: unknown = JSON.parse(value);
    const collectText = (node: unknown): string => {
      if (!node || typeof node !== "object") return "";
      const record = node as Record<string, unknown>;
      if (record.type === "text" && typeof record.text === "string") {
        return record.text;
      }
      if (
        (record.type === "inlineMath" || record.type === "blockMath") &&
        record.attrs &&
        typeof record.attrs === "object" &&
        "latex" in record.attrs &&
        typeof record.attrs.latex === "string"
      ) {
        return `$${record.attrs.latex}$`;
      }
      if (Array.isArray(record.content)) {
        return record.content.map(collectText).join(" ");
      }
      return "";
    };

    return collectText(parsed) || copy.editorPlaceholder;
  } catch {
    return value;
  }
}

export function QuestionsList({
  questions,
  page,
  hasNextPage,
}: {
  questions: QuestionListItem[];
  page: number;
  hasNextPage: boolean;
}) {
  return (
    <>
      {!questions.length ? (
        <p className="mt-6 border-2 border-border bg-muted p-4">
          {copy.emptyQuestions}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {questions.map((question, index) => (
            <article
              className="flex flex-col gap-4 border-2 border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              key={question.id}
            >
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {question.topic.subtest.name} / {question.topic.name} ·{" "}
                  {question.isPublished
                    ? copy.statusPublished
                    : copy.statusDraft}
                </p>
                <p className="mt-1 line-clamp-2 font-medium">
                  {copy.questionNumber}{" "}
                  {(page - 1) * QUESTION_PAGE_SIZE + index + 1}:{" "}
                  {QuestionPreview({ value: question.stem })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {question._count.options} {copy.optionCount} ·{" "}
                  {copy.difficulty} {question.difficulty}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  className="inline-flex min-h-10 items-center border-2 border-border px-3 text-sm font-semibold hover:bg-muted"
                  href={`/dashboard/question-bank/questions/${question.id}/edit`}
                >
                  {copy.edit}
                </Link>
                <MutationForm
                  action={deleteQuestion}
                  buttonLabel={copy.delete}
                  className="flex items-center"
                  destructive
                >
                  <input name="id" type="hidden" value={question.id} />
                </MutationForm>
              </div>
            </article>
          ))}
        </div>
      )}
      {(page > 1 || hasNextPage) && (
        <nav
          aria-label={copy.questionsPagination}
          className="mt-6 flex justify-between"
        >
          {page > 1 ? (
            <Link
              className="inline-flex min-h-11 items-center border-2 border-border px-4 font-semibold hover:bg-muted"
              href={`/dashboard/question-bank/questions?page=${page - 1}`}
            >
              {copy.previousPage}
            </Link>
          ) : (
            <span />
          )}
          {hasNextPage && (
            <Link
              className="inline-flex min-h-11 items-center border-2 border-border px-4 font-semibold hover:bg-muted"
              href={`/dashboard/question-bank/questions?page=${page + 1}`}
            >
              {copy.nextPage}
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
