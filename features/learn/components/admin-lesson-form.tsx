"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { saveLessonAction } from "@/features/learn/actions";
import { siteCopy } from "@/lib/copy/id";
import { RichTextView } from "@/components/editor/rich-text-view";
import type { SerializedEditorStateJson } from "@/lib/editor/validate-lexical";

// Lazily load RichTextEditor only on admin routes to keep student bundle tiny
const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/rich-text-editor").then(
      (mod) => mod.RichTextEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center border-2 border-border bg-muted/30 text-sm text-muted-foreground">
        Memuat editor materi...
      </div>
    ),
  },
);

const emptyLexicalJson: SerializedEditorStateJson = {
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    children: [
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        children: [],
        direction: "ltr",
      },
    ],
    direction: "ltr",
  },
};

interface AdminLessonFormProps {
  topicId: string;
  topicName: string;
  subtestName: string;
  initialData?: {
    id?: string;
    title: string;
    summary: string | null;
    estMinutes: number;
    content: SerializedEditorStateJson | string;
    checkQuestionIds: string[];
    source?: string;
    reviewedAt?: Date | null;
  };
  topicQuestions: Array<{
    id: string;
    stem: string;
    difficulty: number;
    isPublished: boolean;
  }>;
}

export function AdminLessonForm({
  topicId,
  topicName,
  subtestName,
  initialData,
  topicQuestions,
}: AdminLessonFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [estMinutes, setEstMinutes] = useState(initialData?.estMinutes ?? 10);
  const [content, setContent] = useState<SerializedEditorStateJson | string>(
    initialData?.content ?? emptyLexicalJson,
  );
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    initialData?.checkQuestionIds ?? [],
  );
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = Boolean(initialData?.id);

  function handleToggleQuestion(id: string) {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds((prev) => prev.filter((qid) => qid !== id));
    } else {
      if (selectedQuestionIds.length >= 5) {
        setError("Maksimal 5 soal cek pemahaman.");
        return;
      }
      setError(null);
      setSelectedQuestionIds((prev) => [...prev, id]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Judul materi wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await saveLessonAction({
        id: initialData?.id,
        topicId,
        title: title.trim(),
        summary: summary.trim() || null,
        estMinutes,
        content: typeof content === "string" ? content : JSON.stringify(content),
        checkQuestionIds: selectedQuestionIds,
      });

      if (res.error) {
        setError(res.error);
      } else {
        router.push(`/dashboard/question-bank/topics/${topicId}/lessons`);
        router.refresh();
      }
    });
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Header and Breadcrumb */}
      <div>
        <Link
          className="text-xs font-semibold text-link underline underline-offset-4"
          href={`/dashboard/question-bank/topics/${topicId}/lessons`}
        >
          ← {siteCopy.learn.backToLessons}
        </Link>
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{subtestName}</span>
          <span>/</span>
          <span className="text-foreground">{topicName}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {isEditing ? siteCopy.questionBank.editLesson : siteCopy.questionBank.addLesson}
          </h1>

          {/* Preview Toggle */}
          <div className="flex border-2 border-border">
            <button
              className={`pixel-press px-4 py-1.5 text-xs font-semibold ${
                !isPreview
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              onClick={() => setIsPreview(false)}
              type="button"
            >
              Mode Editor
            </button>
            <button
              className={`pixel-press px-4 py-1.5 text-xs font-semibold ${
                isPreview
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              onClick={() => setIsPreview(true)}
              type="button"
            >
              {siteCopy.learn.viewAsStudent}
            </button>
          </div>
        </div>
      </div>

      {initialData?.source === "ai_assisted" && !initialData?.reviewedAt && (
        <div className="border-2 border-border bg-moodi-butter/40 p-4 text-xs font-semibold text-ink flex items-start gap-3">
          <span className="text-base">⚠️</span>
          <div>
            <p className="font-bold">Draf materi ini dibuat dengan bantuan AI (Gemini).</p>
            <p className="mt-0.5 font-normal text-foreground">
              Admin wajib memeriksa kebenaran konsep, rumus, dan latihan soal sebelum materi ini diterbitkan ke siswa.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-2 border-border bg-moodi-peach/30 p-4 text-xs font-semibold text-ink">
          {error}
        </div>
      )}

      {isPreview ? (
        /* Preview Mode (Student View) */
        <div className="border-2 border-dashed border-border bg-card p-6 sm:p-10 space-y-8">
          <div className="border-b-2 border-border pb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Preview Tampilan Siswa
            </span>
            <div className="mt-2 flex items-center gap-3">
              <span className="border-2 border-border bg-muted px-2.5 py-0.5 text-xs font-semibold">
                {siteCopy.learn.estMinutes.replace("{minutes}", String(estMinutes))}
              </span>
            </div>
            <h2 className="mt-3 font-pixelify text-3xl font-bold text-foreground">
              {title || "(Belum ada judul materi)"}
            </h2>
            {summary && (
              <p className="mt-2 text-muted-foreground text-sm">{summary}</p>
            )}
          </div>

          <div className="leading-relaxed">
            <RichTextView content={content} isLesson />
          </div>

          {selectedQuestionIds.length > 0 && (
            <div className="border-2 border-border bg-muted/40 p-5 space-y-2">
              <h3 className="font-pixelify text-xl font-bold text-foreground">
                {siteCopy.learn.checkSectionTitle} ({selectedQuestionIds.length} soal terpilih)
              </h3>
              <p className="text-xs text-muted-foreground">
                Soal cek pemahaman akan ditampilkan interaktif di bawah materi pada tampilan siswa.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Editor Mode */
        <div className="space-y-6">
          {/* Metadata fields */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                htmlFor="lesson-title"
              >
                {siteCopy.questionBank.lessonTitle} *
              </label>
              <input
                className="min-h-11 w-full border-2 border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-link"
                id="lesson-title"
                maxLength={160}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Konsep Dasar Logika Kuantor dan Negasi"
                required
                type="text"
                value={title}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                htmlFor="lesson-est"
              >
                {siteCopy.questionBank.lessonEstMinutes}
              </label>
              <input
                className="min-h-11 w-full border-2 border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-link"
                id="lesson-est"
                max={180}
                min={1}
                onChange={(e) => setEstMinutes(Number(e.target.value))}
                type="number"
                value={estMinutes}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor="lesson-summary"
            >
              {siteCopy.questionBank.lessonSummary}
            </label>
            <textarea
              className="min-h-20 w-full border-2 border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-link"
              id="lesson-summary"
              maxLength={280}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan 1-2 kalimat tentang inti materi ini..."
              rows={2}
              value={summary}
            />
          </div>

          {/* Lexical Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {siteCopy.questionBank.lessonContent} *
            </label>
            <RichTextEditor
              onChange={(json) => setContent(json)}
              value={content}
              variant="lesson"
            />
          </div>

          {/* Check Questions Picker */}
          <div className="space-y-3 border-2 border-border bg-card p-5">
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                {siteCopy.questionBank.lessonCheckQuestions} (Maksimal 5)
              </h3>
              <p className="text-xs text-muted-foreground">
                Pilih 3 hingga 5 soal terbit dari topik ini untuk menjadi kuis pemahaman instan.
              </p>
            </div>

            {topicQuestions.length === 0 ? (
              <p className="border border-border bg-muted p-3 text-xs text-muted-foreground">
                Belum ada pertanyaan terbit pada topik ini. Buat pertanyaan di Bank Soal terlebih dahulu.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-border/60 border border-border">
                {topicQuestions.map((q) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <label
                      className={`flex cursor-pointer items-start gap-3 p-3 transition-colors ${
                        isChecked ? "bg-moodi-sky/20" : "hover:bg-muted/50"
                      }`}
                      key={q.id}
                    >
                      <input
                        checked={isChecked}
                        className="mt-1 size-4 accent-foreground"
                        onChange={() => handleToggleQuestion(q.id)}
                        type="checkbox"
                      />
                      <div className="flex-1 text-xs text-foreground">
                        <div className="line-clamp-2">
                          <RichTextView className="inline" content={q.stem} />
                        </div>
                        <span className="mt-1 inline-block border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          Tingkat {q.difficulty}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              className="pixel-press pixel-shadow min-h-12 border-2 border-border bg-moodi-sky px-6 font-semibold text-ink disabled:opacity-50"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Menyimpan materi..." : siteCopy.editor.save}
            </button>
            <Link
              className="pixel-press inline-flex min-h-12 items-center border-2 border-border bg-background px-5 text-sm font-semibold hover:bg-muted"
              href={`/dashboard/question-bank/topics/${topicId}/lessons`}
            >
              {siteCopy.editor.cancel}
            </Link>
          </div>
        </div>
      )}
    </form>
  );
}
