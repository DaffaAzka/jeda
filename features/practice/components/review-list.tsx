"use client";

import { useState } from "react";
import Link from "next/link";
import { siteCopy } from "@/lib/copy/id";
import { RichContent } from "@/components/rich-content";
import { ErrorTagPicker } from "@/features/practice/components/error-tag-picker";
import { CheckIcon, WarningIcon } from "@/components/icons";
import type { SessionReviewData } from "@/features/practice/queries";

export function ReviewList({ session }: { session: SessionReviewData }) {
  const [filter, setFilter] = useState<"all" | "wrong" | "correct">("all");

  const totalQuestions = session.answers.length;
  const correctCount = session.answers.filter((a) => a.isCorrect).length;
  const unansweredCount = session.answers.filter((a) => !a.selectedOptionId).length;

  const filteredAnswers = session.answers.filter((ans) => {
    if (filter === "wrong") return !ans.isCorrect;
    if (filter === "correct") return ans.isCorrect;
    return true;
  });

  const scopeTitle = session.topic
    ? session.topic.name
    : session.subtest?.name ?? "Sesi Tryout";

  return (
    <div className="space-y-8">
      {/* Top Gentle Summary Card */}
      <section
        aria-labelledby="review-summary-title"
        className="pixel-shadow border-2 border-border bg-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {session.subtest?.name}
            </span>
            <h1
              className="font-pixelify text-2xl sm:text-3xl font-bold text-foreground"
              id="review-summary-title">
              {scopeTitle}
            </h1>
          </div>
          <div className="text-right">
            <span className="inline-block border border-border bg-muted px-3 py-1 text-xs font-semibold">
              Mode: {session.mode === "full_simulation" ? "Simulasi Penuh" : "Latihan Bebas"}
            </span>
          </div>
        </div>

        {/* Factual non-judgmental result */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div>
            <p className="font-pixelify text-3xl sm:text-4xl font-bold text-foreground">
              {siteCopy.practice.resultSummary
                .replace("{correct}", String(correctCount))
                .replace("{total}", String(totalQuestions))}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {unansweredCount > 0 ?
                `${unansweredCount} soal dilewati atau belum sempat dijawab.`
              : "Semua soal telah kamu coba selesaikan."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className="pixel-press pixel-shadow inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky px-5 text-xs sm:text-sm font-semibold text-ink"
              href={
                session.topic ? "/dashboard/study" : "/dashboard/mock-exam"
              }>
              {session.topic ? siteCopy.practice.retakeSet : "Latihan Lagi"}
            </Link>
            <Link
              className="pixel-press inline-flex min-h-11 items-center border-2 border-border bg-background px-5 text-xs sm:text-sm font-semibold hover:bg-muted"
              href="/dashboard">
              {siteCopy.practice.backToDashboard}
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-t border-border pt-4 text-xs font-semibold">
          <button
            className={`pixel-press border border-border px-3 py-1.5 ${
              filter === "all" ?
                "bg-foreground text-background font-bold"
              : "bg-muted hover:bg-card"
            }`}
            onClick={() => setFilter("all")}
            type="button">
            {siteCopy.practice.filterAll} ({totalQuestions})
          </button>
          <button
            className={`pixel-press border border-border px-3 py-1.5 ${
              filter === "wrong" ?
                "bg-foreground text-background font-bold"
              : "bg-muted hover:bg-card"
            }`}
            onClick={() => setFilter("wrong")}
            type="button">
            {siteCopy.practice.filterWrong} ({totalQuestions - correctCount})
          </button>
          <button
            className={`pixel-press border border-border px-3 py-1.5 ${
              filter === "correct" ?
                "bg-foreground text-background font-bold"
              : "bg-muted hover:bg-card"
            }`}
            onClick={() => setFilter("correct")}
            type="button">
            {siteCopy.practice.filterCorrect} ({correctCount})
          </button>
        </div>
      </section>

      {/* Questions Review List */}
      <div className="space-y-6">
        {filteredAnswers.map((ans) => {
          const selectedOption = ans.question.options.find(
            (o) => o.id === ans.selectedOptionId,
          );
          const correctOption = ans.question.options.find((o) => o.isCorrect);

          return (
            <article
              className="pixel-shadow space-y-5 border-2 border-border bg-card p-6 sm:p-8"
              key={ans.id}>
              {/* Question Header & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
                <span className="font-pixelify text-lg font-bold text-foreground">
                  {siteCopy.practice.questionNumber} {ans.sortOrder + 1}
                </span>

                {ans.isCorrect ?
                  <span className="inline-flex items-center gap-1.5 border border-border bg-moodi-sky/30 px-3 py-1 text-xs font-bold text-ink">
                    <CheckIcon className="size-3.5" />
                    <span>{siteCopy.practice.labelCorrect}</span>
                  </span>
                : ans.selectedOptionId ?
                  <span className="inline-flex items-center gap-1.5 border border-border bg-moodi-butter/50 px-3 py-1 text-xs font-bold text-ink">
                    <WarningIcon className="size-3.5" />
                    <span>{siteCopy.practice.labelCheckAgain}</span>
                  </span>
                : <span className="inline-flex items-center gap-1.5 border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <span>-</span>
                    <span>{siteCopy.practice.labelUnanswered}</span>
                  </span>
                }
              </div>

              {/* Stem */}
              <div className="text-base sm:text-lg leading-relaxed text-foreground">
                <RichContent content={ans.question.stem} />
              </div>

              {ans.question.imageUrl && (
                <div className="overflow-hidden border-2 border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Ilustrasi soal"
                    className="max-h-96 w-full object-contain bg-background"
                    src={ans.question.imageUrl}
                  />
                </div>
              )}

              {/* Answers Comparison */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="border-2 border-border bg-background p-4 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {siteCopy.practice.yourAnswer}:
                  </span>
                  {selectedOption ?
                    <div className="flex items-start gap-2 pt-1">
                      <span className="flex size-6 shrink-0 items-center justify-center border border-border bg-muted text-xs font-bold">
                        {selectedOption.label}
                      </span>
                      <div className="text-sm">
                        <RichContent content={selectedOption.body} />
                      </div>
                    </div>
                  : <p className="text-sm italic text-muted-foreground pt-1">
                      {siteCopy.practice.labelUnanswered}
                    </p>
                  }
                </div>

                <div className="border-2 border-border bg-moodi-sky/20 p-4 space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                    {siteCopy.practice.correctAnswer}:
                  </span>
                  {correctOption && (
                    <div className="flex items-start gap-2 pt-1">
                      <span className="flex size-6 shrink-0 items-center justify-center border border-border bg-foreground text-background text-xs font-bold">
                        {correctOption.label}
                      </span>
                      <div className="text-sm">
                        <RichContent content={correctOption.body} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation Block */}
              {ans.question.explanation && (
                <div className="border-2 border-border bg-muted/40 p-4 sm:p-5 space-y-2">
                  <span className="font-semibold text-xs sm:text-sm text-foreground">
                    {siteCopy.practice.explanationTitle}:
                  </span>
                  <div className="text-sm leading-relaxed text-foreground">
                    <RichContent content={ans.question.explanation} />
                  </div>
                </div>
              )}

              {/* Error Autopsy Tag Picker (for wrong / unanswered questions) */}
              {!ans.isCorrect && (
                <div className="pt-2">
                  <ErrorTagPicker
                    currentTag={ans.errorTag}
                    questionId={ans.questionId}
                    sessionId={session.id}
                    tagSource={ans.tagSource}
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
