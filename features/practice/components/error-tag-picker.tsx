"use client";

import { useState, useTransition } from "react";
import { saveErrorTagAction } from "@/features/practice/actions";
import { siteCopy } from "@/lib/copy/id";
import type { ErrorCause, TagSource } from "@/app/generated/prisma/enums";

const tags: Array<{ value: ErrorCause; label: string }> = [
  { value: "didnt_know", label: siteCopy.practice.errorTags.didnt_know },
  { value: "out_of_time", label: siteCopy.practice.errorTags.out_of_time },
  { value: "panic", label: siteCopy.practice.errorTags.panic },
  { value: "careless", label: siteCopy.practice.errorTags.careless },
];

export function ErrorTagPicker({
  sessionId,
  questionId,
  currentTag,
  tagSource,
}: {
  sessionId: string;
  questionId: string;
  currentTag: ErrorCause | null;
  tagSource: TagSource | null;
}) {
  const [selectedTag, setSelectedTag] = useState<ErrorCause | null>(currentTag);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function handleSelectTag(tag: ErrorCause) {
    setSelectedTag(tag);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await saveErrorTagAction(sessionId, questionId, tag);
      if (result.success) {
        setStatusMessage(siteCopy.practice.tagSaved);
      } else {
        setStatusMessage(result.error ?? siteCopy.practice.tagSaveError);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-none border-2 border-border bg-card p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-pixelify text-sm font-bold text-foreground">
            {siteCopy.practice.errorAutopsyTitle}
          </span>
          {tagSource === "auto" && (
            <span className="text-[11px] font-medium text-muted-foreground">
              {siteCopy.practice.initialGuessNote}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {siteCopy.practice.errorAutopsySubtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tags.map((t) => {
          const isSelected = selectedTag === t.value;
          return (
            <button
              aria-pressed={isSelected}
              className={`pixel-press flex min-h-11 items-center justify-center border-2 border-border px-3 py-2 text-center text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-foreground text-background shadow-[2px_2px_0_var(--border)] ring-1 ring-primary"
                  : "bg-background text-foreground hover:bg-muted"
              } ${isPending ? "opacity-70" : ""}`}
              disabled={isPending}
              key={t.value}
              onClick={() => handleSelectTag(t.value)}
              type="button"
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <p className="text-[11px] font-medium text-foreground/80 animate-fade-in">
          ✓ {statusMessage}
        </p>
      )}
    </div>
  );
}
