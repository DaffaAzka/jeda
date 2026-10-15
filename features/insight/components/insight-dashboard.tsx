"use client";

import Link from "next/link";
import type { InsightDashboardData } from "../queries";
import { BulbIcon, ChartBarIcon, ArrowRightIcon } from "@/components/icons";

export function InsightDashboard({ data }: { data: InsightDashboardData }) {
  const {
    hasEnoughCheckins,
    totalCheckins,
    minRequired,
    checkins,
    errorSpread,
    topicMastery,
  } = data;

  if (!hasEnoughCheckins) {
    return (
      <div className="pixel-shadow space-y-6 border-2 border-border bg-card p-8 text-center sm:p-12">
        <div className="mx-auto grid size-16 place-items-center border-2 border-border bg-moodi-butter text-ink">
          <ChartBarIcon className="size-8" />
        </div>
        <div className="mx-auto max-w-md space-y-2">
          <h2 className="font-pixelify text-2xl font-bold text-foreground sm:text-3xl">
            Belum Cukup Data Check-in
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Wawasan belajar terbuka setelah minimal 7 hari check-in. Saat ini baru {totalCheckins} check-in terisi.
          </p>
        </div>

        {/* Progress pills */}
        <div className="mx-auto flex max-w-xs justify-center gap-2">
          {Array.from({ length: minRequired }).map((_, i) => (
            <div
              className={`h-3 flex-1 border border-border ${
                i < totalCheckins ? "bg-moodi-sky" : "bg-muted"
              }`}
              key={i}
            />
          ))}
        </div>

        <div className="pt-2">
          <Link
            className="pixel-press inline-flex min-h-11 items-center gap-2 border-2 border-border bg-moodi-sky px-6 text-sm font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-sky/90"
            href="/dashboard"
          >
            <span>Isi check-in hari ini</span>
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Calculate error distribution
  const totalErrors = errorSpread.reduce((acc, e) => acc + e.count, 0);
  const errorLabels: Record<string, { label: string; desc: string; color: string; barColor: string }> = {
    didnt_know: { label: "Belum Paham", desc: "Konsep belum dikuasai", color: "bg-moodi-sky", barColor: "bg-moodi-sky" },
    out_of_time: { label: "Habis Waktu", desc: "Manajemen waktu belum pas", color: "bg-moodi-butter", barColor: "bg-moodi-butter" },
    panic: { label: "Panik / Cemas", desc: "Tekanan mental saat mengerjakan", color: "bg-moodi-peach", barColor: "bg-moodi-peach" },
    careless: { label: "Kurang Teliti", desc: "Salah baca atau keliru hitung", color: "bg-moodi-pink", barColor: "bg-moodi-pink" },
  };

  const sortedErrors = [...errorSpread].sort((a, b) => b.count - a.count);
  const dominantError = sortedErrors[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Pola pada Datamu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Melihat korelasi antara durasi tidur, tingkat stres, dan akurasi pengerjaan soal secara objektif.
        </p>
      </div>

      {/* 1. Weekly Condition Trends Chart */}
      <section
        aria-labelledby="trends-heading"
        className="pixel-shadow space-y-6 border-2 border-border bg-card p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h2
              className="font-pixelify text-xl font-bold text-foreground sm:text-2xl"
              id="trends-heading"
            >
              Tren Jam Tidur & Tingkat Stres (14 Hari)
            </h2>
            <p className="text-xs text-muted-foreground">
              Tidur cukup berhubungan langsung dengan ketahanan fokus saat mengerjakan soal.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="size-3 border border-border bg-moodi-sky" />
              <span>Jam Tidur</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 border border-border bg-moodi-peach" />
              <span>Tingkat Stres</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Columns */}
        <div className="grid min-h-44 grid-cols-7 sm:grid-cols-14 items-end gap-2 border-b border-border pb-4 pt-4">
          {checkins.map((c, i) => {
            const sleepHeight = Math.min(100, Math.round((c.sleepHours / 9) * 100));
            const dateLabel = new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "numeric",
            }).format(new Date(c.checkinDate));

            return (
              <div
                className="group relative flex flex-col items-center gap-2"
                key={i}
              >
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  {/* Sleep bar */}
                  <div
                    className="w-1/2 border border-border bg-moodi-sky transition-all group-hover:brightness-95"
                    style={{ height: `${sleepHeight}%` }}
                    title={`${c.sleepHours} jam tidur`}
                  />
                  {/* Stress bar */}
                  <div
                    className="w-1/2 border border-border bg-moodi-peach transition-all group-hover:brightness-95"
                    style={{ height: `${(c.stress / 5) * 100}%` }}
                    title={`Stres skor ${c.stress}/5`}
                  />
                </div>
                <span className="w-full truncate text-center font-mono text-[10px] text-muted-foreground">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Error Autopsy: Single Stacked Bar (Replaces 4 duplicate KPI cards) */}
      <section
        aria-labelledby="error-spread-heading"
        className="pixel-shadow space-y-5 border-2 border-border bg-card p-5 sm:p-7"
      >
        <div className="border-b border-border/40 pb-3">
          <h2
            className="font-pixelify text-xl font-bold text-foreground sm:text-2xl"
            id="error-spread-heading"
          >
            Peta Penyebab Kesalahan (Error Autopsy)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Distribusi alasan salah dari latihan dan tryout yang sudah kamu selesaikan.
          </p>
        </div>

        {dominantError && totalErrors > 0 && (
          <div className="flex items-start gap-2.5 border-2 border-border bg-moodi-sky/30 p-3.5">
            <BulbIcon className="mt-0.5 size-4 shrink-0 text-ink" />
            <p className="text-xs leading-relaxed text-ink sm:text-sm">
              <span className="font-bold">Temuan utama:</span> Sebanyak{" "}
              {Math.round((dominantError.count / totalErrors) * 100)}% dari kesalahanmu bertumpu pada faktor{" "}
              <span className="font-bold underline">
                {errorLabels[dominantError.tag]?.label}
              </span>
              . Fokuskan sesi berikutnya pada strategi ini, bukan sekadar menghafal.
            </p>
          </div>
        )}

        {/* Proportional Stacked Bar */}
        {totalErrors > 0 ? (
          <div className="space-y-4">
            <div className="flex h-6 w-full overflow-hidden border-2 border-border">
              {Object.entries(errorLabels).map(([tagKey, meta]) => {
                const count = errorSpread.find((e) => e.tag === tagKey)?.count ?? 0;
                const pct = Math.round((count / totalErrors) * 100);
                if (pct <= 0) return null;

                return (
                  <div
                    className={`${meta.barColor} transition-all border-r border-border last:border-r-0`}
                    key={tagKey}
                    style={{ width: `${pct}%` }}
                    title={`${meta.label}: ${pct}% (${count} soal)`}
                  />
                );
              })}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
              {Object.entries(errorLabels).map(([tagKey, meta]) => {
                const count = errorSpread.find((e) => e.tag === tagKey)?.count ?? 0;
                const pct = totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;

                return (
                  <div
                    className="border border-border bg-background p-3 space-y-1"
                    key={tagKey}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`size-3 border border-border ${meta.barColor}`} />
                      <span className="text-xs font-bold text-foreground">
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="font-pixelify text-lg font-bold">
                        {pct}%
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {count} soal
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {meta.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-4">
            Belum ada data kesalahan tryout yang ditandai.
          </p>
        )}
      </section>

      {/* 3. Topic Mastery Map */}
      <section
        aria-labelledby="mastery-heading"
        className="pixel-shadow space-y-5 border-2 border-border bg-card p-5 sm:p-7"
      >
        <div className="border-b border-border/40 pb-3">
          <h2
            className="font-pixelify text-xl font-bold text-foreground sm:text-2xl"
            id="mastery-heading"
          >
            Peta Penguasaan Topik
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Tingkat akurasi dari tiap topik yang telah kamu latih.
          </p>
        </div>

        {topicMastery.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Belum ada topik yang dipelajari. Mulai latihan di tab Belajar.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {topicMastery.map((item) => (
              <div
                className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                key={item.topicId}
              >
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                    {item.subtestName} ({item.subtestCode})
                  </span>
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                    {item.topicName}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-3 w-28 overflow-hidden border border-border bg-muted sm:w-36">
                    <div
                      className={`h-full ${
                        item.accuracy >= 75
                          ? "bg-moodi-sky"
                          : item.accuracy >= 50
                            ? "bg-moodi-butter"
                            : "bg-moodi-peach"
                      }`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-pixelify text-sm font-bold">
                    {item.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
