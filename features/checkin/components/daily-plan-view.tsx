"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { StudentDashboardData } from "../queries";
import { toggleTaskStatusAction, swapTaskAction } from "../actions";
import { ActiveSessionCard } from "@/features/practice/components/active-session-card";
import {
  ArrowRightIcon,
  CheckIcon,
  PencilIcon,
  SproutIcon,
} from "@/components/icons";

interface DailyPlanViewProps {
  data: StudentDashboardData;
  onEditCheckin?: () => void;
}

export function DailyPlanView({ data, onEditCheckin }: DailyPlanViewProps) {
  const { todayPlan, todayCheckin, profile, daysUntilExam, activeSession } =
    data;

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [swappingTaskId, setSwappingTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!todayPlan) return null;

  const mode = todayPlan.mode;

  const modeConfig = {
    recovery: {
      title: "Mode Pemulihan",
      subtitle: "Hari ini ritme santai dulu.",
      bg: "bg-moodi-sky/30",
      badgeBg: "bg-moodi-sky",
      border: "border-moodi-sky",
      accent: "text-ink",
    },
    challenge: {
      title: "Mode Tantangan",
      subtitle: "Energimu prima, dorong kapasitas maksimal.",
      bg: "bg-moodi-pink/30",
      badgeBg: "bg-moodi-pink",
      border: "border-moodi-pink",
      accent: "text-ink",
    },
    balanced: {
      title: "Mode Seimbang",
      subtitle: "Jaga ritme dan konsistensi belajarmu.",
      bg: "bg-moodi-butter/30",
      badgeBg: "bg-moodi-butter",
      border: "border-moodi-butter",
      accent: "text-ink",
    },
  }[mode];

  // Referral trigger check: 3 consecutive days mood <= 2 and stress >= 4
  const isReferralTriggered =
    todayCheckin &&
    todayCheckin.mood <= 2 &&
    todayCheckin.stress >= 4 &&
    data.recentCheckins.length >= 3 &&
    data.recentCheckins.slice(0, 3).every((c) => c.mood <= 2 && c.stress >= 4);

  function handleToggle(taskId: string, currentStatus: string) {
    setTogglingTaskId(taskId);
    startTransition(async () => {
      await toggleTaskStatusAction(
        taskId,
        currentStatus === "done" ? "pending" : "done",
      );
      setTogglingTaskId(null);
    });
  }

  function handleSwap(taskId: string) {
    setSwappingTaskId(taskId);
    startTransition(async () => {
      await swapTaskAction(taskId);
      setSwappingTaskId(null);
    });
  }

  const completedCount =
    todayPlan.tasks.filter((t) => t.status === "done").length;
  const totalTasks = todayPlan.tasks.length;

  return (
    <div className="space-y-6">
      {/* Active Tryout Session Alert */}
      {activeSession && <ActiveSessionCard session={activeSession} />}

      {/* Gentle Referral Banner (if high strain persists) */}
      {isReferralTriggered && (
        <aside
          aria-label="Dukungan Kesejahteraan"
          className="pixel-shadow flex flex-col gap-3 border-2 border-border bg-moodi-peach/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 border border-border bg-card px-2 py-0.5 text-xs font-bold text-ink">
              <SproutIcon className="size-3.5 text-foreground" />
              <span>Ruang Dukungan</span>
            </span>
            <h3 className="font-semibold text-foreground">
              Beberapa hari ini terasa berat. Kamu tidak harus menghadapinya sendirian.
            </h3>
            <p className="text-xs text-muted-foreground">
              Tersedia konselor sekolah dan kontak layanan resmi yang siap mendengar tanpa menghakimi.
            </p>
          </div>
          <Link
            className="pixel-press inline-flex shrink-0 items-center justify-center gap-1 border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-[2px_2px_0_var(--border)] hover:bg-muted"
            href="/dashboard/support"
          >
            <span>Kontak bantuan</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </aside>
      )}

      {/* Structural Mode Banner & Daily Status */}
      <section
        aria-labelledby="today-mode-title"
        className={`pixel-shadow border-2 border-border ${modeConfig.bg} p-5 sm:p-7 space-y-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`border-2 border-border px-3 py-1 font-pixelify text-xs font-bold ${modeConfig.badgeBg} text-ink`}
            >
              {modeConfig.title}
            </span>
            {daysUntilExam !== null && (
              <span className="border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
                {daysUntilExam} hari menuju UTBK
              </span>
            )}
          </div>

          {onEditCheckin && (
            <button
              className="pixel-press inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
              onClick={onEditCheckin}
              type="button"
            >
              <PencilIcon className="size-3" />
              <span>Ubah kondisi</span>
            </button>
          )}
        </div>

        <div>
          <h2
            className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            id="today-mode-title"
          >
            {modeConfig.subtitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            <span className="font-semibold">Kenapa ini?</span> {todayPlan.reason}
          </p>
        </div>

        {/* Streamlined Condition Snapshot (Replaces 4 duplicate stat cards) */}
        {todayCheckin && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            <span>
              Kondisi: Tidur {todayCheckin.sleepHours}j · Energi {todayCheckin.energy}/5 · Mood {todayCheckin.mood}/5 · Stres {todayCheckin.stress}/5
            </span>
            {todayCheckin.note && (
              <span className="italic text-foreground">
                — &ldquo;{todayCheckin.note}&rdquo;
              </span>
            )}
          </div>
        )}

        {/* Target summary if present */}
        {profile?.targetUniversity && (
          <div className="text-xs text-muted-foreground">
            Target:{" "}
            <span className="font-semibold text-foreground">
              {profile.targetUniversity}
              {profile.targetMajor ? ` · ${profile.targetMajor}` : ""}
            </span>
          </div>
        )}
      </section>

      {/* Today's Tasks */}
      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="font-pixelify text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              id="tasks-heading"
            >
              Rencana Belajar Hari Ini
            </h2>
            <p className="text-xs text-muted-foreground">
              {completedCount} dari {totalTasks} langkah terselesaikan.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {todayPlan.tasks.map((task) => {
            const isDone = task.status === "done";
            const isToggling = togglingTaskId === task.id;
            const isSwapping = swappingTaskId === task.id;

            const typeConfig = {
              review: { label: "Ulasan Materi", badge: "bg-moodi-sky" },
              practice: { label: "Latihan Soal", badge: "bg-moodi-butter" },
              tryout: { label: "Simulasi Tryout", badge: "bg-moodi-pink" },
              calm: { label: "Ruang Tenang", badge: "bg-moodi-peach" },
              rest: { label: "Istirahat", badge: "bg-muted" },
            }[task.type] ?? { label: "Tugas", badge: "bg-card" };

            const targetHref =
              task.type === "tryout"
                ? "/dashboard/mock-exam"
                : task.type === "calm"
                  ? "/dashboard/calm"
                  : "/dashboard/study";

            return (
              <article
                className={`pixel-shadow flex flex-col justify-between border-2 border-border p-4 transition-all sm:p-5 ${
                  isDone
                    ? "bg-muted/70 opacity-75"
                    : "bg-card hover:bg-card/90"
                }`}
                key={task.id}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`border border-border px-2.5 py-0.5 text-[11px] font-bold text-ink ${typeConfig.badge}`}
                    >
                      {typeConfig.label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {task.estMinutes} mnt
                    </span>
                  </div>

                  <h3
                    className={`mt-3 text-base font-bold leading-snug ${
                      isDone
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.reason && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {task.reason}
                    </p>
                  )}
                </div>

                <div className="mt-5 space-y-3 border-t border-border/40 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className={`pixel-press inline-flex min-h-9 items-center gap-1.5 border-2 border-border px-3 py-1 text-xs font-bold ${
                        isDone
                          ? "bg-foreground text-background"
                          : "bg-background text-foreground hover:bg-muted"
                      }`}
                      disabled={isToggling}
                      onClick={() => handleToggle(task.id, task.status)}
                      type="button"
                    >
                      {isDone && <CheckIcon className="size-3.5" />}
                      <span>{isDone ? "Selesai" : "Tandai selesai"}</span>
                    </button>

                    <button
                      className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-50"
                      disabled={isSwapping || isDone}
                      onClick={() => handleSwap(task.id)}
                      title="Ganti dengan pilihan topik alternatif"
                      type="button"
                    >
                      {isSwapping ? "..." : "Ganti"}
                    </button>
                  </div>

                  {!isDone && (
                    <Link
                      className="pixel-press pixel-shadow flex w-full items-center justify-center gap-1.5 border-2 border-border bg-moodi-sky py-2 text-xs font-bold text-ink hover:bg-moodi-sky/90"
                      href={targetHref}
                    >
                      <span>Mulai</span>
                      <ArrowRightIcon className="size-3.5" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
