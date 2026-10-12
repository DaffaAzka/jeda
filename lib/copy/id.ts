export const siteCopy = {
  metadata: {
    title: "MOODI | Persiapan UTBK yang lebih mindful",
    description:
      "MOODI sedang menyiapkan ruang belajar UTBK yang memperhatikan ritme dan kesejahteraanmu.",
  },
  brand: "MOODI",
  navigation: {
    about: "Tentang",
    features: "Fitur",
    help: "Bantuan",
    signIn: "Masuk",
    signUp: "Buat akun",
    themeLabel: "Ganti tema",
    themeNames: {
      light: "Terang",
      night: "Malam",
      dark: "Gelap",
    },
  },
  landing: {
    eyebrow: "Teman persiapan UTBK",
    headlineFirst: "Belajar UTBK,",
    headlineSecond: "tanpa lupa bernapas.",
    intro:
      "MOODI dirancang untuk membantu kamu belajar dengan ritme yang lebih manusiawi, sambil tetap memberi ruang untuk beristirahat.",
    status: "MOODI sedang disiapkan. Fitur belajar belum tersedia.",
    primaryAction: "Buat akun",
    secondaryAction: "Lihat rencana MOODI",
    illustrationLabel: "",
    bandLabel: "Yang sedang disiapkan",
    concepts: [
      "Check-in",
      "Rencana adaptif",
      "Tryout",
      "Error autopsy",
      "Ruang tenang",
    ],
    aboutLabel: "Tentang MOODI",
    aboutTitle: "Persiapan yang memberi ruang untuk jeda.",
    aboutDescription:
      "MOODI menggabungkan persiapan UTBK dengan perhatian pada kondisi harian. Fitur-fitur ini masih dalam tahap pengembangan dan belum bisa digunakan.",
    stepsTitle: "Bagaimana MOODI dirancang?",
    stepsIntro:
      "Ini adalah alur yang sedang dirancang, bukan fitur yang sudah tersedia.",
    steps: [
      {
        title: "Check-in",
        description: "Ceritakan singkat bagaimana harimu.",
      },
      {
        title: "Kenali ritme",
        description: "Pahami kondisi belajar hari ini.",
      },
      {
        title: "Susun rencana",
        description: "Pilih langkah kecil yang terasa pas.",
      },
      {
        title: "Latihan bertahap",
        description: "Belajar dan berlatih tanpa perlu terburu-buru.",
      },
      {
        title: "Lihat pola",
        description: "Kenali kembali proses dan kesalahanmu.",
      },
    ],
    featuresLabel: "Arah pengembangan",
    featuresTitle: "Dibangun untuk proses yang lebih ramah.",
    features: [
      {
        title: "Check-in harian",
        description:
          "Check-in singkat tentang tidur, energi, suasana hati, dan tekanan yang kamu rasakan.",
        icon: "sun",
      },
      {
        title: "Error autopsy",
        description:
          "Rencana untuk membantu mengenali apakah kesalahan muncul karena materi, waktu, atau hal lain.",
        icon: "grid",
      },
      {
        title: "Ruang tenang",
        description:
          "Ruang untuk berhenti sejenak dan mencoba latihan napas singkat saat dibutuhkan.",
        icon: "breath",
      },
    ],
    closingTitle: "Mulai dari satu langkah kecil.",
    closingDescription:
      "Buat akun untuk melihat dashboard awal MOODI. Fitur belajar akan hadir setelah siap.",
    footerTagline: "Belajar dengan jeda, bertumbuh dengan ritme sendiri.",
    sdg:
      "MOODI mendukung perhatian pada kesejahteraan dan akses pendidikan.",
    disclaimer:
      "MOODI mendukung kesejahteraanmu, bukan pengganti psikolog atau konselor.",
    privacy: "Privasi",
  },
  auth: {
    loginTitle: "Selamat datang kembali.",
    registerTitle: "Buat akun MOODI.",
    loginDescription:
      "Masuk untuk membuka dashboard awal MOODI. Fitur belajar masih disiapkan.",
    registerDescription:
      "Daftar untuk membuka dashboard awal MOODI. Fitur belajar masih disiapkan.",
    name: "Nama",
    email: "Email",
    password: "Kata sandi",
    confirmPassword: "Ulangi kata sandi",
    loginButton: "Masuk",
    registerButton: "Buat akun",
    submitting: "Memproses...",
    noAccount: "Belum punya akun?",
    haveAccount: "Sudah punya akun?",
    registerLink: "Daftar",
    loginLink: "Masuk",
    passwordMismatch: "Kata sandi belum sama. Periksa kembali isianmu.",
    genericError:
      "Permintaan belum berhasil. Periksa koneksi dan data yang kamu isi, lalu coba lagi.",
    loginError: "Kamu belum bisa masuk. Periksa email dan kata sandimu.",
    registerError:
      "Akun belum berhasil dibuat. Pastikan email belum terdaftar dan coba lagi.",
    backHome: "Kembali ke halaman utama",
    formLabel: "Formulir akun",
  },
  dashboard: {
    title: "Beranda",
    greeting: "Hai,",
    signOut: "Keluar",
    navigationLabel: "Navigasi dashboard",
    navigation: [
      { label: "Beranda", icon: "home", available: true },
      { label: "Belajar", icon: "book", available: false },
      { label: "Tryout", icon: "timer", available: false },
      { label: "Insight", icon: "chart", available: false },
      { label: "Tenang", icon: "calm", available: false },
    ],
    comingSoon: "Segera hadir",
    emptyTitle: "Belum ada aktivitas di sini.",
    emptyDescription:
      "Dashboard MOODI masih kosong karena fitur belajar belum tersedia. Kami akan menampilkan aktivitasmu di sini saat fitur sudah siap.",
    homeLink: "Kembali ke halaman utama",
    dashboardLabel: "Dashboard",
    signOutError: "Kamu belum berhasil keluar. Silakan coba lagi.",
  },
} as const;

export const themeOptions = ["light", "night", "dark"] as const;
export type ThemeOption = (typeof themeOptions)[number];
