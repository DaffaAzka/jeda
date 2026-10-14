"use client";

import { useState, useEffect, useTransition } from "react";
import { saveCalmSessionAction, reframeThoughtAction } from "../actions";
import type { ReframedThoughtResult } from "@/lib/ai/gemini-reframe";

type CalmTab = "breathing" | "grounding" | "reframing" | "journal";

export function CalmRoom({ userName = "" }: { userName?: string }) {
  const [activeTab, setActiveTab] = useState<CalmTab>("breathing");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center border-2 border-border bg-moodi-sky font-pixelify text-xs font-bold text-ink">
            🌿
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ruang Tenang
          </span>
        </div>
        <h1 className="mt-2 font-pixelify text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Beri Ruang untuk Bernapas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Luangkan sejenak untuk menenangkan pikiran, meredakan ketegangan fisik,
          dan memulihkan fokus belajarmu.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap gap-2 border-b-2 border-border pb-4">
        {[
          { id: "breathing", label: "Pernapasan Kotak (4-4-4-4)", icon: "🌬️" },
          { id: "grounding", label: "Grounding 5-4-3-2-1", icon: "🌱" },
          { id: "reframing", label: "Pikiran vs Fakta", icon: "💡" },
          { id: "journal", label: "Jurnal Singkat", icon: "📝" },
        ].map((tab) => (
          <button
            className={`pixel-press border-2 border-border px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              activeTab === tab.id
                ? "bg-moodi-sky text-ink shadow-[2px_2px_0_var(--border)] ring-2 ring-primary"
                : "bg-card text-foreground hover:bg-muted"
            }`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CalmTab)}
            type="button"
          >
            <span>{tab.icon} </span>
            <span>{tab.label}</span>
          </button>
        ))}
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
    { name: "Tarik Napas", instruction: "Tarik napas perlahan melalui hidung", color: "bg-moodi-sky text-ink", scale: "scale-125" },
    { name: "Tahan", instruction: "Tahan napas di dalam dada dengan tenang", color: "bg-moodi-butter text-ink", scale: "scale-125" },
    { name: "Hembuskan", instruction: "Hembuskan napas perlahan lewat mulut", color: "bg-moodi-peach text-ink", scale: "scale-75" },
    { name: "Tahan", instruction: "Tahan paru-paru kosong sejenak", color: "bg-muted text-foreground", scale: "scale-75" },
  ];

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSecondsInPhase((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        // Advance phase
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
    <div className="pixel-shadow border-2 border-border bg-card p-6 sm:p-10 space-y-8 text-center">
      <div className="max-w-md mx-auto space-y-2">
        <h2 className="font-pixelify text-2xl sm:text-3xl font-bold">
          Pernapasan Kotak (4-4-4-4)
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pola napas 4 detik tarik, 4 detik tahan, 4 detik hembus, 4 detik jeda
          efektif mengaktifkan sistem saraf parasimpatis dan menurunkan detak jantung.
        </p>
      </div>

      {/* Visual Orb Container */}
      <div className="my-8 flex flex-col items-center justify-center">
        <div className="relative flex size-56 sm:size-64 items-center justify-center rounded-full border-4 border-dashed border-border/60 bg-muted/20">
          <div
            className={`flex size-40 sm:size-44 items-center justify-center rounded-full border-2 border-border shadow-[4px_4px_0_var(--border)] transition-all duration-1000 ease-in-out ${
              currentPhase.color
            } ${isActive ? currentPhase.scale : "scale-100"}`}
          >
            <div className="space-y-1">
              <span className="font-pixelify text-3xl sm:text-4xl font-bold">
                {isActive ? secondsInPhase : "4s"}
              </span>
              <p className="font-pixelify text-xs sm:text-sm font-semibold uppercase tracking-wider">
                {isActive ? currentPhase.name : "Siap"}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 font-semibold text-sm sm:text-base text-foreground min-h-6">
          {isActive
            ? currentPhase.instruction
            : "Tekan tombol di bawah untuk memulai sesi napas."}
        </p>
        <p className="text-xs text-muted-foreground">
          Siklus selesai: {cyclesCompleted}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!isActive ? (
          <button
            className="pixel-press pixel-shadow min-h-12 border-2 border-border bg-moodi-sky px-8 font-pixelify text-base font-bold text-ink shadow-[3px_3px_0_var(--border)] hover:bg-moodi-sky/90"
            onClick={() => {
              setIsActive(true);
              setPhaseIndex(0);
              setSecondsInPhase(4);
            }}
            type="button"
          >
            Mulai Bernapas ▶
          </button>
        ) : (
          <button
            className="pixel-press min-h-12 border-2 border-border bg-background px-8 font-semibold text-foreground hover:bg-muted"
            onClick={handleStop}
            type="button"
          >
            Jeda / Selesai ⏹
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
      prompt: "Lihat ke sekelilingmu. Sebutkan dalam hati 5 benda yang kamu lihat (misal: jam dinding, pensil, jendela, buku, lampu).",
      icon: "👀",
      color: "bg-moodi-sky/30",
    },
    {
      num: 4,
      title: "4 Hal yang Bisa Kamu Sentuh",
      prompt: "Rasakan 4 sensasi fisik di tubuhmu saat ini (misal: telapak kaki di lantai, tekstur meja, kain bajumu, atau udara sejuk).",
      icon: "✋",
      color: "bg-moodi-butter/30",
    },
    {
      num: 3,
      title: "3 Suara yang Kamu Dengar",
      prompt: "Dengarkan lingkunganmu. Kenali 3 suara di sekitarmu (misal: desau kipas angin, deru kendaraan jauh, detak jam).",
      icon: "👂",
      color: "bg-moodi-pink/30",
    },
    {
      num: 2,
      title: "2 Aroma yang Kamu Cium",
      prompt: "Hiruplah udara di sekitarmu. Sadari 2 aroma di ruanganmu (misal: wangi buku, wangi pakaian, atau udara segar).",
      icon: "👃",
      color: "bg-moodi-peach/30",
    },
    {
      num: 1,
      title: "1 Rasa di Mulut atau Napas Dalam",
      prompt: "Rasakan satu hal di indera pengecapmu (rasa air putih, atau ambil 1 tarikan napas paling dalam dan penuh).",
      icon: "👅",
      color: "bg-muted",
    },
  ];

  const current = steps[step - 1] ?? steps[0]!;

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
    <div className="pixel-shadow border-2 border-border bg-card p-6 sm:p-10 space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-pixelify text-2xl font-bold">
          Teknik Grounding 5-4-3-2-1
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Latihan sensori sederhana untuk menarik pikiranmu kembali ke momen saat
          ini saat dilanda kecemasan atau pikiran berlari.
        </p>
      </div>

      {!completed ? (
        <div className={`border-2 border-border p-6 sm:p-8 space-y-5 ${current.color}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{current.icon}</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Langkah {step} dari 5
              </span>
              <h3 className="font-pixelify text-2xl font-bold text-foreground">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-foreground">
            {current.prompt}
          </p>

          <div className="pt-2">
            <button
              className="pixel-press pixel-shadow border-2 border-border bg-card px-6 py-2.5 font-bold text-foreground shadow-[2px_2px_0_var(--border)] hover:bg-muted"
              onClick={handleNext}
              type="button"
            >
              {step < 5 ? "Sudah, Lanjut ke Langkah Berikutnya →" : "Selesai Latihan Grounding ✓"}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-border bg-moodi-sky/30 p-8 text-center space-y-4">
          <span className="text-4xl">🌱</span>
          <h3 className="font-pixelify text-2xl font-bold text-foreground">
            Pikiranmu Sudah Lebih Hadir Saat Ini
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Kamu baru saja menyadarkan tubuh dan pikiranmu. Beri apresiasi pada
            dirimu karena telah meluangkan waktu sejenak.
          </p>
          <button
            className="pixel-press border-2 border-border bg-card px-5 py-2 text-xs font-bold"
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

// 3. Pikiran vs Fakta (Reframing) Component with Gemini AI
function ReframingCards() {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [inputThought, setInputThought] = useState("");
  const [aiResult, setAiResult] = useState<ReframedThoughtResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const promptChips = [
    "Takut nilaiku gak cukup buat jurusan impian",
    "Waktu ujian makin dekat tapi masih belum siap",
    "Ngerasa gak sepintar teman-teman sekelas",
    "Takut bikin orang tua kecewa",
  ];

  const presetCards = [
    {
      thought: "Skor tryout-ku masih jauh dari target, aku pasti gagal UTBK.",
      fact: "Tryout adalah alat uji dan diagnosis kelemahan materi hari ini, bukan ramalan masa depan. Menemukan kesalahan sekarang justru mencegahnya terjadi saat ujian asli.",
      tip: "Fokus pada 1–2 topik terlemah tiap minggunya.",
    },
    {
      thought: "Orang lain belajar 10 jam tanpa henti, aku tertinggal jauh.",
      fact: "Riset kognitif membuktikan bahwa belajar terarah 2–3 jam dengan tidur cukup jauh lebih efektif dalam menyimpan memori jangka panjang daripada begadang kelelahan.",
      tip: "Kualitas dan konsistensi harian mengalahkan maraton panik.",
    },
    {
      thought: "Mengambil hari istirahat membuatku membuang waktu percuma.",
      fact: "Otak manusia membutuhkan fase istirahat dan tidur untuk konsolidasi memori. Mengistirahatkan pikiran tetap dihitung sebagai bagian dari konsistensi belajar.",
      tip: "Istirahat terencana mencegah burnout fatal menjelang ujian.",
    },
    {
      thought: "Aku selalu panik dan blank saat melihat soal yang panjang dan sulit.",
      fact: "Rasa cemas adalah respons alami tubuh saat menghadapi tantangan. Kamu bisa mengambil jeda napas 30 detik, melewati soal tersebut, dan mengerjakannya nanti.",
      tip: "Pilah soal mudah dulu untuk membangun rasa percaya diri.",
    },
  ];

  function handleReframe(thoughtToProcess?: string) {
    const target = (thoughtToProcess ?? inputThought).trim();
    if (!target || isPending) return;

    setErrorMessage(null);
    setSavedSuccess(false);

    startTransition(async () => {
      const res = await reframeThoughtAction(target);
      if (res.ok && res.data) {
        setAiResult(res.data);
      } else {
        setErrorMessage(res.error ?? "Gagal memproses reframing. Coba lagi.");
      }
    });
  }

  async function handleSaveAiResult() {
    if (!aiResult) return;
    await saveCalmSessionAction({
      tool: "reframing",
      durationSeconds: 120,
      note: `[Reframing AI] Pikiran: "${aiResult.thought}" -> Fakta: "${aiResult.fact}"`,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  return (
    <div className="space-y-8">
      {/* AI Reframing Interactive Section */}
      <div className="pixel-shadow border-2 border-border bg-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-moodi-sky/30 px-2.5 py-0.5 text-xs font-bold text-foreground">
                Reframing AI ✨
              </span>
              <span className="text-xs text-muted-foreground">Didukung Gemini</span>
            </div>
            <h2 className="mt-1 font-pixelify text-2xl font-bold text-foreground">
              Bedah Pikiran yang Mengganggumu
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm">
            Tuliskan rasa cemas atau takutmu. AI akan membantumu melihat sudut
            pandang objektif yang lebih menenangkan.
          </p>
        </div>

        {/* Input & Prompt Chips */}
        <div className="space-y-3">
          <label
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
            htmlFor="thought-input"
          >
            Apa yang sedang terlintas di pikiranmu saat ini?
          </label>
          <div className="relative">
            <textarea
              className="w-full resize-none border-2 border-border bg-background p-4 text-sm text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-foreground"
              id="thought-input"
              maxLength={350}
              onChange={(e) => setInputThought(e.target.value)}
              placeholder="Contoh: Rasanya aku nggak bakal lolos jurusan impian karena tryout kemarin masih jelek..."
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
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
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

          {errorMessage && (
            <div className="rounded-lg border border-red-500 bg-red-500/10 p-3 text-xs font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              className="pixel-press pixel-shadow border-2 border-border bg-moodi-sky px-6 py-2.5 font-bold text-ink shadow-[2px_2px_0_var(--border)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
              disabled={isPending || !inputThought.trim()}
              onClick={() => handleReframe()}
              type="button"
            >
              {isPending ? "Sedang Membedah Pikiran... ⏳" : "Bantu Aku Reframe Pikiran Ini ✨"}
            </button>
          </div>
        </div>

        {/* AI Result Card */}
        {aiResult && (
          <div className="mt-6 rounded-xl border-2 border-border bg-muted/30 p-5 sm:p-6 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
              <span className="rounded-md border border-border bg-moodi-sand/50 px-2.5 py-1 text-xs font-bold text-foreground">
                🎯 Pola Pikir Terdeteksi: {aiResult.distortion}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Teknik Cognitive Reframing
              </span>
            </div>

            {/* Validation Message */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-bold text-moodi-pink uppercase tracking-wide">
                💚 Validasi Perasaanmu:
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {aiResult.validation}
              </p>
            </div>

            {/* Side-by-side: Thought vs Fact */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border-2 border-border bg-background p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  💭 Pikiran Awal yang Membuat Cemas
                </span>
                <p className="text-sm font-medium italic text-foreground/80 leading-relaxed">
                  &ldquo;{aiResult.thought}&rdquo;
                </p>
              </div>

              <div className="rounded-lg border-2 border-border bg-moodi-sky/30 p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink">
                  ✨ Fakta Objektif & Menenangkan
                </span>
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {aiResult.fact}
                </p>
              </div>
            </div>

            {/* Small Action Step */}
            <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground">
                  Langkah Kecil Hari Ini:
                </span>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {aiResult.smallStep}
                </p>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                className="rounded-lg border-2 border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
                onClick={handleSaveAiResult}
                type="button"
              >
                {savedSuccess ? "✓ Tersimpan di Sesi Tenang!" : "Simpan ke Catatan Tenang"}
              </button>
              <button
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setAiResult(null);
                  setInputThought("");
                }}
                type="button"
              >
                Coba Pikiran Lain
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Inspirasi Cepat */}
      <div className="pixel-shadow border-2 border-border bg-card p-6 sm:p-10 space-y-6">
        <div className="border-b border-border/40 pb-4">
          <h3 className="font-pixelify text-xl font-bold">
            Kartu Inspirasi Cepat (Pikiran vs Fakta Umum)
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Klik kartu di bawah untuk membalikkan rasa cemas yang paling sering
            dialami pejuang UTBK.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {presetCards.map((card, idx) => {
            const isFlipped = flippedIndex === idx;

            return (
              <article
                className={`pixel-shadow cursor-pointer border-2 border-border p-5 transition-all ${
                  isFlipped ? "bg-moodi-sky/30" : "bg-background hover:bg-muted"
                }`}
                key={idx}
                onClick={() => setFlippedIndex(isFlipped ? null : idx)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {isFlipped ? "✨ Fakta Nyata" : "💭 Pikiran Otomatis"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isFlipped ? "Klik untuk tutup" : "Klik untuk balik →"}
                  </span>
                </div>

                <div className="py-3 min-h-24">
                  {!isFlipped ? (
                    <p className="font-semibold text-foreground leading-relaxed text-sm sm:text-base">
                      &ldquo;{card.thought}&rdquo;
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground leading-relaxed text-sm sm:text-base">
                        {card.fact}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground border-t border-border/30 pt-2">
                        💡 {card.tip}
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
    <div className="pixel-shadow border-2 border-border bg-card p-6 sm:p-10 space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-pixelify text-2xl font-bold">
          Jurnal Singkat Pribadi
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Tuliskan apa pun yang mengganjal di pikiranmu tanpa perlu khawatir dinilai
          atau dihakimi.
        </p>
      </div>

      {saved && (
        <div className="border-2 border-border bg-moodi-sky/30 p-3 text-xs font-semibold text-ink">
          ✓ Catatan refleksimu telah tersimpan dengan aman.
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSave}>
        <textarea
          className="w-full border-2 border-border bg-background p-4 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="Tuliskan unek-unek, ketakutan, atau apa yang ingin kamu lepaskan hari ini..."
          rows={5}
          value={note}
        />

        <div className="flex justify-end">
          <button
            className="pixel-press pixel-shadow border-2 border-border bg-moodi-butter px-6 py-2.5 font-bold text-ink shadow-[2px_2px_0_var(--border)] hover:bg-moodi-butter/90 disabled:opacity-50"
            disabled={isPending || !note.trim()}
            type="submit"
          >
            {isPending ? "Menyimpan..." : "Simpan Catatan Tenang"}
          </button>
        </div>
      </form>
    </div>
  );
}
