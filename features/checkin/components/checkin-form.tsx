"use client";

import { useState, useTransition } from "react";
import { submitCheckinAction } from "../actions";

interface CheckinFormProps {
  initialSleep?: number;
  initialEnergy?: number;
  initialMood?: number;
  initialStress?: number;
  initialNote?: string | null;
  initialConsent?: boolean;
  onSuccess?: () => void;
}

export function CheckinForm({
  initialSleep = 6.5,
  initialEnergy = 3,
  initialMood = 3,
  initialStress = 2,
  initialNote = "",
  initialConsent = true,
  onSuccess,
}: CheckinFormProps) {
  const [sleepHours, setSleepHours] = useState<number>(initialSleep);
  const [energy, setEnergy] = useState<number>(initialEnergy);
  const [mood, setMood] = useState<number>(initialMood);
  const [stress, setStress] = useState<number>(initialStress);
  const [note, setNote] = useState<string>(initialNote ?? "");
  const [consent, setConsent] = useState<boolean>(initialConsent);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sleepPresets = [4, 5, 6, 7, 8];

  const energyLabels = [
    { value: 1, label: "Lemas", desc: "Perlu istirahat" },
    { value: 2, label: "Agak lelah", desc: "Energi rendah" },
    { value: 3, label: "Cukup", desc: "Stabil" },
    { value: 4, label: "Bertenaga", desc: "Fokus baik" },
    { value: 5, label: "Prima", desc: "Penuh semangat" },
  ];

  const moodLabels = [
    { value: 1, label: "Berat", desc: "Hari terasa berat" },
    { value: 2, label: "Muram", desc: "Kurang bersemangat" },
    { value: 3, label: "Netral", desc: "Biasa saja" },
    { value: 4, label: "Baik", desc: "Cukup ceria" },
    { value: 5, label: "Tenang", desc: "Sangat tenang & senang" },
  ];

  const stressLabels = [
    { value: 1, label: "Rileks", desc: "Pikiran tenang" },
    { value: 2, label: "Ringan", desc: "Terkendali" },
    { value: 3, label: "Sedang", desc: "Mulai ada beban" },
    { value: 4, label: "Tegang", desc: "Cukup cemas" },
    { value: 5, label: "Kewalahan", desc: "Sangat tertekan" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitCheckinAction({
        sleepHours,
        energy,
        mood,
        stress,
        note: note.trim() || null,
        wellbeingConsent: consent,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onSuccess?.();
      }
    });
  }

  return (
    <form
      className="pixel-shadow space-y-8 border-2 border-border bg-card p-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center border-2 border-border bg-moodi-butter font-pixelify text-xs font-bold text-ink">
            ✓
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Check-in 30 Detik
          </span>
        </div>
        <h2 className="mt-2 font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Hari ini kamu gimana?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kondisimu menentukan mode belajar hari ini: Pemulihan, Seimbang, atau
          Tantangan.
        </p>
      </div>

      {error && (
        <div className="border-2 border-border bg-moodi-peach/40 p-3 text-xs font-semibold text-ink">
          {error}
        </div>
      )}

      {/* 1. Jam Tidur Semalam */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-bold text-foreground">
            1. Berapa jam tidurmu semalam?
          </label>
          <span className="font-pixelify text-xl font-bold text-foreground">
            {sleepHours} jam
          </span>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {sleepPresets.map((hrs) => (
            <button
              className={`pixel-press flex-1 min-h-11 border-2 border-border px-3 text-xs font-bold transition-all sm:text-sm ${
                sleepHours === hrs
                  ? "bg-moodi-sky text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              key={hrs}
              onClick={() => setSleepHours(hrs)}
              type="button"
            >
              {hrs} jam {hrs < 5 ? "😴" : hrs >= 7 ? "✨" : "☕"}
            </button>
          ))}
        </div>

        {/* Fine slider */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground">0h</span>
          <input
            aria-label="Atur durasi tidur"
            className="h-2 w-full cursor-pointer accent-primary"
            max={14}
            min={1}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            step={0.5}
            type="range"
            value={sleepHours}
          />
          <span className="text-xs text-muted-foreground">14h</span>
        </div>
      </div>

      {/* 2. Tingkat Energi */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground">
          2. Seberapa bertenaga tubuhmu sekarang?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {energyLabels.map((item) => {
            const isSelected = energy === item.value;
            return (
              <button
                className={`pixel-press flex flex-col items-center justify-center border-2 border-border p-2 text-center transition-all ${
                  isSelected
                    ? "bg-moodi-sky text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary font-bold"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
                key={item.value}
                onClick={() => setEnergy(item.value)}
                type="button"
              >
                <span className="font-pixelify text-base sm:text-lg">
                  {item.value}
                </span>
                <span className="mt-0.5 hidden text-[10px] leading-tight sm:block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Pilihan: {energyLabels[energy - 1]?.label} —{" "}
          {energyLabels[energy - 1]?.desc}
        </p>
      </div>

      {/* 3. Suasana Hati (Mood) */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground">
          3. Bagaimana suasana hatimu saat ini?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {moodLabels.map((item) => {
            const isSelected = mood === item.value;
            return (
              <button
                className={`pixel-press flex flex-col items-center justify-center border-2 border-border p-2 text-center transition-all ${
                  isSelected
                    ? "bg-moodi-butter text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary font-bold"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
                key={item.value}
                onClick={() => setMood(item.value)}
                type="button"
              >
                <span className="font-pixelify text-base sm:text-lg">
                  {item.value}
                </span>
                <span className="mt-0.5 hidden text-[10px] leading-tight sm:block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Pilihan: {moodLabels[mood - 1]?.label} — {moodLabels[mood - 1]?.desc}
        </p>
      </div>

      {/* 4. Beban Pikiran / Stres */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-foreground">
          4. Seberapa berat beban pikiran atau rasa tegangmu?
        </label>
        <div className="grid grid-cols-5 gap-2">
          {stressLabels.map((item) => {
            const isSelected = stress === item.value;
            return (
              <button
                className={`pixel-press flex flex-col items-center justify-center border-2 border-border p-2 text-center transition-all ${
                  isSelected
                    ? "bg-moodi-peach text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary font-bold"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
                key={item.value}
                onClick={() => setStress(item.value)}
                type="button"
              >
                <span className="font-pixelify text-base sm:text-lg">
                  {item.value}
                </span>
                <span className="mt-0.5 hidden text-[10px] leading-tight sm:block">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Pilihan: {stressLabels[stress - 1]?.label} —{" "}
          {stressLabels[stress - 1]?.desc}
        </p>
      </div>

      {/* 5. Catatan Singkat (Opsional) */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-bold text-foreground" htmlFor="note">
            Catatan harian (opsional)
          </label>
          <span className="text-xs text-muted-foreground">
            {note.length}/280
          </span>
        </div>
        <textarea
          className="w-full border-2 border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          id="note"
          maxLength={280}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ada hal yang ingin kamu catat tentang harimu? (misal: habis ulangan fisika, kepala agak berat...)"
          rows={2}
          value={note}
        />
      </div>

      {/* Wellbeing Privacy Consent */}
      <label className="flex items-start gap-3 border border-border bg-muted/60 p-3 text-xs text-muted-foreground">
        <input
          checked={consent}
          className="mt-0.5 size-4 accent-primary"
          onChange={(e) => setConsent(e.target.checked)}
          type="checkbox"
        />
        <span>
          Simpan catatan kondisi ini untuk membantu MOODI merekomendasikan mode
          belajar harian yang sesuai. Data ini bersifat pribadi dan dapat dihapus
          kapan saja di Pengaturan.
        </span>
      </label>

      {/* Action */}
      <div className="pt-2">
        <button
          className="pixel-press pixel-shadow flex w-full min-h-13 items-center justify-center gap-2 border-2 border-border bg-moodi-sky px-6 py-3 font-pixelify text-lg font-bold text-ink shadow-[3px_3px_0_var(--border)] hover:bg-moodi-sky/90 disabled:opacity-50"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Menyesuaikan Ritme Belajar..." : "Simpan Check-in & Buka Rencana Hari Ini →"}
        </button>
      </div>
    </form>
  );
}
