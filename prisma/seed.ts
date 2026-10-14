import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  TryoutMode,
  ErrorCause,
  TagSource,
  DayMode,
  TaskType,
  TaskStatus,
  CalmTool,
  CalmTrigger,
} from "../app/generated/prisma/client";
import { SEED_SUPPORT_RESOURCES } from "./seed-data/support-resources";
import { SEED_SUBTESTS } from "./seed-data/subtests-and-topics";
import { SEED_QUESTIONS } from "./seed-data/questions";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting MOODI database seed...");

  // ==========================================
  // 1. Seed Subtests & Topics
  // ==========================================
  console.log("📚 Seeding UTBK Subtests & Topics...");
  const subtestMap = new Map<string, string>(); // code -> id
  const topicMap = new Map<string, string>(); // "subtestCode:topicName" -> id

  for (const s of SEED_SUBTESTS) {
    const subtest = await prisma.subtest.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        defaultSeconds: s.defaultSeconds,
      },
      create: {
        code: s.code,
        name: s.name,
        defaultSeconds: s.defaultSeconds,
      },
    });
    subtestMap.set(s.code, subtest.id);

    for (const t of s.topics) {
      const topic = await prisma.topic.upsert({
        where: {
          subtestId_name: {
            subtestId: subtest.id,
            name: t.name,
          },
        },
        update: {},
        create: {
          subtestId: subtest.id,
          name: t.name,
        },
      });
      topicMap.set(`${s.code}:${t.name}`, topic.id);
    }
  }
  console.log(
    `✓ Seeded ${subtestMap.size} subtests and ${topicMap.size} topics.`,
  );

  // ==========================================
  // 2. Seed Original Questions
  // ==========================================
  console.log("📝 Seeding original UTBK questions & options...");
  let createdQuestionsCount = 0;
  const seededQuestionsList: Array<{
    id: string;
    subtestCode: string;
    topicId: string;
    stem: string;
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
  }> = [];

  for (const q of SEED_QUESTIONS) {
    const topicId = topicMap.get(`${q.subtestCode}:${q.topicName}`);
    if (!topicId) {
      console.warn(
        `Topic not found for ${q.subtestCode}:${q.topicName}, skipping.`,
      );
      continue;
    }

    // Check if question with identical stem already exists under this topic
    let question = await prisma.question.findFirst({
      where: {
        topicId,
        stem: q.stem,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      question = await prisma.question.create({
        data: {
          topicId,
          stem: q.stem,
          explanation: q.explanation,
          difficulty: q.difficulty,
          expectedSeconds: q.expectedSeconds,
          isPublished: true,
          options: {
            create: q.options.map((opt) => ({
              label: opt.label,
              body: opt.body,
              isCorrect: opt.isCorrect,
            })),
          },
        },
        include: {
          options: true,
        },
      });
      createdQuestionsCount++;
    }

    seededQuestionsList.push({
      id: question.id,
      subtestCode: q.subtestCode,
      topicId,
      stem: question.stem,
      options: question.options.map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
      })),
    });
  }
  console.log(
    `✓ Processed ${seededQuestionsList.length} questions (${createdQuestionsCount} new created).`,
  );

  // ==========================================
  // 3. Seed Verified Support Resources
  // ==========================================
  console.log("🤝 Seeding verified mental health support resources...");
  for (const res of SEED_SUPPORT_RESOURCES) {
    const existing = await prisma.supportResource.findFirst({
      where: { name: res.name },
    });

    if (existing) {
      await prisma.supportResource.update({
        where: { id: existing.id },
        data: {
          type: res.type,
          contact: res.contact,
          url: res.url,
          isActive: res.isActive,
          lastVerifiedAt: res.lastVerifiedAt,
        },
      });
    } else {
      await prisma.supportResource.create({
        data: {
          name: res.name,
          type: res.type,
          contact: res.contact,
          url: res.url,
          isActive: res.isActive,
          lastVerifiedAt: res.lastVerifiedAt,
        },
      });
    }
  }
  console.log(
    `✓ Seeded ${SEED_SUPPORT_RESOURCES.length} verified support resources.`,
  );

  // ==========================================
  // 4. Seed Demo Student Account & Profile
  // ==========================================
  console.log("👤 Ensuring demo student account and profile...");
  const demoEmail = "student@wtc.com";
  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name: "Lia",
        role: "student",
      },
    });
  }

  const demoUserId = demoUser.id;

  // Profile with wellbeing consent on
  await prisma.studentProfile.upsert({
    where: { userId: demoUserId },
    update: {
      targetUniversity: "Institut Teknologi Bandung",
      targetMajor: "Teknik Informatika",
      examDate: new Date("2027-05-15"),
      wellbeingConsent: true,
      consentedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    create: {
      userId: demoUserId,
      targetUniversity: "Institut Teknologi Bandung",
      targetMajor: "Teknik Informatika",
      examDate: new Date("2027-05-15"),
      wellbeingConsent: true,
      consentedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Also ensure admin role for azkadaiki26@gmail.com if exists
  await prisma.user.updateMany({
    where: { email: "azkadaiki26@gmail.com" },
    data: { role: "admin" },
  });

  console.log(
    `✓ Demo student ready: ${demoUser.name} (${demoUser.email}, ID: ${demoUserId})`,
  );

  // ==========================================
  // 5. Seed 14 Days of Check-ins (The Demo Story)
  // ==========================================
  console.log("🗓️ Seeding 14-day check-in history...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Checkin data points: High initial energy, rising stress, culminating in Day 0 (today)
  // Day 0: 4.0 hours of sleep, stress 4 -> lands in "Pemulihan" (Recovery mode) per rules.ts
  const checkinData = [
    {
      dayOffset: 13,
      sleep: 7.0,
      energy: 4,
      mood: 4,
      stress: 2,
      note: "Memulai jadwal belajar baru dengan semangat!",
    },
    { dayOffset: 12, sleep: 6.5, energy: 3, mood: 4, stress: 2, note: null },
    { dayOffset: 11, sleep: 7.0, energy: 4, mood: 4, stress: 2, note: null },
    {
      dayOffset: 10,
      sleep: 7.5,
      energy: 5,
      mood: 5,
      stress: 1,
      note: "Tidur nyenyak 7.5 jam, sangat fokus latihan soal.",
    },
    { dayOffset: 9, sleep: 6.8, energy: 4, mood: 4, stress: 2, note: null },
    { dayOffset: 8, sleep: 7.2, energy: 4, mood: 4, stress: 2, note: null },
    {
      dayOffset: 7,
      sleep: 7.0,
      energy: 4,
      mood: 4,
      stress: 2,
      note: "Sesi review mingguan berjalan lancar.",
    },
    { dayOffset: 6, sleep: 6.0, energy: 3, mood: 3, stress: 3, note: null },
    { dayOffset: 5, sleep: 6.5, energy: 4, mood: 4, stress: 2, note: null },
    {
      dayOffset: 4,
      sleep: 6.0,
      energy: 3,
      mood: 3,
      stress: 3,
      note: "Mulai agak cemas menjelang jadwal tryout simulasi penuh.",
    },
    { dayOffset: 3, sleep: 5.5, energy: 3, mood: 3, stress: 3, note: null },
    {
      dayOffset: 2,
      sleep: 5.2,
      energy: 3,
      mood: 3,
      stress: 4,
      note: "Malam simulasi penuh, sempat grogi di 15 menit terakhir.",
    },
    {
      dayOffset: 1,
      sleep: 4.8,
      energy: 2,
      mood: 2,
      stress: 4,
      note: "Banyak tugas sekolah menumpuk dan belajar larut malam.",
    },
    {
      dayOffset: 0,
      sleep: 4.0,
      energy: 2,
      mood: 2,
      stress: 4,
      note: "Kurang tidur ngebut latihan semalam, kepala agak pusing tapi mau coba santai hari ini.",
    },
  ];

  for (const c of checkinData) {
    const checkinDate = new Date(today.getTime() - c.dayOffset * 86400000);
    checkinDate.setHours(0, 0, 0, 0);

    await prisma.checkin.upsert({
      where: {
        userId_checkinDate: {
          userId: demoUserId,
          checkinDate,
        },
      },
      update: {
        sleepHours: c.sleep,
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
        note: c.note,
      },
      create: {
        userId: demoUserId,
        checkinDate,
        sleepHours: c.sleep,
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
        note: c.note,
      },
    });
  }
  console.log(`✓ Seeded ${checkinData.length} daily check-ins.`);

  // ==========================================
  // 6. Seed Daily Plan for Today (Recovery Mode)
  // ==========================================
  console.log("📋 Seeding adaptive daily plan for today (Mode Pemulihan)...");
  const pmTopicId =
    topicMap.get("PM:Fungsi Kuadrat") ??
    topicMap.get("PM:Model Matematika & Optimasi");
  const kpuTopicId = topicMap.get("KPU:Penalaran Deduktif");

  // Remove existing plan for today if re-seeding
  await prisma.dailyPlan.deleteMany({
    where: {
      userId: demoUserId,
      planDate: today,
    },
  });

  await prisma.dailyPlan.create({
    data: {
      userId: demoUserId,
      planDate: today,
      mode: DayMode.recovery,
      ruleKey: "recovery",
      reason:
        "Waktu tidur kurang dari 5 jam dan tingkat stres tinggi. Hari ini disarankan istirahat aktif dan latihan ringan tanpa beban waktu.",
      tasks: {
        create: [
          {
            type: TaskType.review,
            title: "Ulas Ringkas Catatan Penalaran Matematika",
            reason: "Review santai topik yang paling sering keliru",
            estMinutes: 15,
            status: TaskStatus.pending,
            sortOrder: 0,
            topicId: pmTopicId,
          },
          {
            type: TaskType.calm,
            title: "Latihan PerNafasan Kotak (Box Breathing)",
            reason: "Meredakan ketegangan fisik dan menurunkan detak jantung",
            estMinutes: 5,
            status: TaskStatus.done,
            sortOrder: 1,
          },
          {
            type: TaskType.practice,
            title: "Latihan Santai 5 Soal Penalaran Deduktif",
            reason:
              "Latihan santai tanpa batas waktu untuk menjaga ritme belajar",
            estMinutes: 15,
            status: TaskStatus.pending,
            sortOrder: 2,
            topicId: kpuTopicId,
          },
        ],
      },
    },
  });
  console.log(
    "✓ Seeded today's adaptive plan in Recovery mode with 3 light tasks.",
  );

  // ==========================================
  // 7. Seed Demo Sessions & The Error Autopsy Story
  // ==========================================
  console.log("🎯 Seeding demo tryout sessions with error autopsy pattern...");

  // Clean old tryout sessions for the demo user
  await prisma.tryoutSession.deleteMany({
    where: { userId: demoUserId },
  });

  // SESSION A: 2 days ago — Full Simulation (Simulasi Penuh 30 menit)
  // Demonstrates the signature finding:
  // "Most errors happen in the last 15 minutes due to time pressure and panic!"
  const kpuQuestions = seededQuestionsList.filter(
    (q) => q.subtestCode === "KPU",
  );
  const pmQuestions = seededQuestionsList.filter((q) => q.subtestCode === "PM");
  const simulationQuestions = [
    ...kpuQuestions.slice(0, 6),
    ...pmQuestions.slice(0, 6),
  ];

  const simStartedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  simStartedAt.setHours(14, 0, 0, 0);
  const simFinishedAt = new Date(simStartedAt.getTime() + 1800 * 1000); // exactly 30 minutes

  const kpuSubtestId = subtestMap.get("KPU");

  const sessionA = await prisma.tryoutSession.create({
    data: {
      userId: demoUserId,
      subtestId: kpuSubtestId,
      mode: TryoutMode.full_simulation,
      timeLimitSeconds: 1800,
      startedAt: simStartedAt,
      endsAt: simFinishedAt,
      finishedAt: simFinishedAt,
      score: 50.0, // 6 correct, 6 wrong out of 12
    },
  });

  // Prepare answers:
  // Q0 - Q5 (first 15 minutes: elapsed 60s - 850s): 5 correct, 1 wrong (didnt_know)
  // Q6 - Q11 (last 15 minutes: elapsed 920s - 1780s): 1 correct, 5 wrong (panic, out_of_time, careless)
  const answersPlanA = [
    // --- First 15 Minutes ---
    {
      qIdx: 0,
      isCorrect: true,
      secondsSpent: 75,
      elapsedSeconds: 75,
      tag: null,
      source: null,
    },
    {
      qIdx: 1,
      isCorrect: true,
      secondsSpent: 85,
      elapsedSeconds: 160,
      tag: null,
      source: null,
    },
    {
      qIdx: 2,
      isCorrect: true,
      secondsSpent: 110,
      elapsedSeconds: 270,
      tag: null,
      source: null,
    },
    {
      qIdx: 3,
      isCorrect: false,
      secondsSpent: 130,
      elapsedSeconds: 400,
      tag: ErrorCause.didnt_know,
      source: TagSource.user,
    },
    {
      qIdx: 4,
      isCorrect: true,
      secondsSpent: 160,
      elapsedSeconds: 560,
      tag: null,
      source: null,
    },
    {
      qIdx: 5,
      isCorrect: true,
      secondsSpent: 160,
      elapsedSeconds: 720,
      tag: null,
      source: null,
    },
    // --- Last 15 Minutes (High pressure & panic!) ---
    {
      qIdx: 6,
      isCorrect: true,
      secondsSpent: 190,
      elapsedSeconds: 910,
      tag: null,
      source: null,
    },
    {
      qIdx: 7,
      isCorrect: false,
      secondsSpent: 180,
      elapsedSeconds: 1090,
      tag: ErrorCause.panic,
      source: TagSource.user,
    },
    {
      qIdx: 8,
      isCorrect: false,
      secondsSpent: 210,
      elapsedSeconds: 1300,
      tag: ErrorCause.panic,
      source: TagSource.user,
    },
    {
      qIdx: 9,
      isCorrect: false,
      secondsSpent: 160,
      elapsedSeconds: 1460,
      tag: ErrorCause.careless,
      source: TagSource.user,
    },
    {
      qIdx: 10,
      isCorrect: false,
      secondsSpent: 170,
      elapsedSeconds: 1630,
      tag: ErrorCause.out_of_time,
      source: TagSource.user,
    },
    {
      qIdx: 11,
      isCorrect: false,
      secondsSpent: 150,
      elapsedSeconds: 1780,
      tag: ErrorCause.out_of_time,
      source: TagSource.user,
    },
  ];

  for (let sortOrder = 0; sortOrder < answersPlanA.length; sortOrder++) {
    const plan = answersPlanA[sortOrder];
    const qData = simulationQuestions[plan.qIdx];
    if (!qData) continue;

    const correctOption = qData.options.find((o) => o.isCorrect);
    const wrongOption = qData.options.find((o) => !o.isCorrect);
    const chosenOption = plan.isCorrect ? correctOption : wrongOption;

    await prisma.sessionAnswer.create({
      data: {
        sessionId: sessionA.id,
        questionId: qData.id,
        selectedOptionId: chosenOption?.id ?? null,
        sortOrder,
        isCorrect: plan.isCorrect,
        secondsSpent: plan.secondsSpent,
        elapsedSeconds: plan.elapsedSeconds,
        errorTag: plan.tag,
        tagSource: plan.source,
        answeredAt: new Date(
          simStartedAt.getTime() + plan.elapsedSeconds * 1000,
        ),
      },
    });
  }

  // Panic button calm session recorded during this simulation!
  await prisma.calmSession.create({
    data: {
      userId: demoUserId,
      tryoutSessionId: sessionA.id,
      tool: CalmTool.breathing,
      triggerSource: CalmTrigger.panic_button,
      durationSeconds: 60,
      note: "Mengambil Nafas 4-4-4-4 saat panik di menit ke-22 simulasi ketika melihat waktu menipis.",
      createdAt: new Date(simStartedAt.getTime() + 1320 * 1000),
    },
  });

  // SESSION B: 5 days ago — Timed Practice (Latihan Waktu)
  const pkSubtestId = subtestMap.get("PK");
  const pkQuestions = seededQuestionsList
    .filter((q) => q.subtestCode === "PK")
    .slice(0, 5);
  const timedStartedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  timedStartedAt.setHours(16, 0, 0, 0);

  const sessionB = await prisma.tryoutSession.create({
    data: {
      userId: demoUserId,
      subtestId: pkSubtestId,
      mode: TryoutMode.timed,
      timeLimitSeconds: 600,
      startedAt: timedStartedAt,
      endsAt: new Date(timedStartedAt.getTime() + 600 * 1000),
      finishedAt: new Date(timedStartedAt.getTime() + 450 * 1000),
      score: 80.0, // 4 of 5
    },
  });

  for (let i = 0; i < pkQuestions.length; i++) {
    const qData = pkQuestions[i];
    const isCorrect = i !== 2;
    const chosen =
      isCorrect ?
        qData.options.find((o) => o.isCorrect)
      : qData.options.find((o) => !o.isCorrect);

    await prisma.sessionAnswer.create({
      data: {
        sessionId: sessionB.id,
        questionId: qData.id,
        selectedOptionId: chosen?.id ?? null,
        sortOrder: i,
        isCorrect,
        secondsSpent: 80,
        elapsedSeconds: (i + 1) * 80,
        errorTag: isCorrect ? null : ErrorCause.careless,
        tagSource: isCorrect ? null : TagSource.user,
        answeredAt: new Date(timedStartedAt.getTime() + (i + 1) * 80 * 1000),
      },
    });
  }

  // SESSION C: 8 days ago — Relaxed Practice (Santai)
  const kmbmSubtestId = subtestMap.get("KMBM");
  const kmbmQuestions = seededQuestionsList
    .filter((q) => q.subtestCode === "KMBM")
    .slice(0, 5);
  const relaxedStartedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  relaxedStartedAt.setHours(10, 0, 0, 0);

  const sessionC = await prisma.tryoutSession.create({
    data: {
      userId: demoUserId,
      subtestId: kmbmSubtestId,
      mode: TryoutMode.relaxed,
      timeLimitSeconds: null,
      startedAt: relaxedStartedAt,
      endsAt: null,
      finishedAt: new Date(relaxedStartedAt.getTime() + 400 * 1000),
      score: 100.0, // 5 of 5
    },
  });

  for (let i = 0; i < kmbmQuestions.length; i++) {
    const qData = kmbmQuestions[i];
    const correctOpt = qData.options.find((o) => o.isCorrect);

    await prisma.sessionAnswer.create({
      data: {
        sessionId: sessionC.id,
        questionId: qData.id,
        selectedOptionId: correctOpt?.id ?? null,
        sortOrder: i,
        isCorrect: true,
        secondsSpent: 65,
        elapsedSeconds: (i + 1) * 65,
        errorTag: null,
        tagSource: null,
        answeredAt: new Date(relaxedStartedAt.getTime() + (i + 1) * 65 * 1000),
      },
    });
  }

  console.log(
    "✓ Seeded 3 tryout sessions (Full Simulation, Timed Practice, Relaxed Practice).",
  );

  // ==========================================
  // 8. Seed Topic Stats for Demo Student
  // ==========================================
  console.log("📊 Updating Topic Stats for demo student...");
  const practicedTopicIds = new Set<string>();
  for (const q of [...simulationQuestions, ...pkQuestions, ...kmbmQuestions]) {
    practicedTopicIds.add(q.topicId);
  }

  for (const topicId of practicedTopicIds) {
    const stats = await prisma.sessionAnswer.aggregate({
      where: {
        session: { userId: demoUserId },
        question: { topicId },
      },
      _count: { id: true },
    });

    const correctStats = await prisma.sessionAnswer.count({
      where: {
        session: { userId: demoUserId },
        question: { topicId },
        isCorrect: true,
      },
    });

    await prisma.topicStat.upsert({
      where: {
        userId_topicId: {
          userId: demoUserId,
          topicId,
        },
      },
      update: {
        attempts: stats._count.id,
        correct: correctStats,
        lastPracticedAt: new Date(),
      },
      create: {
        userId: demoUserId,
        topicId,
        attempts: stats._count.id,
        correct: correctStats,
        lastPracticedAt: new Date(),
      },
    });
  }
  console.log(`✓ Updated Topic Stats across ${practicedTopicIds.size} topics.`);

  // Additional Calm Session (Today from plan)
  await prisma.calmSession.create({
    data: {
      userId: demoUserId,
      tool: CalmTool.breathing,
      triggerSource: CalmTrigger.plan,
      durationSeconds: 300,
      note: "PerNafasan kotak 4-4-4-4 pagi hari untuk menenangkan pikiran sebelum mulai belajar.",
      createdAt: new Date(),
    },
  });

  console.log("\n🎉 Seeding completed successfully!");
  console.log("------------------------------------------------------------");
  console.log("⭐ Demo Student Account:");
  console.log(`   Email: ${demoUser.email}`);
  console.log(`   Name:  ${demoUser.name}`);
  console.log("   Today Mode: Pemulihan (Recovery) - Sleep 4h, Stress 4");
  console.log("   Autopsy Pattern: Errors heavily clustered in last 15 min");
  console.log("------------------------------------------------------------");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
