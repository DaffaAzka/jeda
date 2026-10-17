"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { RichTextView } from "@/components/editor/rich-text-view";
import { CheckQuestions } from "./check-questions";
import { markLessonCompletedAction, markLessonViewedAction } from "@/features/learn/actions";
import { siteCopy } from "@/lib/copy/id";
import type { LessonDetailData } from "@/features/learn/types";
import { CheckIcon } from "@/components/icons";

interface LessonViewProps {
  lesson: LessonDetailData;
}

export function LessonView({ lesson }: LessonViewProps) {
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.status === "completed",
  );
  const [isPending, startTransition] = useTransition();

  // Mark lesson viewed on mount
  useEffect(() => {
    markLessonViewedAction(lesson.id);
  }, [lesson.id]);

  function handleMarkCompleted() {
    startTransition(async () => {
      const res = await markLessonCompletedAction(lesson.id);
      if (res.success) {
        setIsCompleted(true);
      }
    });
  }

  const isAiReviewed =
    lesson.source === "ai_assisted" && Boolean(lesson.reviewedAt);

  return (
    <article className="mx-auto max-w-4xl space-y-10 pb-16">
      {/* Top Navigation & Breadcrumb */}
      <nav aria-label="Breadcrumb" className="space-y-3">
        <Link
          className="inline-flex items-center text-xs font-semibold text-link underline underline-offset-4"
          href="/dashboard/study"
        >
          ← {siteCopy.learn.backToLessons}
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{lesson.subtestName}</span>
          <span>/</span>
          <span className="text-foreground">{lesson.topicName}</span>
        </div>
      </nav>

      {/* Lesson Header */}
      <header className="space-y-4 border-b-2 border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="border-2 border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
            {siteCopy.learn.estMinutes.replace(
              "{minutes}",
              String(lesson.estMinutes),
            )}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 border-2 border-border bg-moodi-sky/30 px-2.5 py-0.5 text-xs font-semibold text-ink">
              <CheckIcon className="size-3.5" />
              {siteCopy.learn.markedCompleted}
            </span>
          )}
        </div>

        <h1 className="font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {lesson.title}
        </h1>

        {lesson.summary && (
          <p className="text-base text-muted-foreground sm:text-lg leading-relaxed">
            {lesson.summary}
          </p>
        )}

        {/* AI Assisted & Reviewed Badge */}
        {isAiReviewed && (
          <div className="border-2 border-border bg-moodi-sky/15 p-3 text-xs font-medium text-ink flex items-center gap-2">
            <span className="font-bold text-primary">ℹ</span>
            <span>{siteCopy.learn.aiAssistedNotice}</span>
          </div>
        )}
      </header>

      {/* Lesson Content */}
      <section className="space-y-6 leading-relaxed">
        <RichTextView content={lesson.content} isLesson />
      </section>

      {/* Check Questions Section */}
      {lesson.checkQuestions.length > 0 && (
        <CheckQuestions
          initialProgress={lesson.progress}
          lessonId={lesson.id}
          questions={lesson.checkQuestions}
        />
      )}

      {/* Completion & Next Steps Footer */}
      <footer className="space-y-6 border-t-2 border-border pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!isCompleted ? (
              <button
                className="pixel-press pixel-shadow min-h-12 border-2 border-border bg-moodi-sky px-6 font-semibold text-ink disabled:opacity-50"
                disabled={isPending}
                onClick={handleMarkCompleted}
                type="button"
              >
                {isPending ? "Menyimpan..." : siteCopy.learn.markCompleted}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex size-6 items-center justify-center border-2 border-border bg-moodi-sky text-ink">
                  ✓
                </span>
                <span>{siteCopy.learn.markedCompleted}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="pixel-press inline-flex min-h-11 items-center border-2 border-border bg-card px-4 text-xs font-semibold hover:bg-muted"
              href={`/dashboard/mock-exam?tab=topic&topicId=${lesson.topicId}`}
            >
              {siteCopy.learn.practiceTopic} →
            </Link>

            {lesson.nextLessonId && (
              <Link
                className="pixel-press pixel-shadow inline-flex min-h-11 items-center border-2 border-border bg-foreground px-5 text-xs font-semibold text-background hover:opacity-90"
                href={`/dashboard/study/lessons/${lesson.nextLessonId}`}
              >
                {siteCopy.learn.nextLesson} →
              </Link>
            )}
          </div>
        </div>
      </footer>
    </article>
  );
}
