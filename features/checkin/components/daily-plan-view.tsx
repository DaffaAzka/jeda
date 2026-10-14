"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { StudentDashboardData } from "../queries";
import { toggleTaskStatusAction, swapTaskAction } from "../actions";
import { ActiveSessionCard } from "@/features/practice/components/active-session-card";

interface DailyPlanViewProps {
  data: StudentDashboardData;
  onEditCheckin?: () => void;
}

export function DailyPlanView({ data, onEditCheckin }: DailyPlanViewProps) {
  const { todayPlan, todayCheckin, profile, daysUntilExam, activeSession, user } =
    data;

  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [swappingTaskId, setSwappingTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (!todayPlan) return null;

  const mode = todayPlan.mode;

  const modeConfig = {
    recovery: {
      title: "Mode Pemulihan",
      subtitle: "Hari ini kita ringan dulu.",
      bg: "bg-moodi-sky/30",
      badgeBg: "bg-moodi-sky",
      border: "border-moodi-sky",
      accent: "text-ink",
    },
    challenge: {
      title: "Mode Tantangan",
      subtitle: "Energimu prima, dorong kemampuan maksimal!",
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
    <div className="space-y-8">
      {/* Active Tryout Session Alert */}
      {activeSession && <ActiveSessionCard session={activeSession} />}

      {/* Gentle Referral Banner (if high strain persists) */}
      {isReferralTriggered && (
        <aside
          aria-label="Dukungan Kesejahteraan"
          className="pixel-shadow flex flex-col gap-3 border-2 border-border bg-moodi-peach/40 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <span className="inline-block border border-border bg-card px-2 py-0.5 text-xs font-bold text-ink">
              🌿 Ruang Dukungan
            </span>
            <h3 className="font-semibold text-foreground">
              Beberapa hari ini terasa berat. Kamu tidak harus menghadapinya sendirian.
            </h3>
            <p className="text-xs text-muted-foreground">
              Tersedia konselor sekolah dan layanan kesehatan mental resmi terverifikasi yang siap mendengar tanpa menghakimi.
            </p>
          </div>
          <Link
            className="pixel-press pixel-shadow inline-flex shrink-0 items-center justify-center border-2 border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
            href="/dashboard/support"
          >
            Lihat Kontak Bantuan →
          </Link>
        </aside>
      )}

      {/* Mode Banner & Header */}
      <section
        aria-labelledby="today-mode-title"
        className={`pixel-shadow border-2 border-border ${modeConfig.bg} p-6 sm:p-8 space-y-4`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`border border-border px-3 py-1 font-pixelify text-xs font-bold ${modeConfig.badgeBg} text-ink`}
            >
              {modeConfig.title}
            </span>
            {daysUntilExam !== null && (
              <span className="border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground">
                ⏳ {daysUntilExam} Hari Menuju UTBK
              </span>
            )}
          </div>

          {onEditCheckin && (
            <button
              className="pixel-press border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
              onClick={onEditCheckin}
              type="button"
            >
              Ubah Check-in Hari Ini ✎
            </button>
          )}
        </div>

        <div>
          <h2
            className="font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            id="today-mode-title"
          >
            {modeConfig.subtitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            <span className="font-semibold">Kenapa ini?</span> {todayPlan.reason}
          </p>
        </div>

        {/* Target summary if present */}
        {profile?.targetUniversity && (
          <div className="border-t border-border/40 pt-3 text-xs text-muted-foreground">
            Target Belajar:{" "}
            <span className="font-semibold text-foreground">
              {profile.targetUniversity}
              {profile.targetMajor ? ` · ${profile.targetMajor}` : ""}
            </span>
          </div>
        )}
      </section>

      {/* Today's Tasks Cards */}
      <section aria-labelledby="tasks-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2
              className="font-pixelify text-2xl font-bold tracking-tight text-foreground"
              id="tasks-heading"
            >
              Rencana Belajar Hari Ini
            </h2>
            <p className="text-xs text-muted-foreground">
              {completedCount} dari {totalTasks} langkah terselesaikan.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="inline-block size-2.5 rounded-full bg-moodi-sky border border-border" />
            <span>{Math.round((completedCount / (totalTasks || 1)) * 100)}% selesai</span>
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

            // Determine direct CTA route
            const targetHref =
              task.type === "tryout"
                ? "/dashboard/mock-exam"
                : task.type === "calm"
                  ? "/dashboard/calm"
                  : "/dashboard/study";

            return (
              <article
                className={`pixel-shadow flex flex-col justify-between border-2 border-border p-5 transition-all ${
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
                      ⏱️ {task.estMinutes} mnt
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
                      className={`pixel-press flex items-center gap-1.5 border-2 border-border px-3 py-1 text-xs font-bold ${
                        isDone
                          ? "bg-foreground text-background"
                          : "bg-background text-foreground hover:bg-muted"
                      }`}
                      disabled={isToggling}
                      onClick={() => handleToggle(task.id, task.status)}
                      type="button"
                    >
                      <span>{isDone ? "✓ Selesai" : "○ Tandai Selesai"}</span>
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
                      className="pixel-press pixel-shadow flex w-full items-center justify-center border-2 border-border bg-moodi-sky py-2 text-xs font-bold text-ink hover:bg-moodi-sky/90"
                      href={targetHref}
                    >
                      Mulai Sekarang →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Daily Condition Snapshot */}
      {todayCheckin && (
        <section
          aria-labelledby="snapshot-title"
          className="border-2 border-border bg-card p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
            <h3
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              id="snapshot-title"
            >
              Kondisi Tercatat Hari Ini
            </h3>
            <span className="text-xs text-muted-foreground">
              Check-in 30 Detik
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
            <div className="border border-border bg-muted/40 p-2.5">
              <span className="block font-pixelify text-xl font-bold">
                {todayCheckin.sleepHours} jam
              </span>
              <span className="text-[11px] text-muted-foreground">Tidur</span>
            </div>
            <div className="border border-border bg-muted/40 p-2.5">
              <span className="block font-pixelify text-xl font-bold">
                {todayCheckin.energy}/5
              </span>
              <span className="text-[11px] text-muted-foreground">Energi</span>
            </div>
            <div className="border border-border bg-muted/40 p-2.5">
              <span className="block font-pixelify text-xl font-bold">
                {todayCheckin.mood}/5
              </span>
              <span className="text-[11px] text-muted-foreground">Mood</span>
            </div>
            <div className="border border-border bg-muted/40 p-2.5">
              <span className="block font-pixelify text-xl font-bold">
                {todayCheckin.stress}/5
              </span>
              <span className="text-[11px] text-muted-foreground">Stres</span>
            </div>
          </div>

          {todayCheckin.note && (
            <p className="mt-3 text-xs italic text-muted-foreground">
              &ldquo;{todayCheckin.note}&rdquo;
            </p>
          )}
        </section>
      )}
    </div>
  );
}
