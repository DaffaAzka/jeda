"use client";

import { useState } from "react";
import Link from "next/link";
import { recordSupportEventAction } from "../actions";
import type { SupportResourceItem } from "../queries";

interface SupportDirectoryProps {
  resources: SupportResourceItem[];
}

const MESSAGE_TEMPLATES = [
  {
    target: "Teman Dekat",
    desc: "Untuk teman yang kamu percaya saat butuh didengarkan.",
    text: "Hai, akhir-akhir ini aku ngerasa kewalahan banget mikirin UTBK dan rasanya berat kalau dipendam sendiri. Kamu lagi senggang nggak? Boleh ngobrol bentar atau temenin aku teleponan?",
  },
  {
    target: "Orang Tua / Wali",
    desc: "Untuk membuka pembicaraan tanpa rasa takut dituntut.",
    text: "Halo Ayah/Ibu, belakangan ini aku ngerasa agak cemas dan capek banget sama ritme persiapan ujian. Aku tetap berusaha, tapi boleh kita ngobrol santai nanti malam tanpa bahas target nilai dulu?",
  },
  {
    target: "Guru BK / Konselor Sekolah",
    desc: "Untuk membuat janji konseling privat di sekolah.",
    text: "Selamat pagi/siang Bapak/Ibu Guru BK. Saya ingin meminta waktu untuk berkonsultasi terkait kecemasan dan stres belajar menghadapi UTBK. Kapan waktu yang tepat bagi saya untuk menemui Bapak/Ibu di ruang BK? Terima kasih banyak.",
  },
];

export function SupportDirectory({ resources }: SupportDirectoryProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleResourceClick = async (resource: SupportResourceItem) => {
    try {
      await recordSupportEventAction({
        resourceId: resource.id,
        ruleKey: "support_directory",
        action: "contacted",
      });
    } catch {
      // Non-blocking
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const hotlines = resources.filter((r) => r.type === "hotline");
  const counselors = resources.filter((r) => r.type === "counselor");
  const websites = resources.filter((r) => r.type === "website");

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[3px_3px_0_var(--border)] sm:p-8">
        <span className="inline-block rounded-full border border-border bg-moodi-sky/30 px-3 py-1 text-xs font-bold text-foreground">
          Ruang Aman & Bantuan
        </span>
        <h1 className="mt-3 font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Kamu Tidak Harus Memikulnya Sendirian
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Persiapan UTBK adalah maraton yang menguras pikiran dan tenaga. Merasa
          lelah, cemas, atau bingung adalah hal yang wajar. Mengambil jeda dan
          meminta bantuan adalah tanda keberanian, bukan kelemahan.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-moodi-sky px-4 py-2 text-xs font-bold text-ink shadow-[2px_2px_0_var(--border)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            href="/dashboard/calm"
          >
            <span>🌬️</span> Latihan Napas di Ruang Tenang
          </Link>
          <a
            className="inline-flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-[2px_2px_0_var(--border)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            href="#hotline"
          >
            <span>📞</span> Kontak Layanan Darurat
          </a>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Pemberitahuan:</strong> MOODI
        adalah platform pendamping belajar mandiri, bukan penyedia layanan
        medis darurat atau konseling psikologis berlisensi. Semua kontak di bawah
        ini adalah layanan pihak ketiga resmi dan terverifikasi yang siap
        membantumu secara gratis atau sesuai kebijakan masing-masing institusi.
      </div>

      {/* Hotlines */}
      <section className="space-y-4" id="hotline">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Layanan Tanggap & Konseling Bebas Pulsa / WhatsApp
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Tersedia untuk didengar kapan saja saat emosimu terasa meluap atau
            butuh tempat bercerita.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotlines.map((res) => (
            <div
              className="flex flex-col justify-between rounded-xl border-2 border-border bg-card p-5 shadow-[2px_2px_0_var(--border)]"
              key={res.id}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-border bg-moodi-sky/20 px-2 py-0.5 text-[10px] font-bold text-foreground">
                    Hotline / Konseling
                  </span>
                  {res.lastVerifiedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Terverifikasi
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold text-foreground">
                  {res.name}
                </h3>
                {res.contact && (
                  <p className="mt-1 font-mono text-xs font-semibold text-moodi-pink">
                    {res.contact}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2 pt-2 border-t border-border">
                {res.contact && (
                  <a
                    className="flex-1 rounded-lg border-2 border-border bg-foreground px-3 py-2 text-center text-xs font-bold text-background shadow-[1px_1px_0_var(--border)] transition-transform hover:-translate-y-0.5"
                    href={
                      res.contact.includes("+")
                        ? `https://wa.me/${res.contact.replace(/[^0-9]/g, "")}`
                        : `tel:${res.contact.split(" ")[0]}`
                    }
                    onClick={() => handleResourceClick(res)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Hubungi Sekarang
                  </a>
                )}
                {res.url && (
                  <a
                    className="rounded-lg border-2 border-border bg-card px-3 py-2 text-center text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
                    href={res.url}
                    onClick={() => handleResourceClick(res)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Web
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Counselors & School BK */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Konselor Sekolah & Guru BK
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Guru Bimbingan Konseling memiliki peran utama mendampingi siswa yang
            merasa tertekan dengan pilihan jurusan dan ujian masuk kuliah.
          </p>
        </div>

        <div className="rounded-xl border-2 border-border bg-moodi-sand/20 p-5 shadow-[2px_2px_0_var(--border)]">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-foreground">
              Konseling Tatap Muka di Sekolah
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Kamu bisa menemui guru BK saat jam istirahat atau sepulang
              sekolah. Mereka terbiasa membantu siswa yang bingung menentukan
              pilihan prodi atau merasa cemas berlebih menjelang UTBK.
            </p>
            {counselors.map((c) => (
              <div
                className="rounded-lg border border-border bg-card p-3 text-xs font-medium text-foreground"
                key={c.id}
              >
                📍 <strong>{c.name}:</strong> {c.contact ?? "Hubungi ruang BK sekolahmu"}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Message Templates */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Bingung Harus Mulai Bicara dari Mana?
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Seringkali yang paling sulit adalah menyusun kata-kata pertama.
            Gunakan template pesan berikut untuk membuka obrolan dengan orang
            terdekat:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {MESSAGE_TEMPLATES.map((tpl, i) => (
            <div
              className="flex flex-col justify-between rounded-xl border-2 border-border bg-card p-4 shadow-[2px_2px_0_var(--border)]"
              key={tpl.target}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {tpl.target}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Siap kirim
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{tpl.desc}</p>
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs italic leading-relaxed text-foreground">
                  &ldquo;{tpl.text}&rdquo;
                </div>
              </div>

              <button
                className="mt-3 w-full rounded-lg border-2 border-border bg-card py-2 text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => handleCopy(tpl.text, i)}
                type="button"
              >
                {copiedIndex === i ? "✓ Pesan Tersalin!" : "Salin Pesan"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Websites & Peer Education */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-foreground sm:text-xl">
            Bacaan & Edukasi Kesehatan Jiwa
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Artikel ilmiah, panduan mengelola stres, dan pemahaman diri dari
            komunitas sebaya.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {websites.map((res) => (
            <div
              className="flex items-center justify-between rounded-xl border-2 border-border bg-card p-4 shadow-[2px_2px_0_var(--border)]"
              key={res.id}
            >
              <div>
                <h3 className="text-sm font-bold text-foreground">{res.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Edukasi & Konseling Remaja
                </p>
              </div>
              {res.url && (
                <a
                  className="rounded-lg border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
                  href={res.url}
                  onClick={() => handleResourceClick(res)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Buka Web
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
