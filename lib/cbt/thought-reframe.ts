export interface ReframedThoughtResult {
  thought: string;
  validation: string;
  distortion: string;
  fact: string;
  smallStep: string;
  source: "local";
}

const CBT_THEMES = [
  {
    keywords: ["orang tua", "ibu", "ayah", "mama", "papa", "keluarga", "ekspektasi"],
    result: {
      validation: "Rasa takut mengecewakan orang terdekat menunjukkan betapa kamu menghargai dan menyayangi mereka.",
      distortion: "Mind Reading (Menebak reaksi orang lain sebelum terjadi)",
      fact: "Orang yang menyayangimu lebih peduli pada kesehatan dan perjuanganmu daripada sekadar angka. Berproses dengan jujur dan menjaga kesehatan jauh lebih bermakna.",
      smallStep: "Katakan pada diri sendiri bahwa kamu sedang berusaha sebaik mungkin dengan kapasitas hari ini.",
    },
  },
  {
    keywords: ["bocoran", "jalan pintas", "kunci jawaban", "instan", "cepat lulus"],
    result: {
      validation: "Wajar sekali merasa ingin cara instan saat energimu sedang terkuras dan materi terasa menumpuk.",
      distortion: "Jalan Pintas Impulsif",
      fact: "Mencari kunci jawaban instan tidak melatih pemahaman konsepmu di hari H. Memahami 1 konsep kecil secara mandiri jauh lebih menenangkan dan membangun kepercayaan diri asli.",
      smallStep: "Tutup target besar untuk hari ini. Cukup pelajari pembahasan 1 materi atau 1 soal saja dengan rileks.",
    },
  },
  {
    keywords: ["waktu", "terlambat", "sempat", "buru-buru", "kejar", "sisa hari"],
    result: {
      validation: "Melihat sisa hari jelang ujian memang sering membuat dada sesak dan merasa waktu tidak cukup.",
      distortion: "Katastrofisasi Waktu (Semua atau Tidak Sama Sekali)",
      fact: "Kamu tidak perlu menguasai seluruh materi dalam satu malam. Fokus pada 2-3 materi yang paling sering keluar dan bisa kamu pahami sekarang akan langsung berdampak nyata pada skormu.",
      smallStep: "Tuliskan 1 topik spesifik yang ingin kamu ulas hari ini, lalu abaikan topik lainnya terlebih dahulu.",
    },
  },
  {
    keywords: ["gagal", "bodoh", "tidak bisa", "sia-sia", "menyerah", "putus asa"],
    result: {
      validation: "Rasa lelah dan perasaan bahwa usahamu sia-sia adalah sinyal bahwa otakmu butuh jeda dan pemulihan, bukan tanda kamu tidak mampu.",
      distortion: "Labeling Diri & Generalisasi Berlebihan",
      fact: "Hasil tryout yang belum sesuai target adalah data belajar yang objektif, bukan ukuran kepintaran atau masa depanmu. Dari jawaban yang salah, kamu tahu persis bagian mana yang perlu diperkuat.",
      smallStep: "Ambil jeda napas 4-4-4-4 selama 2 menit, lalu beri waktu tubuhmu beristirahat tanpa layar gawai.",
    },
  },
];

const DEFAULT_CBT_RESULT = {
  validation: "Wajar sekali merasa cemas atau terbebani. Mempersiapkan UTBK adalah perjalanan maraton yang menuntut ketahanan mental.",
  distortion: "Beban Ekspektasi & Overthinking",
  fact: "Kecemasan adalah reaksi alami saat kita menghadapi hal yang kita anggap penting. Yang menentukan keberhasilan adalah langkah kecil konsisten setiap hari, bukan kekhawatiran yang kamu bayangkan saat ini.",
  smallStep: "Tarik napas dalam-dalam, minum segelas air putih, dan tentukan satu tugas kecil berdurasi 10 menit untuk diselesaikan hari ini.",
};

export function reframeThoughtLocally(studentThought: string): ReframedThoughtResult {
  const clean = studentThought.trim().toLowerCase();

  for (const theme of CBT_THEMES) {
    if (theme.keywords.some((kw) => clean.includes(kw))) {
      return {
        thought: studentThought.trim(),
        ...theme.result,
        source: "local",
      };
    }
  }

  return {
    thought: studentThought.trim(),
    ...DEFAULT_CBT_RESULT,
    source: "local",
  };
}
