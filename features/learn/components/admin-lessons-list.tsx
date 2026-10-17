"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  toggleLessonPublishAction,
  deleteLessonAction,
  reorderLessonAction,
} from "@/features/learn/actions";
import { siteCopy } from "@/lib/copy/id";
import type { AdminLessonListItem } from "@/features/learn/types";

interface AdminLessonsListProps {
  topicId: string;
  topicName: string;
  subtestName: string;
  lessons: AdminLessonListItem[];
  onOpenAiModal?: () => void;
}

export function AdminLessonsList({
  topicId,
  topicName,
  subtestName,
  lessons,
  onOpenAiModal,
}: AdminLessonsListProps) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish(lessonId: string) {
    startTransition(async () => {
      await toggleLessonPublishAction(lessonId);
    });
  }

  function handleDelete(lessonId: string, title: string) {
    if (!confirm(`Hapus materi "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    startTransition(async () => {
      await deleteLessonAction(lessonId);
    });
  }

  function handleReorder(lessonId: string, direction: "up" | "down") {
    startTransition(async () => {
      await reorderLessonAction({ topicId, lessonId, direction });
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          className="text-xs font-semibold text-link underline underline-offset-4"
          href="/dashboard/question-bank/topics"
        >
          ← {siteCopy.questionBank.backToTopics}
        </Link>
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{subtestName}</span>
          <span>/</span>
          <span className="text-foreground">{topicName}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {siteCopy.questionBank.lessonsTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola materi pembelajaran dan kuis cek pemahaman untuk topik ini.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenAiModal && (
              <button
                className="pixel-press inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky/30 px-4 text-xs font-bold text-ink hover:bg-moodi-sky/50"
                onClick={onOpenAiModal}
                type="button"
              >
                ✨ {siteCopy.questionBank.draftWithAi}
              </button>
            )}

            <Link
              className="pixel-press pixel-shadow inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky px-4 text-xs font-bold text-ink hover:opacity-90"
              href={`/dashboard/question-bank/topics/${topicId}/lessons/new`}
            >
              + {siteCopy.questionBank.addLesson}
            </Link>
          </div>
        </div>
      </div>

      {/* Lessons Table */}
      {lessons.length === 0 ? (
        <div className="border-2 border-border bg-card p-10 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {siteCopy.questionBank.emptyLessons}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              className="pixel-press pixel-shadow inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky px-5 text-xs font-bold text-ink"
              href={`/dashboard/question-bank/topics/${topicId}/lessons/new`}
            >
              + Buat Materi Pertama
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b-2 border-border bg-muted text-xs uppercase font-bold text-foreground">
                <th className="px-4 py-3 w-16 text-center">Urutan</th>
                <th className="px-4 py-3">Judul Materi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Cek Soal</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {lessons.map((lesson, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === lessons.length - 1;
                const isPublished = lesson.status === "published";

                return (
                  <tr className="hover:bg-muted/40 transition-colors" key={lesson.id}>
                    {/* Sort Order Up/Down buttons */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          aria-label="Naikkan urutan"
                          className="pixel-press flex size-7 items-center justify-center border border-border bg-background text-xs font-bold hover:bg-muted disabled:opacity-30"
                          disabled={isPending || isFirst}
                          onClick={() => handleReorder(lesson.id, "up")}
                          type="button"
                        >
                          ▲
                        </button>
                        <button
                          aria-label="Turunkan urutan"
                          className="pixel-press flex size-7 items-center justify-center border border-border bg-background text-xs font-bold hover:bg-muted disabled:opacity-30"
                          disabled={isPending || isLast}
                          onClick={() => handleReorder(lesson.id, "down")}
                          type="button"
                        >
                          ▼
                        </button>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <Link
                          className="font-semibold text-foreground hover:underline"
                          href={`/dashboard/question-bank/topics/${topicId}/lessons/${lesson.id}/edit`}
                        >
                          {lesson.title}
                        </Link>
                        {lesson.summary && (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {lesson.summary}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs font-semibold ${
                          isPublished
                            ? "border-primary bg-moodi-sky/30 text-ink"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {isPublished
                          ? siteCopy.questionBank.statusPublished
                          : siteCopy.questionBank.statusDraft}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3 text-xs">
                      {lesson.source === "ai_assisted" ? (
                        <span className="inline-flex items-center gap-1 text-primary font-medium">
                          ✨ AI {lesson.reviewedAt ? "(Ditinjau)" : "(Draf)"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Manual</span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lesson.estMinutes} mnt
                    </td>

                    {/* Check Questions Count */}
                    <td className="px-4 py-3 text-xs font-medium">
                      {lesson.checkQuestionsCount > 0 ? (
                        <span>{lesson.checkQuestionsCount} soal</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="pixel-press inline-flex min-h-8 items-center border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
                          disabled={isPending}
                          onClick={() => handleTogglePublish(lesson.id)}
                          type="button"
                        >
                          {isPublished
                            ? siteCopy.questionBank.unpublish
                            : siteCopy.questionBank.publish}
                        </button>

                        <Link
                          className="pixel-press inline-flex min-h-8 items-center border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
                          href={`/dashboard/question-bank/topics/${topicId}/lessons/${lesson.id}/edit`}
                        >
                          Edit
                        </Link>

                        <button
                          className="pixel-press inline-flex min-h-8 items-center border border-border bg-background px-2.5 text-xs font-medium text-destructive hover:bg-muted"
                          disabled={isPending}
                          onClick={() => handleDelete(lesson.id, lesson.title)}
                          type="button"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
