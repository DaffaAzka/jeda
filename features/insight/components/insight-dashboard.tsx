"use client";

import Link from "next/link";
import type { InsightDashboardData } from "../queries";

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
      <div className="pixel-shadow border-2 border-border bg-card p-8 sm:p-12 text-center space-y-6">
        <div className="grid size-16 mx-auto place-items-center border-2 border-border bg-moodi-butter font-pixelify text-2xl text-ink">
          📊
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="font-pixelify text-2xl sm:text-3xl font-bold text-foreground">
            Pola Belajarmu Sedang Terbentuk
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Insight muncul setelah 7 check-in. Baru {totalCheckins} yang terisi.
          </p>
        </div>

        {/* Progress pills */}
        <div className="flex justify-center gap-2 max-w-xs mx-auto">
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
            className="pixel-press pixel-shadow inline-flex min-h-11 items-center border-2 border-border bg-moodi-sky px-6 text-sm font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-sky/90"
            href="/dashboard"
          >
            Lakukan Check-in Hari Ini →
          </Link>
        </div>
      </div>
    );
  }

  // Calculate error distribution
  const totalErrors = errorSpread.reduce((acc, e) => acc + e.count, 0);
  const errorLabels: Record<string, { label: string; desc: string; color: string }> = {
    didnt_know: { label: "Belum Paham", desc: "Konsep belum dikuasai", color: "bg-moodi-sky" },
    out_of_time: { label: "Habis Waktu", desc: "Pacing waktu belum pas", color: "bg-moodi-butter" },
    panic: { label: "Panik / Tegang", desc: "Tekanan mental saat ujian", color: "bg-moodi-peach" },
    careless: { label: "Kurang Teliti", desc: "Salah baca atau hitung", color: "bg-muted" },
  };

  // Find dominant error cause
  const sortedErrors = [...errorSpread].sort((a, b) => b.count - a.count);
  const dominantError = sortedErrors[0];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center border-2 border-border bg-moodi-butter font-pixelify text-xs font-bold text-ink">
            📈
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Wawasan Belajar
          </span>
        </div>
        <h1 className="mt-2 font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Pola pada Datamu
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Melihat korelasi antara kualitas istirahat, ketenangan mental, dan
          akurasi pengerjaan soal secara objektif.
        </p>
      </div>

      {/* 1. Weekly Condition Trends Chart */}
      <section
        aria-labelledby="trends-heading"
        className="pixel-shadow border-2 border-border bg-card p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h2
              className="font-pixelify text-2xl font-bold text-foreground"
              id="trends-heading"
            >
              Tren Jam Tidur & Tingkat Stres (14 Hari)
            </h2>
            <p className="text-xs text-muted-foreground">
              Konsistensi tidur cukup berhubungan dengan stabilitas stamina saat mengerjakan soal.
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
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end min-h-48 pt-6 border-b border-border pb-4">
          {checkins.map((c, i) => {
            const sleepHeight = Math.min(100, Math.round((c.sleepHours / 9) * 100));
            const dateLabel = new Intl.DateTimeFormat("id-ID", {
              day: "numeric",
              month: "numeric",
            }).format(new Date(c.checkinDate));

            return (
              <div
                className="flex flex-col items-center gap-2 group relative"
                key={i}
              >
                <div className="w-full flex items-end justify-center gap-1 h-36">
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
                <span className="text-[10px] font-mono text-muted-foreground truncate w-full text-center">
                  {dateLabel}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Error Autopsy Spread */}
      <section
        aria-labelledby="error-spread-heading"
        className="pixel-shadow border-2 border-border bg-card p-6 sm:p-8 space-y-6"
      >
        <div className="border-b border-border/40 pb-3">
          <h2
            className="font-pixelify text-2xl font-bold text-foreground"
            id="error-spread-heading"
          >
            Peta Penyebab Kesalahan (Error Autopsy)
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Berdasarkan evaluasi mandiri dari seluruh tryout yang telah kamu selesaikan.
          </p>
        </div>

        {dominantError && totalErrors > 0 && (
          <div className="border-2 border-border bg-moodi-sky/30 p-4">
            <p className="text-sm font-semibold text-ink">
              💡 Temuan utama: Sebanyak{" "}
              {Math.round((dominantError.count / totalErrors) * 100)}% dari
              kesalahanmu bertumpu pada faktor{" "}
              <span className="underline font-bold">
                {errorLabels[dominantError.tag]?.label}
              </span>
              . Mengetahui ini membantumu fokus memperbaiki strategi, bukan sekadar menghafal ulang materi.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(errorLabels).map(([tagKey, meta]) => {
            const count =
              errorSpread.find((e) => e.tag === tagKey)?.count ?? 0;
            const pct =
              totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;

            return (
              <div
                className={`border-2 border-border p-4 space-y-2 ${meta.color}/30`}
                key={tagKey}
              >
                <div className="flex items-center justify-between">
                  <span className="font-pixelify text-xl font-bold">
                    {pct}%
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    ({count} soal)
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                  {meta.label}
                </h3>
                <p className="text-xs text-muted-foreground">{meta.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Topic Mastery Map */}
      <section
        aria-labelledby="mastery-heading"
        className="pixel-shadow border-2 border-border bg-card p-6 sm:p-8 space-y-6"
      >
        <div className="border-b border-border/40 pb-3">
          <h2
            className="font-pixelify text-2xl font-bold text-foreground"
            id="mastery-heading"
          >
            Peta Penguasaan Topik
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Topik-topik yang telah kamu latih beserta tingkat akurasi rata-ratanya.
          </p>
        </div>

        {topicMastery.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground p-6">
            Belum ada topik yang dipelajari. Mulai latihan di tab Belajar.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {topicMastery.map((item) => (
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3"
                key={item.topicId}
              >
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    {item.subtestName} ({item.subtestCode})
                  </span>
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">
                    {item.topicName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {item.correct} benar dari {item.attempts} percobaan
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-28 sm:w-36 h-3 border border-border bg-muted overflow-hidden">
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
                  <span className="font-pixelify text-sm font-bold w-12 text-right">
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
