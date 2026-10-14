export interface SeedSupportResource {
  name: string;
  type: "hotline" | "counselor" | "website";
  contact: string | null;
  url: string | null;
  isActive: boolean;
  lastVerifiedAt: Date;
}

export const SEED_SUPPORT_RESOURCES: SeedSupportResource[] = [
  {
    name: "Layanan Sejiwa (Kemenkes RI)",
    type: "hotline",
    contact: "119 (ekstensi 8)",
    url: "https://sejiwa.kemkes.go.id",
    isActive: true,
    lastVerifiedAt: new Date("2026-10-01"),
  },
  {
    name: "Halo Kemenkes",
    type: "hotline",
    contact: "1500-567",
    url: "https://kemkes.go.id",
    isActive: true,
    lastVerifiedAt: new Date("2026-10-01"),
  },
  {
    name: "Yayasan Pulih (Konseling & Pemulihan Psikologis)",
    type: "hotline",
    contact: "+62 811-8436-633",
    url: "https://yayasanpulih.org",
    isActive: true,
    lastVerifiedAt: new Date("2026-10-01"),
  },
  {
    name: "Into The Light Indonesia (Pusat Edukasi Kesehatan Jiwa)",
    type: "website",
    contact: null,
    url: "https://www.intothelightid.org",
    isActive: true,
    lastVerifiedAt: new Date("2026-10-01"),
  },
  {
    name: "Pijar Psikologi",
    type: "website",
    contact: null,
    url: "https://pijarpsikologi.org",
    isActive: true,
    lastVerifiedAt: new Date("2026-10-01"),
  },
  {
    name: "Layanan Bimbingan & Konseling (Guru BK Sekolah)",
    type: "counselor",
    contact: "Ruang Guru BK / Konselor Sekolah",
    url: null,
    isActive: true,
    lastVerifiedAt: new Date("2026-10-01"),
  },
];
