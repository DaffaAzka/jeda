import type { DayMode, TaskType } from "@/app/generated/prisma/enums";
import { RULES } from "@/config/rules";

export interface TopicCandidate {
  id: string;
  name: string;
  subtestName?: string;
  attempts?: number;
  accuracy?: number;
}

export interface LessonCandidate {
  id: string;
  title: string;
  topicId: string;
  topicName?: string;
  estMinutes: number;
}

export interface GeneratedPlanTask {
  type: TaskType;
  title: string;
  reason: string;
  estMinutes: number;
  sortOrder: number;
  topicId?: string;
  lessonId?: string;
}

export function generateDailyPlanTasks(
  mode: DayMode,
  candidateTopics: TopicCandidate[] = [],
  candidateLessons: LessonCandidate[] = [],
): GeneratedPlanTask[] {
  const topic1 = candidateTopics[0];
  const topic2 = candidateTopics[1] ?? candidateTopics[0];

  // Recovery prefers short lessons (<= RULES.learning.shortLessonMinutes)
  const recoveryLesson =
    candidateLessons.find(
      (l) => l.estMinutes <= RULES.learning.shortLessonMinutes,
    ) ?? candidateLessons[0];

  if (mode === "recovery") {
    const firstTask: GeneratedPlanTask = recoveryLesson
      ? {
          type: "lesson",
          title: `Pelajari Konsep: ${recoveryLesson.title}`,
          reason:
            "Tidurmu kurang atau energimu rendah, jadi cukup pelajari materi konsep ringkas tanpa tekanan waktu.",
          estMinutes: recoveryLesson.estMinutes,
          sortOrder: 0,
          topicId: recoveryLesson.topicId,
          lessonId: recoveryLesson.id,
        }
      : {
          type: "review",
          title: topic1
            ? `Ulas Ringkas Catatan: ${topic1.name}`
            : "Ulas Ringkas Catatan Konsep UTBK",
          reason:
            "Tidurmu kurang atau energimu rendah, jadi cukup ulas konsep tanpa tekanan waktu.",
          estMinutes: 15,
          sortOrder: 0,
          topicId: topic1?.id,
        };

    return [
      firstTask,
      {
        type: "calm",
        title: "Latihan Pernapasan Kotak (Box Breathing 4-4-4-4)",
        reason: "Meredakan ketegangan fisik dan menurunkan hormon stres tubuh.",
        estMinutes: 5,
        sortOrder: 1,
      },
      {
        type: "practice",
        title: topic2
          ? `Latihan Santai 5 Soal: ${topic2.name}`
          : "Latihan Santai 5 Soal UTBK",
        reason: "Latihan santai dengan pembahasan langsung di setiap nomor.",
        estMinutes: 15,
        sortOrder: 2,
        topicId: topic2?.id,
      },
    ];
  }

  if (mode === "challenge") {
    return [
      {
        type: "practice",
        title: topic1
          ? `Latihan Waktu 10 Soal: ${topic1.name}`
          : "Latihan Waktu 10 Soal Target",
        reason: "Energimu prima hari ini, waktu yang tepat menguji kecepatan pengerjaan.",
        estMinutes: 20,
        sortOrder: 0,
        topicId: topic1?.id,
      },
      {
        type: "tryout",
        title: "Simulasi Penuh Subtes UTBK",
        reason: "Uji ketahanan mental dan pacing waktu sesuai durasi riil UTBK.",
        estMinutes: 30,
        sortOrder: 1,
      },
      {
        type: "review",
        title: "Analisis Error Autopsy & Refleksi Kesalahan",
        reason: "Membedah penyebab kesalahan agar tidak terulang pada simulasi berikutnya.",
        estMinutes: 15,
        sortOrder: 2,
      },
    ];
  }

  // Default: balanced
  const balancedLesson = candidateLessons[0];
  const firstBalancedTask: GeneratedPlanTask = balancedLesson
    ? {
        type: "lesson",
        title: `Materi Kunci: ${balancedLesson.title}`,
        reason:
          "Memperkuat konsep di topik yang paling memerlukan perhatian sebelum mulai latihan.",
        estMinutes: balancedLesson.estMinutes,
        sortOrder: 0,
        topicId: balancedLesson.topicId,
        lessonId: balancedLesson.id,
      }
    : {
        type: "review",
        title: topic1
          ? `Ulas Materi Kunci: ${topic1.name}`
          : "Ulas Materi Kunci UTBK",
        reason: "Memperkuat konsep di topik yang paling memerlukan perhatian.",
        estMinutes: 15,
        sortOrder: 0,
        topicId: topic1?.id,
      };

  return [
    firstBalancedTask,
    {
      type: "practice",
      title: topic2
        ? `Latihan 10 Soal Terarah: ${topic2.name}`
        : "Latihan 10 Soal Terarah",
      reason: "Menjaga ritme dan konsistensi berpikir logis.",
      estMinutes: 20,
      sortOrder: 1,
      topicId: topic2?.id,
    },
    {
      type: "calm",
      title: "Jeda Tenang & Latihan Pernapasan",
      reason: "Hari istirahat atau jeda singkat tetap dihitung sebagai konsistensi belajar.",
      estMinutes: 5,
      sortOrder: 2,
    },
  ];
}
