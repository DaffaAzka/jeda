"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ActiveSessionCard } from "@/features/practice/components/active-session-card";
import { LevelPicker } from "@/features/practice/components/level-picker";
import { startSessionAction } from "@/features/practice/actions";
import { siteCopy } from "@/lib/copy/id";
import type { TryoutMode } from "@/app/generated/prisma/enums";
import type { MockExamData } from "@/features/practice/queries";

const levelLabels: Record<TryoutMode, string> = {
  relaxed: "Santai",
  timed: "Latihan waktu",
  full_simulation: "Simulasi penuh",
};

export function MockExamHub({
  subtests,
  recentSessions,
  activeSession,
  mode,
}: {
  subtests: MockExamData["subtests"];
  recentSessions: MockExamData["recentSessions"];
  activeSession: MockExamData["activeSession"];
  mode?: "recovery" | "balanced" | "challenge" | null;
}) {
  const [selectedSubtestId, setSelectedSubtestId] = useState<string>(
    subtests[0]?.id ?? "",
  );
  const [level, setLevel] = useState<TryoutMode>("timed");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    if (!selectedSubtestId) return;
    setError(null);
    startTransition(async () => {
      const result = await startSessionAction({
        scopeType: "subtest",
        scopeId: selectedSubtestId,
        level,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-10">
      {/* Active Session Alert/Card */}
      {activeSession && <ActiveSessionCard session={activeSession} />}

      {/* Main Tryout Form */}
      <section
        aria-labelledby="mock-exam-builder-title"
        className="space-y-6 border-2 border-border bg-card p-6 sm:p-8"
      >
        <div className="border-b border-border pb-4">
          <h2
            className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            id="mock-exam-builder-title"
          >
            {siteCopy.practice.startTryout}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteCopy.practice.mockExamDescription}
          </p>
        </div>

        {subtests.length === 0 ? (
          <p className="border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
            {siteCopy.practice.noSubtestsAvailable}
          </p>
        ) : (
          <div className="space-y-6">
            {/* Step 1: Pick Subtest */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-foreground">
                1. {siteCopy.practice.chooseSubtest}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subtests.map((subtest) => {
                  const isSelected = selectedSubtestId === subtest.id;
                  const minutes = Math.round(subtest.defaultSeconds / 60);

                  return (
                    <label
                      className={`pixel-press flex cursor-pointer flex-col justify-between border-2 border-border p-4 transition-all ${
                        isSelected
                          ? "bg-moodi-sky/30 shadow-[3px_3px_0_var(--border)] ring-2 ring-primary"
                          : "bg-background hover:bg-muted"
                      }`}
                      key={subtest.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {subtest.name}
                        </span>
                        <input
                          checked={isSelected}
                          className="size-4 accent-foreground"
                          name="subtestId"
                          onChange={() => setSelectedSubtestId(subtest.id)}
                          type="radio"
                          value={subtest.id}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{subtest.questionCount} soal siap</span>
                        <span>{minutes} menit asli</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* Step 2: Pick Level */}
            <div className="space-y-3">
              <span className="text-sm font-semibold text-foreground">
                2. Tingkat Tekanan Waktu
              </span>
              <LevelPicker
                mode={mode}
                onChange={(l) => setLevel(l)}
                value={level}
              />
            </div>

            {error && (
              <div className="border-2 border-border bg-moodi-peach/30 p-3 text-xs font-semibold text-ink">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                className="pixel-press pixel-shadow min-h-12 w-full border-2 border-border bg-moodi-sky px-6 font-semibold text-ink sm:w-auto disabled:opacity-60"
                disabled={isPending || !selectedSubtestId}
                onClick={handleStart}
                type="button"
              >
                {isPending ? "Menyiapkan tryout..." : siteCopy.practice.startTryout}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Recent Sessions List */}
      <section
        aria-labelledby="recent-sessions-title"
        className="space-y-4"
      >
        <div className="border-b-2 border-border pb-2">
          <h2
            className="font-pixelify text-2xl font-bold tracking-tight text-foreground"
            id="recent-sessions-title"
          >
            {siteCopy.practice.recentSessionsTitle}
          </h2>
        </div>

        {recentSessions.length === 0 ? (
          <div className="border-2 border-border bg-muted p-6 text-center text-sm text-muted-foreground">
            {siteCopy.practice.noRecentSessions}
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => {
              const formattedDate = session.finishedAt
                ? new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(session.finishedAt))
                : "";

              const scopeName = session.topic
                ? session.topic.name
                : session.subtest?.name ?? "Tryout";

              return (
                <article
                  className="flex flex-col gap-3 border-2 border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={session.id}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                        {levelLabels[session.mode]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {scopeName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {session._count.answers} soal · Skor:{" "}
                      {session.score !== null ? `${session.score}%` : "-"}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Link
                      className="pixel-press inline-flex min-h-10 items-center border-2 border-border bg-background px-4 text-xs font-semibold hover:bg-muted"
                      href={`/dashboard/sessions/${session.id}/review`}
                    >
                      Lihat Hasil & Autopsy
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
