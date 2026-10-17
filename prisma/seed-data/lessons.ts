import type { LessonBlock } from "@/features/ai/schema";

export interface SeedLesson {
  subtestCode: string;
  topicName: string;
  title: string;
  summary: string;
  estMinutes: number;
  status: "published" | "draft";
  source: "manual" | "ai_assisted";
  blocks: LessonBlock[];
  checkQuestionIndices?: number[]; // Which questions under this topic to link
}

export const SEED_LESSONS: SeedLesson[] = [
  {
    subtestCode: "KPU",
    topicName: "Penalaran Deduktif",
    title: "Logika Kuantor dan Aturan Penarikan Kesimpulan",
    summary:
      "Membedakan kuantor universal dan eksistensial serta menerapkan Modus Ponens dan Tollens secara tepat.",
    estMinutes: 8, // Short lesson suitable for recovery mode
    status: "published",
    source: "manual",
    blocks: [
      {
        type: "heading",
        level: 2,
        text: "Tujuan Pembelajaran",
      },
      {
        type: "paragraph",
        text: "Setelah membaca materi ini, kamu dapat menarik kesimpulan yang valid tanpa terjebak oleh asumsi pribadi atau pernyataan yang tidak terdistribusi penuh.",
      },
      {
        type: "heading",
        level: 2,
        text: "Membedakan 'Semua' vs 'Sebagian'",
      },
      {
        type: "paragraph",
        text: "Dalam UTBK, kata 'sebagian', 'beberapa', dan 'ada' memiliki arti yang sama: minimal ada satu anggota kelompok yang memenuhi sifat tersebut.",
      },
      {
        type: "bullet_list",
        items: [
          "Kuantor Universal (Semua / Setiap): Berlaku mutlak untuk seluruh anggota himpunan tanpa pengecualian.",
          "Kuantor Eksistensial (Sebagian / Ada): Minimal ada satu anggota yang memenuhi. Tidak berarti sebagian lainnya tidak memenuhi.",
        ],
      },
      {
        type: "worked_example",
        problem:
          "Premis 1: Semua atlet pelari jarak jauh memiliki stamina prima.\nPremis 2: Sebagian siswa SMA Garuda memiliki stamina prima.",
        solution:
          "Kesimpulan yang sah adalah 'Sebagian siswa SMA Garuda belum tentu atlet pelari jarak jauh'. Term tengah ('memiliki stamina prima') tidak terdistribusi pada kedua premis.",
      },
      {
        type: "common_mistake",
        mistake:
          "Menyimpulkan 'Sebagian siswa SMA Garuda bukan atlet' secara mutlak padahal informasi tersebut belum tentu salah maupun benar.",
        correction:
          "Hanya simpulkan apa yang secara logis dijamin oleh premis. Jika informasi tidak cukup, kesimpulannya adalah belum tentu.",
      },
    ],
    checkQuestionIndices: [0, 1],
  },
  {
    subtestCode: "PK",
    topicName: "Aljabar & Persamaan",
    title: "Teknik Cepat Eliminasi & Substitusi Aljabar",
    summary:
      "Trik menyelesaikan persamaan linier dua variabel dan bentuk aljabar simetris tanpa langkah berbelit.",
    estMinutes: 10,
    status: "published",
    source: "manual",
    blocks: [
      {
        type: "heading",
        level: 2,
        text: "Bentuk Aljabar Simetris",
      },
      {
        type: "paragraph",
        text: "Banyak soal Pengetahuan Kuantitatif UTBK menguji manipulasi bentuk simetris tanpa perlu mencari nilai x dan y satu per satu.",
      },
      {
        type: "display_equation",
        equation: "(x + y)^2 = x^2 + 2xy + y^2",
      },
      {
        type: "paragraph",
        text: "Jika diketahui nilai $x + y$ dan nilai $xy$, kita dapat langsung mencari $x^2 + y^2$ dengan mengurangkan $2xy$ dari $(x+y)^2$.",
      },
      {
        type: "worked_example",
        problem:
          "Jika $x + y = 7$ dan $xy = 10$, berapakah nilai dari $x^2 + y^2$?",
        solution:
          "$x^2 + y^2 = (x + y)^2 - 2xy = (7)^2 - 2(10) = 49 - 20 = 29$. Kita tidak perlu mencari $x$ dan $y$ secara terpisah.",
      },
      {
        type: "hint",
        title: "Perhatikan Nilai Selisih Kuadrat",
        content:
          "Ingat identitas $x^2 - y^2 = (x - y)(x + y)$. Bentuk ini sangat sering dipakai untuk menyederhanakan pecahan aljabar rumit.",
      },
    ],
    checkQuestionIndices: [0],
  },
  {
    subtestCode: "KMBM",
    topicName: "Kalimat Efektif",
    title: "Ciri Utama Kalimat Efektif & Keparalelan Bentuk",
    summary:
      "Mengidentifikasi subjek ganda, ketidaksejajaran imbuhan, dan pemborosan kata dalam kalimat bahasa Indonesia.",
    estMinutes: 10,
    status: "published",
    source: "manual",
    blocks: [
      {
        type: "heading",
        level: 2,
        text: "Syarat Wajib Kalimat Efektif",
      },
      {
        type: "paragraph",
        text: "Sebuah kalimat efektif wajib memiliki struktur minimal berupa Subjek (S) dan Predikat (P) yang jelas serta mematuhi kaidah EYD V.",
      },
      {
        type: "numbered_list",
        items: [
          "Kelengkapan Struktur: Memiliki subjek dan predikat yang tegas. Tidak boleh diawali preposisi (bagi, untuk, dalam) di depan subjek utama.",
          "Keparalelan Bentuk: Jika klausa pertama menggunakan verba me-, maka klausa rincian berikutnya juga harus menggunakan me-.",
          "Kehematan Kata: Menghindari pemakaian kata bersinonim secara berulang (misal: 'agar supaya' atau 'sangat amat').",
        ],
      },
      {
        type: "common_mistake",
        mistake:
          "Menulis 'Bagi seluruh peserta ujian diharapkan hadir tepat waktu.'",
        correction:
          "Kata 'Bagi' membuat kalimat kehilangan subjek. Hapus kata depan tersebut: 'Seluruh peserta ujian diharapkan hadir tepat waktu.'",
      },
    ],
    checkQuestionIndices: [0],
  },
  {
    subtestCode: "PM",
    topicName: "Fungsi Kuadrat",
    title: "Karakteristik Parabola, Diskriminan, dan Titik Puncak",
    summary:
      "Memahami makna koefisien a, diskriminan D, dan koordinat titik balik parabola dalam soal cerita kontekstual.",
    estMinutes: 12,
    status: "published",
    source: "manual",
    blocks: [
      {
        type: "heading",
        level: 2,
        text: "Formula Titik Puncak Parabola",
      },
      {
        type: "paragraph",
        text: "Untuk fungsi kuadrat $f(x) = ax^2 + bx + c$, nilai optimum (maksimum atau minimum) dicapai pada absis titik puncak:",
      },
      {
        type: "display_equation",
        equation: "x_p = -\\frac{b}{2a}, \\quad y_p = -\\frac{D}{4a} = -\\frac{b^2 - 4ac}{4a}",
      },
      {
        type: "paragraph",
        text: "Jika $a > 0$, parabola terbuka ke atas sehingga memiliki nilai minimum. Jika $a < 0$, parabola terbuka ke bawah sehingga memiliki nilai maksimum (contoh: tinggi lintasan peluru).",
      },
      {
        type: "worked_example",
        problem:
          "Sebuah peluru ditembakkan ke atas dengan persamaan tinggi $h(t) = 40t - 5t^2$ meter. Berapa tinggi maksimum peluru?",
        solution:
          "Nilai $a = -5, b = 40, c = 0$. Waktu mencapai puncak: $t = -\\frac{40}{2(-5)} = 4$ detik. Tinggi maksimum: $h(4) = 40(4) - 5(4)^2 = 160 - 80 = 80$ meter.",
      },
    ],
    checkQuestionIndices: [0],
  },
];
