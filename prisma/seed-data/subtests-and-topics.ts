export interface SeedTopic {
  name: string;
}

export interface SeedSubtest {
  code: string;
  name: string;
  defaultSeconds: number;
  topics: SeedTopic[];
}

export const SEED_SUBTESTS: SeedSubtest[] = [
  {
    code: "KPU",
    name: "Penalaran Umum",
    defaultSeconds: 1800,
    topics: [
      { name: "Penalaran Deduktif" },
      { name: "Penalaran Induktif" },
      { name: "Penalaran Kuantitatif" },
    ],
  },
  {
    code: "PPU",
    name: "Pengetahuan & Pemahaman Umum",
    defaultSeconds: 900,
    topics: [
      { name: "Makna Kata & Istilah" },
      { name: "Hubungan Antar-paragraf" },
      { name: "Kesesuaian Wacana" },
    ],
  },
  {
    code: "KMBM",
    name: "Pemahaman Bacaan & Menulis",
    defaultSeconds: 1500,
    topics: [
      { name: "Ejaan & Tanda Baca (EYD V)" },
      { name: "Kalimat Efektif" },
      { name: "Kepaduan Paragraf" },
    ],
  },
  {
    code: "PK",
    name: "Pengetahuan Kuantitatif",
    defaultSeconds: 1200,
    topics: [
      { name: "Aljabar & Persamaan" },
      { name: "Geometri & Bangun Datar" },
      { name: "Statistika & Peluang" },
    ],
  },
  {
    code: "LBI",
    name: "Literasi dalam Bahasa Indonesia",
    defaultSeconds: 2700,
    topics: [
      { name: "Teks Informasi & Analisis" },
      { name: "Teks Sastra & Refleksi" },
    ],
  },
  {
    code: "LBE",
    name: "Literasi dalam Bahasa Inggris",
    defaultSeconds: 1800,
    topics: [
      { name: "Reading Comprehension" },
      { name: "Inference & Context" },
    ],
  },
  {
    code: "PM",
    name: "Penalaran Matematika",
    defaultSeconds: 1800,
    topics: [
      { name: "Fungsi Kuadrat" },
      { name: "Model Matematika & Optimasi" },
      { name: "Aritmetika Sosial & Logika" },
    ],
  },
];
