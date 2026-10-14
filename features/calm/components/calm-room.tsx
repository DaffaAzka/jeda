"use client";

import { useState, useEffect, useTransition } from "react";
import { saveCalmSessionAction } from "../actions";

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

// 3. Pikiran vs Fakta (Reframing) Component
function ReframingCards() {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const cards = [
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

  return (
    <div className="pixel-shadow border-2 border-border bg-card p-6 sm:p-10 space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h2 className="font-pixelify text-2xl font-bold">
          Kartu Pikiran versus Fakta
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Klik kartu untuk membalikkan rasa cemas menjadi fakta objektif yang
          menenangkan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, idx) => {
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
