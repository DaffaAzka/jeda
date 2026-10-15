"use client";

import { useState } from "react";
import Link from "next/link";
import { recordSupportEventAction } from "../actions";
import type { SupportResourceItem } from "../queries";
import {
  CheckIcon,
  CopyIcon,
  PhoneIcon,
  PinIcon,
  WindIcon,
} from "@/components/icons";

interface SupportDirectoryProps {
  resources: SupportResourceItem[];
}

const MESSAGE_TEMPLATES = [
  {
    target: "Teman Dekat",
    desc: "Untuk teman yang kamu percaya saat butuh didengarkan.",
    text: "Hai, akhir-akhir ini aku merasa kewalahan mikirin UTBK dan rasanya berat kalau dipendam sendiri. Kamu lagi senggang? Boleh ngobrol bentar atau temani aku teleponan?",
  },
  {
    target: "Orang Tua / Wali",
    desc: "Untuk membuka pembicaraan tanpa rasa takut dituntut.",
    text: "Halo, belakangan ini aku merasa cemas dan capek dengan persiapan ujian. Aku tetap berusaha, tapi boleh kita ngobrol santai nanti malam tanpa bahas target nilai dulu?",
  },
  {
    target: "Guru BK / Konselor Sekolah",
    desc: "Untuk membuat janji konseling privat di sekolah.",
    text: "Selamat pagi/siang Bapak/Ibu Guru BK. Saya ingin meminta waktu untuk berkonsultasi terkait kecemasan belajar menghadapi UTBK. Kapan waktu yang tepat bagi saya untuk menemui Bapak/Ibu di ruang BK? Terima kasih banyak.",
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
    <div className="space-y-6">
      {/* Hero */}
      <div className="pixel-shadow space-y-4 border-2 border-border bg-card p-5 sm:p-7">
        <h1 className="font-pixelify text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Ruang Bantuan & Dukungan
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Lelah atau cemas itu wajar saat berjuang untuk UTBK. Kamu tidak harus memikulnya sendirian. Di sini ada kontak resmi dan terlatih yang siap mendengar tanpa menghakimi.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            className="pixel-press inline-flex items-center gap-2 border-2 border-border bg-moodi-sky px-4 py-2 text-xs font-bold text-ink shadow-[2px_2px_0_var(--border)]"
            href="/dashboard/calm"
          >
            <WindIcon className="size-3.5" />
            <span>Latihan napas di Ruang Tenang</span>
          </Link>
          <a
            className="pixel-press inline-flex items-center gap-2 border-2 border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-[2px_2px_0_var(--border)] hover:bg-muted"
            href="#hotline"
          >
            <PhoneIcon className="size-3.5" />
            <span>Kontak layanan darurat</span>
          </a>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="border-2 border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Pemberitahuan:</strong> MOODI
        adalah platform pendamping belajar mandiri, bukan penyedia layanan
        medis darurat atau konseling psikologis berlisensi. Semua kontak di bawah
        ini adalah layanan resmi terverifikasi yang siap membantumu secara gratis atau sesuai ketentuan institusi.
      </div>

      {/* Hotlines */}
      <section className="space-y-4" id="hotline">
        <div>
          <h2 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
            Layanan Tanggap Bebas Pulsa & WhatsApp
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Tersedia untuk didengar kapan saja saat emosimu terasa meluap atau butuh teman bicara.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotlines.map((res) => (
            <div
              className="pixel-shadow flex flex-col justify-between border-2 border-border bg-card p-5"
              key={res.id}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                  <span className="border border-border bg-moodi-sky/30 px-2 py-0.5 text-[10px] font-bold text-foreground">
                    Hotline Resmi
                  </span>
                  {res.lastVerifiedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Terverifikasi
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-bold text-foreground">
                  {res.name}
                </h3>
                {res.contact && (
                  <p className="mt-1 font-mono text-xs font-semibold text-foreground">
                    {res.contact}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                {res.contact && (
                  <a
                    className="pixel-press flex-1 border-2 border-border bg-foreground px-3 py-2 text-center text-xs font-bold text-background shadow-[1px_1px_0_var(--border)]"
                    href={
                      res.contact.includes("+")
                        ? `https://wa.me/${res.contact.replace(/[^0-9]/g, "")}`
                        : `tel:${res.contact.split(" ")[0]}`
                    }
                    onClick={() => handleResourceClick(res)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Hubungi
                  </a>
                )}
                {res.url && (
                  <a
                    className="border-2 border-border bg-card px-3 py-2 text-center text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
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
          <h2 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
            Konselor Sekolah & Guru BK
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Guru BK memiliki peran utama mendampingi siswa yang merasa tertekan dengan pilihan jurusan dan ujian masuk kuliah.
          </p>
        </div>

        <div className="pixel-shadow space-y-3 border-2 border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground sm:text-base">
            Konseling Tatap Muka di Sekolah
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Kamu bisa menemui guru BK saat jam istirahat atau sepulang sekolah untuk membicarakan kecemasan seputar pilihan jurusan dan tekanan ujian.
          </p>
          <div className="space-y-2 pt-1">
            {counselors.map((c) => (
              <div
                className="flex items-center gap-2 border border-border bg-background p-3 text-xs font-medium text-foreground"
                key={c.id}
              >
                <PinIcon className="size-3.5 shrink-0 text-foreground" />
                <span>
                  <strong>{c.name}:</strong> {c.contact ?? "Hubungi ruang BK sekolahmu"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Message Templates */}
      <section className="space-y-4">
        <div>
          <h2 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
            Bingung Memulai Pembicaraan?
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Gunakan kalimat pembuka berikut jika merasa canggung untuk bercerita:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {MESSAGE_TEMPLATES.map((tpl, i) => (
            <div
              className="pixel-shadow flex flex-col justify-between border-2 border-border bg-card p-4"
              key={tpl.target}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                  <span className="text-xs font-bold text-foreground">
                    {tpl.target}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Template
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">{tpl.desc}</p>
                <div className="border border-border bg-background p-3 text-xs italic leading-relaxed text-foreground">
                  &ldquo;{tpl.text}&rdquo;
                </div>
              </div>

              <button
                className="pixel-press mt-3 inline-flex w-full items-center justify-center gap-1.5 border-2 border-border bg-card py-2 text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
                onClick={() => handleCopy(tpl.text, i)}
                type="button"
              >
                {copiedIndex === i ? (
                  <>
                    <CheckIcon className="size-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-3.5" />
                    <span>Salin pesan</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Websites & Peer Education */}
      <section className="space-y-4">
        <div>
          <h2 className="font-pixelify text-xl font-bold text-foreground sm:text-2xl">
            Bacaan & Edukasi Kesehatan Jiwa
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Materi edukasi dan pemahaman diri dari sumber terpercaya.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {websites.map((res) => (
            <div
              className="pixel-shadow flex items-center justify-between border-2 border-border bg-card p-4"
              key={res.id}
            >
              <div>
                <h3 className="text-sm font-bold text-foreground">{res.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Edukasi & Pendampingan
                </p>
              </div>
              {res.url && (
                <a
                  className="pixel-press border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-[1px_1px_0_var(--border)] hover:bg-muted"
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
