"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateLessonWithAiAction,
  generateQuestionsWithAiAction,
} from "@/features/ai/actions";
import { AI_CONFIG } from "@/config/ai";
import { CloseIcon } from "@/components/icons";

interface AiDraftDialogProps {
  topicId: string;
  topicName: string;
  isOpen: boolean;
  onClose: () => void;
  defaultKind?: "lesson" | "questions";
}

export function AiDraftDialog({
  topicId,
  topicName,
  isOpen,
  onClose,
  defaultKind = "lesson",
}: AiDraftDialogProps) {
  const router = useRouter();
  const [kind, setKind] = useState<"lesson" | "questions">(defaultKind);
  const [brief, setBrief] = useState("");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (kind === "lesson") {
        const res = await generateLessonWithAiAction({
          topicId,
          brief,
        });

        if (res.error) {
          setError(res.error);
        } else if (res.lessonId) {
          onClose();
          router.push(
            `/dashboard/question-bank/topics/${topicId}/lessons/${res.lessonId}/edit`,
          );
          router.refresh();
        }
      } else {
        const res = await generateQuestionsWithAiAction({
          topicId,
          count: questionCount,
          difficulty,
          brief,
        });

        if (res.error) {
          setError(res.error);
        } else {
          onClose();
          router.push(`/dashboard/question-bank/topics/${topicId}/lessons`);
          router.refresh();
        }
      }
    });
  }

  return (
    <div
      aria-labelledby="ai-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
    >
      <div className="pixel-shadow w-full max-w-lg border-2 border-border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b-2 border-border pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {topicName}
            </span>
            <h2
              className="font-pixelify text-2xl font-bold text-foreground"
              id="ai-dialog-title"
            >
              ✨ Buat Draf dengan AI
            </h2>
          </div>
          <button
            aria-label="Tutup dialog"
            className="pixel-press inline-flex size-7 items-center justify-center border border-border text-xs font-bold hover:bg-muted"
            disabled={isPending}
            onClick={onClose}
            type="button"
          >
            <CloseIcon className="size-3.5" />
          </button>
        </div>

        {error && (
          <div className="border-2 border-border bg-moodi-peach/30 p-3 text-xs font-semibold text-ink">
            {error}
          </div>
        )}

        {isPending ? (
          <div className="py-12 text-center space-y-4">
            <div className="mx-auto size-8 animate-spin border-4 border-muted border-t-primary" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">
                Menyusun draf {kind === "lesson" ? "materi" : "soal"} dengan Gemini AI...
              </p>
              <p className="text-xs text-muted-foreground">
                Menggunakan grounding data topik MOODI dan format SNPMB. Mohon tunggu sejenak.
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Kind selector */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Jenis Konten
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`pixel-press border-2 p-3 text-left transition-all ${
                    kind === "lesson"
                      ? "border-primary bg-moodi-sky/30 shadow-[2px_2px_0_var(--border)]"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                  onClick={() => setKind("lesson")}
                  type="button"
                >
                  <div className="font-bold text-sm text-foreground">📖 Materi</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Penjelasan konsep, contoh soal, dan rumus
                  </div>
                </button>

                <button
                  className={`pixel-press border-2 p-3 text-left transition-all ${
                    kind === "questions"
                      ? "border-primary bg-moodi-sky/30 shadow-[2px_2px_0_var(--border)]"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                  onClick={() => setKind("questions")}
                  type="button"
                >
                  <div className="font-bold text-sm text-foreground">❓ Set Soal</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Latihan 5 pilihan (A-E) dengan kunci & pembahasan
                  </div>
                </button>
              </div>
            </fieldset>

            {/* Questions specific fields */}
            {kind === "questions" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    htmlFor="question-count"
                  >
                    Jumlah Soal
                  </label>
                  <select
                    className="min-h-10 w-full border-2 border-border bg-background px-3 text-sm focus:outline-none"
                    id="question-count"
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    value={questionCount}
                  >
                    {[3, 5, 8, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} Soal
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    htmlFor="question-diff"
                  >
                    Tingkat Kesulitan
                  </label>
                  <select
                    className="min-h-10 w-full border-2 border-border bg-background px-3 text-sm focus:outline-none"
                    id="question-diff"
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    value={difficulty}
                  >
                    <option value={1}>1 - Sangat Mudah</option>
                    <option value={2}>2 - Mudah</option>
                    <option value={3}>3 - Sedang (Standar)</option>
                    <option value={4}>4 - Sulit</option>
                    <option value={5}>5 - HOTS / Sangat Sulit</option>
                  </select>
                </div>
              </div>
            )}

            {/* Brief / instructions */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  htmlFor="ai-brief"
                >
                  Petunjuk / Fokus Tambahan (Opsional)
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {brief.length}/{AI_CONFIG.maxBriefChars}
                </span>
              </div>
              <textarea
                className="min-h-24 w-full border-2 border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-link"
                id="ai-brief"
                maxLength={AI_CONFIG.maxBriefChars}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Contoh: Fokuskan pada pembuktian kontradiksi dan berikan analogi logika kehidupan sehari-hari..."
                rows={3}
                value={brief}
              />
            </div>

            <div className="border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              ⚠️ Draf yang dibuat akan disimpan berstatus <strong>Draf (Unpublished)</strong>. Admin wajib memeriksa dan mengeditnya sebelum diterbitkan ke siswa.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="pixel-press pixel-shadow min-h-11 flex-1 border-2 border-border bg-moodi-sky px-5 font-semibold text-ink disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                Mulai Susun Draf
              </button>
              <button
                className="pixel-press min-h-11 border-2 border-border px-4 text-xs font-semibold hover:bg-muted"
                disabled={isPending}
                onClick={onClose}
                type="button"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
