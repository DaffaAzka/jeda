"use client";

import { useState, useTransition } from "react";
import { submitCheckAnswersAction } from "@/features/learn/actions";
import { siteCopy } from "@/lib/copy/id";
import type { CheckQuestionData } from "@/features/learn/types";
import { CheckIcon } from "@/components/icons";
import { RichTextView } from "@/components/editor/rich-text-view";

interface CheckQuestionsProps {
  lessonId: string;
  questions: CheckQuestionData[];
  initialProgress?: {
    checkCorrect: number | null;
    checkTotal: number | null;
  } | null;
}

export function CheckQuestions({
  lessonId,
  questions,
  initialProgress,
}: CheckQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<{
    correct: number;
    total: number;
  } | null>(
    initialProgress?.checkCorrect !== null &&
      initialProgress?.checkTotal !== null &&
      initialProgress?.checkCorrect !== undefined &&
      initialProgress?.checkTotal !== undefined
      ? { correct: initialProgress.checkCorrect, total: initialProgress.checkTotal }
      : null,
  );
  const [isPending, startTransition] = useTransition();

  if (questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentIndex];
  const selectedOptionId = currentQ ? selectedAnswers[currentQ.id] : undefined;
  const isCurrentSubmitted = currentQ ? isAnswerSubmitted[currentQ.id] : false;
  const correctOption = currentQ?.options.find((o) => o.isCorrect);
  const isCurrentCorrect =
    selectedOptionId && correctOption && selectedOptionId === correctOption.id;

  function handleSelectOption(optionId: string) {
    if (!currentQ || isCurrentSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  }

  function handleCheckCurrent() {
    if (!currentQ || !selectedOptionId) return;
    setIsAnswerSubmitted((prev) => ({
      ...prev,
      [currentQ.id]: true,
    }));
  }

  function handleNextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all check questions
      setIsFinished(true);
      startTransition(async () => {
        const res = await submitCheckAnswersAction({
          lessonId,
          answers: selectedAnswers,
        });
        if (res.success && res.correctCount !== undefined && res.totalCount !== undefined) {
          setScoreSummary({
            correct: res.correctCount,
            total: res.totalCount,
          });
        }
      });
    }
  }

  return (
    <section
      aria-labelledby="check-understanding-title"
      className="space-y-6 border-2 border-border bg-card p-6 sm:p-8"
    >
      <div className="border-b-2 border-border pb-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            id="check-understanding-title"
          >
            {siteCopy.learn.checkSectionTitle}
          </h2>
          <span className="border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {siteCopy.learn.checkSectionSubtitle}
        </p>
      </div>

      {isFinished && scoreSummary ? (
        <div className="space-y-4 border-2 border-border bg-moodi-sky/20 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center border-2 border-border bg-moodi-sky text-ink">
            <CheckIcon className="size-6" />
          </div>
          <h3 className="font-pixelify text-xl font-bold text-foreground">
            {siteCopy.learn.checkFinished}
          </h3>
          <p className="text-sm font-medium text-foreground">
            {siteCopy.learn.checkResult
              .replace("{correct}", String(scoreSummary.correct))
              .replace("{total}", String(scoreSummary.total))}
          </p>
          <p className="text-xs text-muted-foreground">
            Cek pemahaman tidak mempengaruhi skor tryout atau statistik topikmu.
          </p>
          <div className="pt-2">
            <button
              className="pixel-press inline-flex min-h-10 items-center border-2 border-border bg-background px-4 text-xs font-semibold hover:bg-muted"
              onClick={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setIsAnswerSubmitted({});
              }}
              type="button"
            >
              Ulangi Cek Pemahaman
            </button>
          </div>
        </div>
      ) : currentQ ? (
        <div className="space-y-6">
          {/* Question Stem */}
          <div className="text-foreground leading-relaxed">
            <RichTextView content={currentQ.stem} />
          </div>

          {/* Options */}
          <fieldset className="space-y-3">
            <legend className="sr-only">Pilihan Jawaban</legend>
            <div className="space-y-2.5">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                let optionStyle = "border-2 border-border bg-background hover:bg-muted";

                if (isCurrentSubmitted) {
                  if (opt.isCorrect) {
                    optionStyle =
                      "border-2 border-border bg-moodi-sky/30 ring-2 ring-primary font-medium";
                  } else if (isSelected && !opt.isCorrect) {
                    // Highlight color for wrong answer, NEVER red
                    optionStyle =
                      "border-2 border-border bg-moodi-butter/40 ring-2 ring-moodi-butter font-medium";
                  } else {
                    optionStyle = "border-2 border-border bg-muted/40 opacity-70";
                  }
                } else if (isSelected) {
                  optionStyle =
                    "border-2 border-border bg-moodi-sky/20 shadow-[2px_2px_0_var(--border)] ring-2 ring-primary";
                }

                return (
                  <label
                    className={`pixel-press flex cursor-pointer items-start gap-3 p-3.5 transition-all ${optionStyle}`}
                    key={opt.id}
                  >
                    <input
                      checked={isSelected}
                      className="mt-0.5 size-4 accent-foreground"
                      disabled={isCurrentSubmitted}
                      name={`question-${currentQ.id}`}
                      onChange={() => handleSelectOption(opt.id)}
                      type="radio"
                      value={opt.id}
                    />
                    <div className="flex-1 text-sm text-foreground">
                      <span className="mr-2 font-bold">{opt.label}.</span>
                      <RichTextView className="inline" content={opt.body} />
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Feedback & Explanation */}
          {isCurrentSubmitted && (
            <div
              className={`space-y-3 border-2 border-border p-4 transition-all ${
                isCurrentCorrect ? "bg-moodi-sky/20" : "bg-moodi-butter/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {isCurrentCorrect
                    ? `✓ ${siteCopy.learn.correctFeedback}`
                    : `ℹ ${siteCopy.learn.wrongFeedback}`}
                </span>
              </div>
              {currentQ.explanation && (
                <div className="border-t border-border/40 pt-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {siteCopy.practice.explanationTitle}:{" "}
                  </span>
                  <RichTextView content={currentQ.explanation} />
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            {!isCurrentSubmitted ? (
              <button
                className="pixel-press pixel-shadow min-h-11 border-2 border-border bg-moodi-sky px-5 text-sm font-semibold text-ink disabled:opacity-50"
                disabled={!selectedOptionId}
                onClick={handleCheckCurrent}
                type="button"
              >
                {siteCopy.learn.checkSubmit}
              </button>
            ) : (
              <button
                className="pixel-press pixel-shadow min-h-11 border-2 border-border bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50"
                disabled={isPending}
                onClick={handleNextQuestion}
                type="button"
              >
                {currentIndex < questions.length - 1
                  ? siteCopy.learn.checkNext
                  : siteCopy.learn.checkFinished}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
