"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { siteCopy } from "@/lib/copy/id";
import { SessionTimer } from "@/features/practice/components/session-timer";
import { QuestionNavigator } from "@/features/practice/components/question-navigator";
import { BreathingOverlay } from "@/features/calm/components/breathing-overlay";
import {
  saveAnswerAction,
  finishSessionAction,
  pauseSessionTimerAction,
  type ImmediateFeedback,
} from "@/features/practice/actions";
import { RichContent } from "@/components/rich-content";
import type { TryoutMode } from "@/app/generated/prisma/enums";

export interface RunnerQuestion {
  id: string;
  stem: string;
  imageUrl: string | null;
  options: Array<{
    id: string;
    label: string;
    body: string;
  }>;
}

export interface SessionRunnerProps {
  sessionId: string;
  mode: TryoutMode;
  subtestName: string;
  topicName: string | null;
  startedAt: string;
  endsAt: string | null;
  serverNow: string;
  questions: RunnerQuestion[];
  initialAnswers: Record<string, string | null>;
}

export function SessionRunner({
  sessionId,
  mode,
  subtestName,
  topicName,
  endsAt,
  serverNow,
  questions,
  initialAnswers,
}: SessionRunnerProps) {
  const router = useRouter();
  const [endsAtState, setEndsAtState] = useState<string | null>(endsAt);
  const [answers, setAnswers] =
    useState<Record<string, string | null>>(initialAnswers);
  const [immediateFeedbacks, setImmediateFeedbacks] = useState<
    Record<string, ImmediateFeedback>
  >({});

  // Find first unanswered question for resume, otherwise 0
  const initialUnansweredIndex = useMemo(() => {
    const idx = questions.findIndex((q) => !initialAnswers[q.id]);
    return idx >= 0 ? idx : 0;
  }, [questions, initialAnswers]);

  const [currentIndex, setCurrentIndex] =
    useState<number>(initialUnansweredIndex);
  const [isNavOpenMobile, setIsNavOpenMobile] = useState<boolean>(false);
  const [isPanicOpen, setIsPanicOpen] = useState<boolean>(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);
  const [showSoftTimerEnd, setShowSoftTimerEnd] = useState<boolean>(false);
  const [isFinishing, startFinishTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const selectedOptionId =
    currentQuestion ? (answers[currentQuestion.id] ?? null) : null;
  const currentImmediateFeedback =
    currentQuestion ? immediateFeedbacks[currentQuestion.id] : undefined;

  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, idx) => {
      if (answers[q.id]) set.add(idx);
    });
    return set;
  }, [questions, answers]);

  const unansweredCount = questions.length - answeredIndices.size;
  const isAllAnswered = answeredIndices.size === questions.length;
  const nextUnansweredIndex = questions.findIndex(
    (_, idx) => !answeredIndices.has(idx),
  );

  async function handleOptionSelect(optionId: string) {
    if (!currentQuestion) return;
    setSaveError(null);

    // Optimistically update selection
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));

    const result = await saveAnswerAction(
      sessionId,
      currentQuestion.id,
      optionId,
    );

    if (result.expired) {
      handleFinalize();
      return;
    }

    if (!result.success) {
      setSaveError(result.error ?? siteCopy.practice.saveAnswerError);
    } else if (result.immediateFeedback) {
      setImmediateFeedbacks((prev) => ({
        ...prev,
        [currentQuestion.id]: result.immediateFeedback!,
      }));
    }
  }

  function handleFinalize(force = false) {
    if (!force && answeredIndices.size < questions.length) {
      const remaining = questions.length - answeredIndices.size;
      setSaveError(
        `Belum bisa menyelesaikan sesi. Masih ada ${remaining} soal yang belum dijawab.`,
      );
      setShowFinishConfirm(false);
      return;
    }

    startFinishTransition(async () => {
      const res = await finishSessionAction(sessionId);
      if (res.success) {
        router.push(`/dashboard/sessions/${sessionId}/review`);
      } else {
        setSaveError(res.error ?? siteCopy.questionBank.genericError);
      }
    });
  }

  function handleTimerExpiry() {
    if (mode === "full_simulation") {
      handleFinalize(true);
    } else if (mode === "timed") {
      setShowSoftTimerEnd(true);
    }
  }

  async function handlePanicClose(pausedSeconds: number) {
    setIsPanicOpen(false);

    if (mode === "timed" && pausedSeconds > 0) {
      const res = await pauseSessionTimerAction(sessionId, pausedSeconds);
      if (res.success && res.newEndsAt) {
        setEndsAtState(res.newEndsAt);
      }
    }
  }

  if (!currentQuestion) {
    return null;
  }

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background text-foreground">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b-2 border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            className="pixel-press inline-flex items-center gap-1.5 border border-border bg-background px-3 py-1 text-xs font-semibold hover:bg-muted"
            href="/dashboard">
            ← {siteCopy.practice.leaveForNow}
          </Link>
          <div className="hidden sm:block min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {topicName ? `${subtestName} · ${topicName}` : subtestName}
            </p>
          </div>
        </div>

        {/* Center Progress & Timer */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold sm:text-sm">
            {siteCopy.practice.questionNumber} {currentIndex + 1} /{" "}
            {questions.length}
          </div>
          <div className="hidden lg:block">
            <SessionTimer
              endsAt={endsAtState}
              isPaused={isPanicOpen}
              onExpiry={handleTimerExpiry}
              serverNow={serverNow}
            />
          </div>
        </div>

        {/* Right Nav toggle & Panic for Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            aria-label={siteCopy.practice.questionNavigator}
            className="pixel-press flex items-center gap-1 border border-border px-3 py-1 text-xs font-semibold"
            onClick={() => setIsNavOpenMobile(true)}
            type="button">
            <span>Daftar Soal</span>
            <span className="font-mono">
              ({answeredIndices.size}/{questions.length})
            </span>
          </button>

          <SessionTimer
            endsAt={endsAtState}
            isPaused={isPanicOpen}
            onExpiry={handleTimerExpiry}
            serverNow={serverNow}
          />
        </div>
      </header>

      {/* Main Runner Body */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-8 p-4 pb-28 sm:p-6 lg:p-8">
        <main className="min-w-0 flex-1 space-y-6">
          {saveError && (
            <div className="border-2 border-border bg-moodi-peach/30 p-3 text-xs font-semibold text-ink">
              {saveError}
            </div>
          )}

          {/* Question Card */}
          <article className="pixel-shadow border-2 border-border bg-card p-6 sm:p-8">
            <div className="border-b border-border/40 pb-4">
              <span className="inline-block border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold">
                {siteCopy.practice.questionNumber} {currentIndex + 1}
              </span>
            </div>

            <div className="mt-4 text-base sm:text-lg leading-relaxed text-foreground">
              <RichContent content={currentQuestion.stem} />
            </div>

            {currentQuestion.imageUrl && (
              <div className="my-4 overflow-hidden border-2 border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Ilustrasi soal"
                  className="max-h-96 w-full object-contain bg-background"
                  src={currentQuestion.imageUrl}
                />
              </div>
            )}
          </article>

          {/* Option Buttons */}
          <fieldset className="space-y-3">
            <legend className="sr-only">Pilihan Jawaban</legend>
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <button
                    aria-checked={isSelected}
                    className={`pixel-press relative flex w-full min-h-14 items-center gap-4 border-2 border-border p-4 text-left transition-all ${
                      isSelected ?
                        "bg-moodi-sky text-ink shadow-[3px_3px_0_var(--border)] ring-2 ring-primary"
                      : "bg-card text-foreground hover:bg-muted"
                    }`}
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    role="radio"
                    type="button">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center border-2 border-border font-pixelify text-sm font-bold ${
                        isSelected ?
                          "bg-foreground text-background"
                        : "bg-muted text-foreground"
                      }`}>
                      {option.label}
                    </span>
                    <div className="min-w-0 flex-1 text-sm sm:text-base leading-snug">
                      <RichContent content={option.body} />
                    </div>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Immediate Feedback in Santai Mode */}
          {mode === "relaxed" && currentImmediateFeedback && (
            <div
              className={`border-2 border-border p-5 ${
                currentImmediateFeedback.isCorrect ?
                  "bg-moodi-sky/30 text-ink"
                : "bg-moodi-butter/40 text-ink"
              }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>{currentImmediateFeedback.isCorrect ? "✓" : "!"}</span>
                <span>
                  {currentImmediateFeedback.isCorrect ?
                    siteCopy.practice.immediateCorrect
                  : siteCopy.practice.immediateWrong}
                </span>
              </div>
              {currentImmediateFeedback.explanation && (
                <div className="mt-3 border-t border-border/30 pt-3 text-sm">
                  <span className="font-semibold">
                    {siteCopy.practice.explanationTitle}:
                  </span>
                  <div className="mt-1">
                    <RichContent
                      content={currentImmediateFeedback.explanation}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Question Navigator (Single instance: Desktop sidebar & Mobile Drawer, with integrated Nafas dulu) */}
        <QuestionNavigator
          answeredIndices={answeredIndices}
          currentIndex={currentIndex}
          isFullSimulation={mode === "full_simulation"}
          isOpenMobile={isNavOpenMobile}
          onCloseMobile={() => setIsNavOpenMobile(false)}
          onPanicClick={() => setIsPanicOpen(true)}
          onSelectIndex={(idx) => setCurrentIndex(idx)}
          totalQuestions={questions.length}
        />
      </div>

      {/* Bottom Sticky Action Bar */}
      <footer className="sticky bottom-0 z-30 flex min-h-16 items-center justify-between border-t-2 border-border bg-card px-4 sm:px-8">
        <button
          className="pixel-press inline-flex min-h-10 items-center border-2 border-border px-4 text-xs sm:text-sm font-semibold hover:bg-muted disabled:opacity-40"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          type="button">
          ← {siteCopy.practice.previousQuestion}
        </button>

        <div className="flex items-center gap-3">
          {!isAllAnswered && (
            <span className="hidden sm:inline-flex items-center gap-1.5 border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <span>{answeredIndices.size}/{questions.length} terjawab</span>
              <span className="text-[10px]">({unansweredCount} belum)</span>
            </span>
          )}

          {isLastQuestion ? (
            <button
              className={`inline-flex min-h-11 items-center border-2 border-border px-5 text-xs sm:text-sm font-bold transition-all ${
                isAllAnswered
                  ? "pixel-press pixel-shadow bg-moodi-sky text-ink hover:bg-moodi-sky/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground opacity-60"
              }`}
              disabled={!isAllAnswered}
              onClick={() => isAllAnswered && setShowFinishConfirm(true)}
              title={
                isAllAnswered
                  ? "Selesaikan sesi sekarang"
                  : `Jawab semua soal terlebih dahulu (${unansweredCount} soal belum dijawab)`
              }
              type="button">
              {isAllAnswered ? `${siteCopy.practice.finish} ✓` : `Belum Lengkap (${answeredIndices.size}/${questions.length})`}
            </button>
          ) : (
            <button
              className={`inline-flex min-h-10 items-center border-2 border-border px-4 text-xs sm:text-sm font-semibold transition-all ${
                isAllAnswered
                  ? "pixel-press bg-background text-foreground hover:bg-muted"
                  : "cursor-not-allowed bg-muted text-muted-foreground opacity-60"
              }`}
              disabled={!isAllAnswered}
              onClick={() => isAllAnswered && setShowFinishConfirm(true)}
              title={
                isAllAnswered
                  ? "Selesaikan sesi sekarang"
                  : `Jawab semua soal terlebih dahulu (${unansweredCount} soal belum dijawab)`
              }
              type="button">
              {siteCopy.practice.finish}
            </button>
          )}

          {!isLastQuestion && (
            <button
              className="pixel-press pixel-shadow inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky px-5 text-xs sm:text-sm font-bold text-ink hover:bg-moodi-sky/90"
              onClick={() =>
                setCurrentIndex((idx) =>
                  Math.min(questions.length - 1, idx + 1),
                )
              }
              type="button">
              {siteCopy.practice.nextQuestion} →
            </button>
          )}
        </div>
      </footer>

      {/* Breathing Panic Overlay */}
      <BreathingOverlay
        isFullSimulation={mode === "full_simulation"}
        isOpen={isPanicOpen}
        onClose={handlePanicClose}
      />

      {/* Finish Confirmation Modal */}
      {showFinishConfirm && (
        <div
          aria-labelledby="confirm-finish-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog">
          <div className="pixel-shadow w-full max-w-md border-2 border-border bg-card p-6 space-y-4">
            <h3
              className="font-pixelify text-xl font-bold text-foreground"
              id="confirm-finish-title">
              {isAllAnswered
                ? siteCopy.practice.finishConfirmTitle
                : "Belum Bisa Menyelesaikan"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAllAnswered
                ? siteCopy.practice.finishConfirmAllAnswered
                : `Masih ada ${unansweredCount} soal yang belum dijawab. Seluruh soal harus dijawab sebelum sesi dapat diselesaikan.`}
            </p>
            <div className="flex gap-3 pt-2">
              {isAllAnswered ? (
                <>
                  <button
                    className="pixel-press pixel-shadow min-h-12 flex-1 border-2 border-border bg-moodi-sky px-4 font-semibold text-ink disabled:opacity-60"
                    disabled={isFinishing}
                    onClick={() => handleFinalize()}
                    type="button">
                    {isFinishing ? "Menyelesaikan..." : siteCopy.practice.finishNow}
                  </button>
                  <button
                    className="pixel-press min-h-12 border-2 border-border px-4 font-semibold hover:bg-muted"
                    disabled={isFinishing}
                    onClick={() => setShowFinishConfirm(false)}
                    type="button">
                    {siteCopy.practice.cancel}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="pixel-press pixel-shadow min-h-12 flex-1 border-2 border-border bg-moodi-sky px-4 font-semibold text-ink"
                    onClick={() => {
                      setShowFinishConfirm(false);
                      if (nextUnansweredIndex !== -1) {
                        setCurrentIndex(nextUnansweredIndex);
                      }
                    }}
                    type="button">
                    Lanjut Jawab Soal Belum Terisi →
                  </button>
                  <button
                    className="pixel-press min-h-12 border-2 border-border px-4 font-semibold hover:bg-muted"
                    onClick={() => setShowFinishConfirm(false)}
                    type="button">
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Soft Timer Expiry Dialog (Timed / Loose mode) */}
      {showSoftTimerEnd && (
        <div
          aria-labelledby="soft-timer-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog">
          <div className="pixel-shadow w-full max-w-md border-2 border-border bg-card p-6 space-y-4">
            <span className="inline-block border border-border bg-moodi-butter px-2 py-0.5 text-xs font-semibold text-ink">
              Waktu Habis
            </span>
            <h3
              className="font-pixelify text-xl font-bold text-foreground"
              id="soft-timer-title">
              {siteCopy.practice.softTimerEnd}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {!isAllAnswered
                ? `Waktu batas telah habis, tetapi masih ada ${unansweredCount} soal yang belum dijawab. Silakan lengkapi sisa soal terlebih dahulu untuk menyelesaikan sesi.`
                : "Semua soal telah terjawab. Kamu dapat langsung menyelesaikan sesi untuk melihat hasil dan pembahasan."}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                className="pixel-press pixel-shadow min-h-12 flex-1 border-2 border-border bg-moodi-sky px-4 font-semibold text-ink"
                onClick={() => {
                  setShowSoftTimerEnd(false);
                  if (!isAllAnswered && nextUnansweredIndex !== -1) {
                    setCurrentIndex(nextUnansweredIndex);
                  }
                }}
                type="button">
                {isAllAnswered ? siteCopy.practice.continuePractice : "Lengkapi Sisa Soal →"}
              </button>
              <button
                className={`min-h-12 border-2 border-border px-4 font-semibold transition-all ${
                  isAllAnswered
                    ? "pixel-press bg-background hover:bg-muted text-foreground"
                    : "cursor-not-allowed bg-muted text-muted-foreground opacity-50"
                }`}
                disabled={!isAllAnswered || isFinishing}
                onClick={() => isAllAnswered && handleFinalize()}
                type="button">
                {isAllAnswered ? siteCopy.practice.finish : `Selesai (${answeredIndices.size}/${questions.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
