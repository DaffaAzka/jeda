"use client";

import { useState, useEffect, useTransition } from "react";
import { saveCalmSessionAction, reframeThoughtAction } from "../actions";
import type { ReframedThoughtResult } from "@/lib/cbt/thought-reframe";
import {
  BulbIcon,
  CheckIcon,
  EarIcon,
  EyeIcon,
  HandIcon,
  HeartIcon,
  NoseIcon,
  PencilIcon,
  SproutIcon,
  TasteIcon,
  ThoughtIcon,
  WindIcon,
} from "@/components/icons";

type CalmTab = "breathing" | "grounding" | "reframing" | "journal";

export function CalmRoom({ userName = "" }: { userName?: string }) {
  const [activeTab, setActiveTab] = useState<CalmTab>("breathing");

  const tabs: Array<{ id: CalmTab; label: string; icon: typeof WindIcon }> = [
    { id: "breathing", label: "Napas", icon: WindIcon },
    { id: "grounding", label: "Grounding", icon: SproutIcon },
    { id: "reframing", label: "Reframe", icon: BulbIcon },
    { id: "journal", label: "Jurnal", icon: PencilIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <h1 className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ruang Tenang
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Luangkan sejenak untuk menenangkan pikiran, meredakan ketegangan fisik,
          dan memulihkan fokus belajarmu.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap border-b-2 border-border pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              className={`pixel-press flex min-h-11 items-center justify-center gap-2 border-2 border-border px-4 py-2 text-xs font-bold transition-all sm:text-sm ${isActive
                ? "bg-moodi-sky text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary"
                : "bg-card text-foreground hover:bg-muted"
                }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "breathing" && <BoxBreathingExercise />}
      {activeTab === "grounding" && <GroundingExercise />}
      {activeTab === "reframing" && <ReframingCards />}
      {activeTab === "journal" && <PrivateJournal />}
    </div>
  );
}

// 1. Box Breathing Component
function BoxBreathingExercise() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [secondsInPhase, setSecondsInPhase] = useState<number>(4);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  const [hasSaved, setHasSaved] = useState<boolean>(false);

  const phases = [
    { name: "Tarik Napas", instruction: "Tarik napas perlahan melalui hidung", color: "bg-moodi-sky text-ink", scale: "scale-110" },
    { name: "Tahan", instruction: "Tahan napas di dalam dada dengan tenang", color: "bg-moodi-butter text-ink", scale: "scale-110" },
    { name: "Hembuskan", instruction: "Hembuskan napas perlahan lewat mulut", color: "bg-moodi-peach text-ink", scale: "scale-90" },
    { name: "Tahan", instruction: "Tahan paru-paru kosong sejenak", color: "bg-muted text-foreground", scale: "scale-90" },
  ];

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSecondsInPhase((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        setPhaseIndex((curr) => {
          const next = (curr + 1) % 4;
          if (next === 0) {
            setCyclesCompleted((c) => c + 1);
          }
          return next;
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const currentPhase = phases[phaseIndex] ?? phases[0]!;

  async function handleStop() {
    setIsActive(false);
    if (cyclesCompleted > 0 && !hasSaved) {
      await saveCalmSessionAction({
        tool: "breathing",
        durationSeconds: cyclesCompleted * 16,
        note: `Menyelesaikan ${cyclesCompleted} siklus pernapasan kotak 4-4-4-4.`,
      });
      setHasSaved(true);
    }
  }

  return (
    <div className="pixel-shadow space-y-6 border-2 border-border bg-card p-6 text-center sm:p-8">
      <div className="mx-auto max-w-md space-y-1">
        <h2 className="font-pixelify text-2xl font-bold sm:text-3xl">
          Pernapasan Kotak (4-4-4-4)
        </h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Pola napas 4 detik tarik, 4 detik tahan, 4 detik hembus, 4 detik jeda
          untuk menenangkan detak jantung dan meredakan ketegangan.
        </p>
      </div>

      {/* Visual Box Container (Sharp pixel container) */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className="relative flex size-52 items-center justify-center border-4 border-dashed border-border bg-muted/20 sm:size-60">
          <div
            className={`flex size-40 items-center justify-center border-4 border-border shadow-[4px_4px_0_var(--border)] transition-all duration-1000 ease-in-out sm:size-44 ${currentPhase.color
              } ${isActive ? currentPhase.scale : "scale-100"}`}
          >
            <div className="space-y-1 select-none">
              <span className="font-pixelify text-3xl font-bold sm:text-4xl">
                {isActive ? secondsInPhase : "4"}
              </span>
              <p className="text-xs font-bold uppercase tracking-wider">
                {isActive ? currentPhase.name : "Siap"}
              </p>
            </div>
          </div>
        </div>

        {/* Phase instruction */}
        <p className="mt-4 min-h-6 text-sm font-semibold text-foreground">
          {isActive ? currentPhase.instruction : "Klik tombol di bawah untuk mulai bernapas."}
        </p>
      </div>

      {/* Cycles completed */}
      {cyclesCompleted > 0 && (
        <div className="text-xs font-semibold text-muted-foreground">
          {cyclesCompleted} siklus selesai ({cyclesCompleted * 16} detik)
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {!isActive ? (
          <button
            className="pixel-press pixel-shadow min-h-12 border-2 border-border bg-moodi-sky px-6 py-2.5 font-pixelify text-base font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-sky/90"
            onClick={() => {
              setIsActive(true);
              setHasSaved(false);
            }}
            type="button"
          >
            Mulai Latihan Napas
          </button>
        ) : (
          <button
            className="pixel-press pixel-shadow min-h-12 border-2 border-border bg-moodi-peach px-6 py-2.5 font-pixelify text-base font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-peach/90"
            onClick={handleStop}
            type="button"
          >
            Selesai
          </button>
        )}
      </div>
    </div>
  );
}

// 2. Grounding 5-4-3-2-1 Component
function GroundingExercise() {
  const [step, setStep] = useState<number>(1);
  const [completed, setCompleted] = useState<boolean>(false);

  const steps = [
    {
      num: 5,
      title: "5 Hal yang Kamu Lihat",
      prompt: "Lihat sekelilingmu. Sadari 5 benda yang kamu lihat (misalnya meja, pensil, jendela, buku, atau bayangan cahaya).",
      icon: EyeIcon,
      color: "bg-moodi-sky/30",
    },
    {
      num: 4,
      title: "4 Hal yang Bisa Kamu Sentuh",
      prompt: "Rasakan 4 sensasi fisik di tubuhmu saat ini (telapak kaki di lantai, tekstur meja, kain pakaian, atau aliran udara).",
      icon: HandIcon,
      color: "bg-moodi-butter/30",
    },
    {
      num: 3,
      title: "3 Suara yang Kamu Dengar",
      prompt: "Dengarkan lingkunganmu. Kenali 3 suara di sekitarmu (deru kipas angin, kendaraan di luar, atau helaan napasmu sendiri).",
      icon: EarIcon,
      color: "bg-moodi-pink/30",
    },
    {
      num: 2,
      title: "2 Aroma yang Kamu Cium",
      prompt: "Hiruplah udara di sekitarmu. Sadari 2 aroma di ruanganmu (kertas buku, wangi pakaian, atau udara segar).",
      icon: NoseIcon,
      color: "bg-moodi-peach/30",
    },
    {
      num: 1,
      title: "1 Rasa di Mulut atau Napas Dalam",
      prompt: "Rasakan satu hal di indera pengecapmu (teguk air putih, atau ambil 1 tarikan napas paling dalam dan penuh).",
      icon: TasteIcon,
      color: "bg-muted",
    },
  ];

  const current = steps[step - 1] ?? steps[0]!;
  const StepIcon = current.icon;

  async function handleNext() {
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      setCompleted(true);
      await saveCalmSessionAction({
        tool: "grounding",
        durationSeconds: 120,
        note: "Menyelesaikan latihan sensori grounding 5-4-3-2-1.",
      });
    }
  }

  return (
    <div className="pixel-shadow space-y-6 border-2 border-border bg-card p-6 sm:p-8">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-pixelify text-2xl font-bold">
          Teknik Grounding 5-4-3-2-1
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Latihan sensori sederhana untuk menarik pikiranmu kembali ke momen saat
          ini saat cemas melanda.
        </p>
      </div>

      {!completed ? (
        <div className={`space-y-5 border-2 border-border p-5 sm:p-7 ${current.color}`}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center border-2 border-border bg-card text-foreground">
              <StepIcon className="size-5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Langkah {step} dari 5
              </span>
              <h3 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-foreground sm:text-base">
            {current.prompt}
          </p>

          <div className="pt-2">
            <button
              className="pixel-press inline-flex min-h-11 items-center justify-center border-2 border-border bg-card px-5 py-2 text-xs font-bold text-foreground shadow-[2px_2px_0_var(--border)] hover:bg-muted sm:text-sm"
              onClick={handleNext}
              type="button"
            >
              <span>{step < 5 ? "Lanjut →" : "Selesai latihan"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 border-2 border-border bg-moodi-sky/30 p-6 text-center sm:p-8">
          <div className="mx-auto grid size-12 place-items-center border-2 border-border bg-card">
            <SproutIcon className="size-6 text-foreground" />
          </div>
          <h3 className="font-pixelify text-2xl font-bold text-foreground">
            Pikiranmu Sudah Lebih Hadir
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Beri apresiasi pada dirimu karena telah meluangkan waktu untuk berhenti sejenak.
          </p>
          <button
            className="pixel-press border-2 border-border bg-card px-4 py-2 text-xs font-bold"
            onClick={() => {
              setStep(1);
              setCompleted(false);
            }}
            type="button"
          >
            Ulangi Latihan
          </button>
        </div>
      )}
    </div>
  );
}

// 3. Reframing Component
function ReframingCards() {
  const [inputThought, setInputThought] = useState<string>("");
  const [aiResult, setAiResult] = useState<ReframedThoughtResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const promptChips = [
    "Waktunya tinggal sedikit, aku pasti gagal",
    "Skor tryout kemarin turun drastis",
    "Semua temanku belajarnya lebih rajin",
  ];

  const presetCards = [
    {
      thought: "Skor tryout kemarin turun, persiapan berbulan-bulan sia-sia.",
      fact: "Skor tryout berfluktuasi sesuai tingkat kesulitan soal. Penurunan skor adalah penunjuk materi yang perlu diulang, bukan vonis kelulusan.",
      tip: "Buka analisis kesalahan, pilih 2 soal yang konsepnya belum mantap.",
    },
    {
      thought: "Teman-temanku belajarnya lebih banyak, aku sudah pasti tertinggal.",
      fact: "Jam belajar panjang tidak selalu berarti paham. Belajar 1 jam yang fokus dan tenang jauh lebih efektif dibanding 4 jam dalam keadaan panik.",
      tip: "Fokus pada progres harianmu sendiri, bukan media sosial orang lain.",
    },
    {
      thought: "Kalau tidak lolos PTN impian, masa depanku hancur.",
      fact: "Banyak jalan untuk membangun masa depan dan karier yang baik. UTBK adalah salah satu pintu, bukan penentu harga dirimu.",
      tip: "Tarik napas dan ingat bahwa nilaimu sebagai manusia tidak diukur oleh sebuah skor.",
    },
  ];

  function handleReframe(customThought?: string) {
    const textToReframe = customThought ?? inputThought;
    if (!textToReframe.trim()) return;

    setErrorMessage(null);
    setSavedSuccess(false);

    startTransition(async () => {
      const res = await reframeThoughtAction(textToReframe);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.data) {
        setAiResult(res.data);
      }
    });
  }

  async function handleSaveAiResult() {
    if (!aiResult) return;
    await saveCalmSessionAction({
      tool: "reframing",
      durationSeconds: 120,
      note: `Pikiran: "${aiResult.thought}" -> Fakta: "${aiResult.fact}"`,
    });
    setSavedSuccess(true);
  }

  return (
    <div className="space-y-6">
      {/* AI Reframing Interactive Section */}
      <div className="pixel-shadow space-y-5 border-2 border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div>
            <h2 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
              Bedah Pikiran yang Mengganggumu
            </h2>
          </div>
          <p className="max-w-sm text-xs text-muted-foreground">
            Tuliskan rasa cemasmu. MOODI akan membantumu melihat sudut pandang objektif yang menenangkan.
          </p>
        </div>

        {/* Input & Prompt Chips */}
        <div className="space-y-3">
          <label
            className="block text-xs font-bold text-muted-foreground"
            htmlFor="thought-input"
          >
            Apa yang sedang terlintas di pikiranmu saat ini?
          </label>
          <div className="relative">
            <textarea
              className="w-full resize-none border-2 border-border bg-background p-3 text-sm text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-foreground"
              id="thought-input"
              maxLength={350}
              onChange={(e) => setInputThought(e.target.value)}
              placeholder="Contoh: Rasanya aku tidak bakal lolos karena tryout kemarin masih banyak yang salah..."
              rows={3}
              value={inputThought}
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              {inputThought.length}/350
            </span>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Contoh cepat:
            </span>
            {promptChips.map((chip) => (
              <button
                className="border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                key={chip}
                onClick={() => {
                  setInputThought(chip);
                  handleReframe(chip);
                }}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Error Message: NO RED COLOR. Uses moodi-peach token */}
          {errorMessage && (
            <div className="border-2 border-border bg-moodi-peach p-3 text-xs font-semibold text-ink">
              {errorMessage}
            </div>
          )}

          <div className="pt-1">
            <button
              className="pixel-press inline-flex min-h-11 items-center justify-center border-2 border-border bg-moodi-sky px-5 py-2 font-bold text-ink shadow-[2px_2px_0_var(--border)] disabled:opacity-60"
              disabled={isPending || !inputThought.trim()}
              onClick={() => handleReframe()}
              type="button"
            >
              {isPending ? "Memproses..." : "Bantu reframe"}
            </button>
          </div>
        </div>

        {/* AI Result Card */}
        {aiResult && (
          <div className="space-y-4 border-2 border-border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
              <span className="border border-border bg-card px-2 py-0.5 text-xs font-bold text-foreground">
                Pola Pikir: {aiResult.distortion}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Mode Refleksi Kognitif (Lokal)
              </span>
            </div>

            {/* Side-by-side: Thought vs Fact */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5 border-2 border-border bg-background p-3">
                <span className="text-xs font-bold text-muted-foreground">
                  Pesan
                </span>
                <p className="text-sm italic leading-relaxed text-foreground/80">
                  &ldquo;{aiResult.thought}&rdquo;
                </p>
              </div>

              <div className="space-y-1.5 border-2 border-border bg-moodi-sky/30 p-3">
                <span className="text-xs font-bold text-ink">
                  Respon
                </span>
                <p className="text-sm font-semibold leading-relaxed text-foreground">
                  {aiResult.validation}
                </p>
              </div>
            </div>

            {/* Small Action Step */}
            <div className="flex items-start gap-2.5 border border-border bg-card p-3">
              <BulbIcon className="mt-0.5 size-4 shrink-0 text-foreground" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">
                  Langkah Kecil:
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {aiResult.smallStep}
                </p>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                className="pixel-press border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
                onClick={handleSaveAiResult}
                type="button"
              >
                {savedSuccess ? "Tersimpan di Catatan Tenang" : "Simpan ke Catatan Tenang"}
              </button>
              <button
                className="border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAiResult(null);
                  setInputThought("");
                }}
                type="button"
              >
                Coba pikiran lain
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Inspirasi Cepat */}
      <div className="pixel-shadow space-y-5 border-2 border-border bg-card p-5 sm:p-7">
        <div className="border-b border-border/40 pb-3">
          <h3 className="font-pixelify text-lg font-bold sm:text-xl">
            Kartu Inspirasi Cepat (Pikiran vs Fakta)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih kartu di bawah untuk membalikkan rasa cemas yang umum dialami.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {presetCards.map((card, idx) => {
            const isFlipped = flippedIndex === idx;

            return (
              <article
                className={`pixel-shadow cursor-pointer border-2 border-border p-4 transition-all ${isFlipped ? "bg-moodi-sky/30" : "bg-background hover:bg-muted"
                  }`}
                key={idx}
                onClick={() => setFlippedIndex(isFlipped ? null : idx)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    {isFlipped ? "Fakta Nyata" : "Pikiran Otomatis"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isFlipped ? "Tutup" : "Balik →"}
                  </span>
                </div>

                <div className="min-h-20 py-2.5">
                  {!isFlipped ? (
                    <p className="text-sm font-semibold leading-relaxed text-foreground">
                      &ldquo;{card.thought}&rdquo;
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold leading-relaxed text-foreground">
                        {card.fact}
                      </p>
                      <p className="border-t border-border/30 pt-2 text-xs font-medium text-muted-foreground">
                        {card.tip}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 4. Private Journal Component
function PrivateJournal() {
  const [note, setNote] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;

    startTransition(async () => {
      await saveCalmSessionAction({
        tool: "reframing",
        durationSeconds: 180,
        note: note.trim(),
      });
      setSaved(true);
      setNote("");
    });
  }

  return (
    <div className="pixel-shadow space-y-5 border-2 border-border bg-card p-5 sm:p-7">
      <div className="border-b border-border/40 pb-3">
        <h2 className="font-pixelify text-xl font-bold sm:text-2xl">
          Jurnal Singkat Pribadi
        </h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Tuliskan apa pun yang mengganjal di pikiranmu tanpa perlu khawatir dinilai.
        </p>
      </div>

      {saved && (
        <div className="inline-flex items-center gap-1.5 border-2 border-border bg-moodi-sky/30 p-2.5 text-xs font-semibold text-ink">
          <CheckIcon className="size-3.5" />
          <span>Catatan refleksimu telah tersimpan.</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSave}>
        <textarea
          className="w-full border-2 border-border bg-background p-3 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="Tuliskan ketakutan, unek-unek, atau apa yang ingin kamu lepaskan hari ini..."
          rows={5}
          value={note}
        />

        <div className="flex justify-end">
          <button
            className="pixel-press inline-flex min-h-11 items-center justify-center border-2 border-border bg-moodi-butter px-5 py-2 font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-butter/90 disabled:opacity-50"
            disabled={isPending || !note.trim()}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan catatan"}
          </button>
        </div>
      </form>
    </div>
  );
}
