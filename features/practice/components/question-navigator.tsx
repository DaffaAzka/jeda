"use client";

import { siteCopy } from "@/lib/copy/id";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onSelectIndex: (index: number) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onPanicClick?: () => void;
  isFullSimulation?: boolean;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answeredIndices,
  onSelectIndex,
  isOpenMobile = false,
  onCloseMobile,
  onPanicClick,
  isFullSimulation = false,
}: QuestionNavigatorProps) {
  const content = (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="font-pixelify text-lg font-bold text-foreground">
          {siteCopy.practice.questionNavigator}
        </h3>
        {onCloseMobile && (
          <button
            aria-label="Tutup navigasi"
            className="pixel-press border border-border px-2 py-0.5 text-xs font-bold lg:hidden"
            onClick={onCloseMobile}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isCurrent = currentIndex === index;
          const isAnswered = answeredIndices.has(index);

          return (
            <button
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Nomor ${index + 1}: ${isAnswered ? "Sudah dijawab" : "Belum dijawab"}`}
              className={`pixel-press flex size-10 items-center justify-center border-2 text-xs font-bold transition-all ${
                isCurrent
                  ? "border-border bg-moodi-sky text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary"
                  : isAnswered
                    ? "border-border bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:bg-muted"
              }`}
              key={index}
              onClick={() => {
                onSelectIndex(index);
                onCloseMobile?.();
              }}
              type="button"
            >
              <span className="flex items-center gap-0.5">
                {index + 1}
                {isAnswered && !isCurrent && (
                  <span aria-hidden="true" className="text-[10px]">
                    ✓
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-3 border border-border bg-foreground" />
          <span>Terjawab</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 border-2 border-border bg-moodi-sky" />
          <span>Dibuka</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 border border-border bg-card" />
          <span>Belum</span>
        </div>
      </div>

      {onPanicClick && (
        <div className="border-t-2 border-border pt-4">
          <button
            aria-label={siteCopy.practice.panicButton}
            className="pixel-press pixel-shadow flex w-full items-center justify-center gap-2 border-2 border-border bg-moodi-peach px-3 py-2.5 font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-peach/90"
            onClick={() => {
              onPanicClick();
              onCloseMobile?.();
            }}
            type="button"
          >
            <span aria-hidden="true" className="text-base">🌿</span>
            <span>{siteCopy.practice.panicButton}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop view: sticky sidebar beside question */}
      <aside
        aria-label={siteCopy.practice.questionNavigator}
        className="sticky top-20 hidden w-64 shrink-0 border-2 border-border bg-card p-4 lg:block"
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 lg:hidden backdrop-blur-xs"
          role="dialog"
        >
          <div className="pixel-shadow w-full max-w-md border-2 border-border bg-card p-5">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
