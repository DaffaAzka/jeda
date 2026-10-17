"use client";

import { useState, useTransition } from "react";
import { ActiveSessionCard } from "@/features/practice/components/active-session-card";
import { LevelPicker } from "@/features/practice/components/level-picker";
import { startSessionAction } from "@/features/practice/actions";
import { PRACTICE } from "@/config/practice";
import { CloseIcon } from "@/components/icons";
import { siteCopy } from "@/lib/copy/id";
import type { TryoutMode } from "@/app/generated/prisma/enums";
import type { StudyCatalogData } from "@/features/practice/queries";

export function StudyCatalog({
  catalog,
  activeSession,
  mode,
  initialTopicId,
}: {
  catalog: StudyCatalogData["catalog"];
  activeSession: StudyCatalogData["activeSession"];
  mode?: "recovery" | "balanced" | "challenge" | null;
  initialTopicId?: string | null;
}) {
  const [selectedTopic, setSelectedTopic] = useState<{
    id: string;
    name: string;
    subtestName: string;
    questionCount: number;
  } | null>(() => {
    if (!initialTopicId) return null;
    for (const subtest of catalog) {
      const found = subtest.topics.find((t) => t.id === initialTopicId);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          subtestName: subtest.name,
          questionCount: found.questionCount,
        };
      }
    }
    return null;
  });

  const [level, setLevel] = useState<TryoutMode>("relaxed");
  const [questionCount, setQuestionCount] = useState<number>(
    PRACTICE.studyQuestionPresets[0] ?? 5,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    if (!selectedTopic) return;
    setError(null);
    startTransition(async () => {
      const result = await startSessionAction({
        scopeType: "topic",
        scopeId: selectedTopic.id,
        level,
        questionCount,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      {activeSession && <ActiveSessionCard session={activeSession} />}

      {catalog.length === 0 ? (
        <div className="border-2 border-border bg-muted p-6 text-center text-muted-foreground">
          {siteCopy.practice.noSubtestsAvailable}
        </div>
      ) : (
        <div className="space-y-10">
          {catalog.map((subtest) => (
            <section
              aria-labelledby={`subtest-${subtest.id}`}
              className="space-y-4"
              key={subtest.id}
            >
              <div className="flex flex-wrap items-baseline gap-2 border-b-2 border-border pb-2">
                <h2
                  className="font-pixelify text-2xl font-bold tracking-tight text-foreground"
                  id={`subtest-${subtest.id}`}
                >
                  {subtest.name}
                </h2>
                <span className="text-sm font-semibold text-muted-foreground">
                  ({subtest.code})
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subtest.topics.map((topic) => {
                  const isSelected = selectedTopic?.id === topic.id;
                  return (
                    <article
                      className={`pixel-press flex flex-col justify-between border-2 border-border p-5 text-left transition-all ${
                        isSelected
                          ? "bg-moodi-sky/20 shadow-[4px_4px_0_var(--border)] ring-2 ring-primary"
                          : "bg-card hover:bg-muted"
                      }`}
                      key={topic.id}
                    >
                      <div>
                        <h3 className="font-semibold text-foreground text-lg leading-snug">
                          {topic.name}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {topic.questionCount} {siteCopy.practice.questionsAvailable}
                        </p>
                      </div>

                      <div className="mt-5 flex items-end justify-between border-t border-border/40 pt-3">
                        <div className="text-xs text-muted-foreground">
                          {topic.attempts > 0 ? (
                            <span className="font-medium text-foreground">
                              {topic.attempts} soal dikerjakan, {topic.accuracy}% benar
                            </span>
                          ) : (
                            siteCopy.practice.noProgressYet
                          )}
                        </div>

                        <button
                          className="pixel-press pixel-shadow border-2 border-border bg-moodi-sky px-3 py-1.5 text-xs font-bold text-ink"
                          onClick={() => {
                            setSelectedTopic({
                              id: topic.id,
                              name: topic.name,
                              subtestName: subtest.name,
                              questionCount: topic.questionCount,
                            });
                            setError(null);
                          }}
                          type="button"
                        >
                          Pilih
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Start Topic Practice Panel / Modal */}
      {selectedTopic && (
        <div
          aria-labelledby="dialog-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
        >
          <div className="pixel-shadow max-h-[90vh] w-full max-w-lg overflow-y-auto border-2 border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {selectedTopic.subtestName}
                </span>
                <h3
                  className="font-pixelify text-2xl font-bold text-foreground"
                  id="dialog-title"
                >
                  {selectedTopic.name}
                </h3>
              </div>
              <button
                aria-label="Tutup panel"
                className="pixel-press inline-flex size-7 items-center justify-center border border-border text-xs font-bold hover:bg-muted"
                onClick={() => setSelectedTopic(null)}
                type="button"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {/* Question Count Presets */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-foreground">
                  {siteCopy.practice.questionCountPreset}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {PRACTICE.studyQuestionPresets.map((preset) => {
                    const isAvailable = selectedTopic.questionCount >= preset;
                    const isPicked = questionCount === preset;
                    return (
                      <button
                        className={`pixel-press min-h-10 border-2 border-border px-4 py-1 text-sm font-semibold ${
                          isPicked
                            ? "bg-moodi-sky text-ink shadow-[2px_2px_0_var(--border)]"
                            : "bg-background text-foreground hover:bg-muted"
                        } ${!isAvailable ? "opacity-40" : ""}`}
                        disabled={!isAvailable}
                        key={preset}
                        onClick={() => setQuestionCount(preset)}
                        type="button"
                      >
                        {preset} Soal {!isAvailable ? "(Kurang)" : ""}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Exposure Level Picker */}
              <LevelPicker
                mode={mode}
                onChange={(l) => setLevel(l)}
                value={level}
              />

              {error && (
                <div className="border-2 border-border bg-moodi-peach/30 p-3 text-xs font-semibold text-ink">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="pixel-press pixel-shadow min-h-12 flex-1 border-2 border-border bg-moodi-sky px-5 font-semibold text-ink disabled:opacity-60"
                  disabled={isPending}
                  onClick={handleStart}
                  type="button"
                >
                  {isPending ? "Menyiapkan sesi..." : siteCopy.practice.startPractice}
                </button>
                <button
                  className="pixel-press min-h-12 border-2 border-border px-5 font-semibold hover:bg-muted"
                  disabled={isPending}
                  onClick={() => setSelectedTopic(null)}
                  type="button"
                >
                  {siteCopy.practice.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
