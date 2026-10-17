"use client";

import { useState } from "react";
import Link from "next/link";
import { siteCopy } from "@/lib/copy/id";
import type { StudyHubData } from "@/features/learn/types";
import { CheckIcon } from "@/components/icons";

interface StudyHubProps {
  data: StudyHubData;
}

export function StudyHub({ data }: StudyHubProps) {
  const { resumeLesson, recommendedLessons, subtests, totalLessons, completedLessons } =
    data;

  // Track expanded subtest/topics
  const [expandedSubtestId, setExpandedSubtestId] = useState<string | null>(
    subtests[0]?.id ?? null,
  );

  return (
    <div className="space-y-10">
      {/* 1. Resume Lesson Card */}
      {resumeLesson && (
        <section
          aria-labelledby="resume-lesson-title"
          className="pixel-shadow border-2 border-border bg-moodi-sky/20 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="border border-border bg-moodi-sky px-2 py-0.5 text-xs font-bold text-ink">
                  {siteCopy.learn.resumeCardTitle}
                </span>
                <span className="text-xs text-muted-foreground">
                  {resumeLesson.subtestName} · {resumeLesson.topicName}
                </span>
              </div>
              <h2
                className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                id="resume-lesson-title"
              >
                {resumeLesson.lessonTitle}
              </h2>
              <p className="text-xs text-muted-foreground">
                {siteCopy.learn.estMinutes.replace(
                  "{minutes}",
                  String(resumeLesson.estMinutes),
                )}
              </p>
            </div>

            <div className="shrink-0">
              <Link
                className="pixel-press pixel-shadow inline-flex min-h-12 items-center border-2 border-border bg-moodi-sky px-6 font-semibold text-ink hover:opacity-90"
                href={`/dashboard/study/lessons/${resumeLesson.lessonId}`}
              >
                {siteCopy.learn.resumeCardAction} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Today's Recommended Lessons */}
      {recommendedLessons.length > 0 && (
        <section aria-labelledby="recommended-lessons-title" className="space-y-4">
          <div className="border-b-2 border-border pb-2">
            <h2
              className="font-pixelify text-2xl font-bold tracking-tight text-foreground"
              id="recommended-lessons-title"
            >
              {siteCopy.learn.todayRecommendations}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {recommendedLessons.map((rec) => (
              <article
                className="pixel-press flex flex-col justify-between border-2 border-border bg-card p-5 text-left transition-all hover:bg-muted"
                key={rec.lessonId}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {rec.subtestName} · {rec.topicName}
                    </span>
                    <span>
                      {siteCopy.learn.estMinutes.replace(
                        "{minutes}",
                        String(rec.estMinutes),
                      )}
                    </span>
                  </div>
                  <h3 className="font-pixelify text-xl font-bold text-foreground">
                    {rec.lessonTitle}
                  </h3>
                  {rec.reason && (
                    <p className="border-l-2 border-border pl-2 text-xs italic text-muted-foreground">
                      &ldquo;{rec.reason}&rdquo;
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-border/40 pt-3">
                  <Link
                    className="pixel-press inline-flex min-h-10 items-center border-2 border-border bg-background px-4 text-xs font-semibold hover:bg-muted"
                    href={`/dashboard/study/lessons/${rec.lessonId}`}
                  >
                    Buka materi →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 3. Subtests and Topics Catalog */}
      <section aria-labelledby="all-subtests-title" className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-border pb-3">
          <h2
            className="font-pixelify text-2xl font-bold tracking-tight text-foreground"
            id="all-subtests-title"
          >
            {siteCopy.learn.allSubtests}
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {siteCopy.learn.subtestProgress
              .replace("{completed}", String(completedLessons))
              .replace("{total}", String(totalLessons))}
          </span>
        </div>

        {subtests.length === 0 ? (
          <div className="border-2 border-border bg-muted p-8 text-center text-sm text-muted-foreground">
            {siteCopy.learn.noLessonsYet}
          </div>
        ) : (
          <div className="space-y-6">
            {subtests.map((subtest) => {
              const isExpanded = expandedSubtestId === subtest.id;

              return (
                <div
                  className="border-2 border-border bg-card"
                  key={subtest.id}
                >
                  {/* Subtest Accordion Header */}
                  <button
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/50"
                    onClick={() =>
                      setExpandedSubtestId(isExpanded ? null : subtest.id)
                    }
                    type="button"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="border border-border bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                          {subtest.code}
                        </span>
                        <h3 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
                          {subtest.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {siteCopy.learn.subtestProgress
                          .replace(
                            "{completed}",
                            String(subtest.completedLessons),
                          )
                          .replace("{total}", String(subtest.totalLessons))}
                      </p>
                    </div>

                    <span className="text-sm font-bold text-muted-foreground">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {/* Subtest Topics and Lessons */}
                  {isExpanded && (
                    <div className="border-t-2 border-border divide-y divide-border/60 bg-background/50">
                      {subtest.topics.map((topic) => (
                        <div className="p-5 space-y-4" key={topic.id}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground text-base">
                              {topic.name}
                            </h4>
                            <span className="text-xs text-muted-foreground font-medium">
                              {topic.completedCount} / {topic.totalCount} selesai
                            </span>
                          </div>

                          {/* Lessons Grid */}
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {topic.lessons.map((lesson) => {
                              const isCompleted =
                                lesson.progressStatus === "completed";
                              const isInProgress =
                                lesson.progressStatus === "in_progress";

                              return (
                                <Link
                                  className={`pixel-press flex flex-col justify-between border-2 border-border p-4 transition-all ${
                                    isCompleted
                                      ? "bg-moodi-sky/15 hover:bg-moodi-sky/25"
                                      : isInProgress
                                      ? "bg-moodi-peach/20 hover:bg-moodi-peach/30"
                                      : "bg-card hover:bg-muted"
                                  }`}
                                  href={`/dashboard/study/lessons/${lesson.id}`}
                                  key={lesson.id}
                                >
                                  <div className="space-y-1.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="font-medium text-sm text-foreground leading-snug">
                                        {lesson.title}
                                      </h5>
                                      {isCompleted ? (
                                        <span className="shrink-0 text-primary">
                                          <CheckIcon className="size-4" />
                                        </span>
                                      ) : isInProgress ? (
                                        <span className="size-2 rounded-full bg-moodi-peach mt-1.5 shrink-0" />
                                      ) : null}
                                    </div>
                                    {lesson.summary && (
                                      <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {lesson.summary}
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-4 flex items-center justify-between border-t border-border/30 pt-2 text-xs text-muted-foreground">
                                    <span>
                                      {siteCopy.learn.estMinutes.replace(
                                        "{minutes}",
                                        String(lesson.estMinutes),
                                      )}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                      Buka →
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
