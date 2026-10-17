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
import { seedId } from "../lib/seed-id";
import { SEED_SUPPORT_RESOURCES } from "./seed-data/support-resources";
import { SEED_SUBTESTS } from "./seed-data/subtests-and-topics";
import { SEED_QUESTIONS } from "./seed-data/questions";
import { SEED_LESSONS } from "./seed-data/lessons";
import { blocksToLexicalState } from "../features/ai/blocks-to-lexical";
import { evaluateDailyMode } from "../lib/rules/daily-mode";
import { generateDailyPlanTasks } from "../lib/rules/plan-generator";
import { auth } from "../lib/auth";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

export async function runSeed() {
  console.log("🌱 Starting idempotent MOODI database seed...");

  // Validate required seed passwords
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "azkadaiki26@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const demoPassword = process.env.SEED_DEMO_PASSWORD;

  if (!adminPassword || !demoPassword) {
    throw new Error(
      "Missing required environment variable: SEED_ADMIN_PASSWORD or SEED_DEMO_PASSWORD. Please check your .env file.",
    );
  }

  // ==========================================
  // 1. Seed Subtests & Topics (Official SNPMB)
  // ==========================================
  console.log("📚 Seeding UTBK Subtests & Topics...");
  const subtestMap = new Map<string, string>(); // code -> id
  const topicMap = new Map<string, string>(); // "subtestCode:topicName" -> id

  for (const s of SEED_SUBTESTS) {
    const subtestId = seedId(`subtest:${s.code}`);
    const subtest = await prisma.subtest.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        defaultSeconds: s.defaultSeconds,
      },
      create: {
        id: subtestId,
        code: s.code,
        name: s.name,
        defaultSeconds: s.defaultSeconds,
      },
    });
    subtestMap.set(s.code, subtest.id);

    for (const t of s.topics) {
      const topicId = seedId(`topic:${s.code}:${t.name}`);
      const topic = await prisma.topic.upsert({
        where: {
          subtestId_name: {
            subtestId: subtest.id,
            name: t.name,
          },
        },
        update: {},
        create: {
          id: topicId,
          subtestId: subtest.id,
          name: t.name,
        },
      });
      topicMap.set(`${s.code}:${t.name}`, topic.id);
    }
  }
  console.log(`✓ Seeded ${subtestMap.size} subtests and ${topicMap.size} topics.`);

  // ==========================================
  // 2. Seed Original Questions & Options
  // ==========================================
  console.log("📝 Seeding original UTBK questions & options (published: true)...");
  const seededQuestionsList: Array<{
    id: string;
    subtestCode: string;
    topicId: string;
    stem: string;
    options: Array<{ id: string; label: string; isCorrect: boolean }>;
  }> = [];

  for (const q of SEED_QUESTIONS) {
    const topicId = topicMap.get(`${q.subtestCode}:${q.topicName}`);
    if (!topicId) continue;

    const questionId = seedId(`question:${q.subtestCode}:${q.topicName}:${q.stem}`);

    const question = await prisma.question.upsert({
      where: { id: questionId },
      update: {
        topicId,
        stem: q.stem,
        explanation: q.explanation,
        difficulty: q.difficulty,
        expectedSeconds: q.expectedSeconds,
        isPublished: true,
        source: "manual",
      },
      create: {
        id: questionId,
        topicId,
        stem: q.stem,
        explanation: q.explanation,
        difficulty: q.difficulty,
        expectedSeconds: q.expectedSeconds,
        isPublished: true,
        source: "manual",
      },
    });

    // Upsert options
    const seededOptions: Array<{ id: string; label: string; isCorrect: boolean }> = [];
    for (const opt of q.options) {
      const optionId = seedId(`option:${questionId}:${opt.label}`);
      const option = await prisma.questionOption.upsert({
        where: { id: optionId },
        update: {
          body: opt.body,
          isCorrect: opt.isCorrect,
        },
        create: {
          id: optionId,
          questionId,
          label: opt.label,
          body: opt.body,
          isCorrect: opt.isCorrect,
        },
      });
      seededOptions.push({
        id: option.id,
        label: option.label,
        isCorrect: option.isCorrect,
      });
    }

    seededQuestionsList.push({
      id: question.id,
      subtestCode: q.subtestCode,
      topicId,
      stem: question.stem,
      options: seededOptions,
    });
  }
  console.log(`✓ Seeded ${seededQuestionsList.length} original UTBK questions.`);

  // ==========================================
  // 3. Seed Lessons & Check Questions
  // ==========================================
  console.log("📖 Seeding structured lessons with Lexical JSON AST...");
  const seededLessonsList: Array<{ id: string; topicId: string; title: string }> = [];

  for (let sortIdx = 0; sortIdx < SEED_LESSONS.length; sortIdx++) {
    const l = SEED_LESSONS[sortIdx];
    const topicId = topicMap.get(`${l.subtestCode}:${l.topicName}`);
    if (!topicId) continue;

    const lessonId = seedId(`lesson:${l.subtestCode}:${l.topicName}:${l.title}`);
    const lexicalContent = blocksToLexicalState(l.blocks);

    const lesson = await prisma.lesson.upsert({
      where: { id: lessonId },
      update: {
        topicId,
        title: l.title,
        summary: l.summary,
        estMinutes: l.estMinutes,
        content: lexicalContent as any,
        status: l.status,
        source: l.source,
        sortOrder: sortIdx,
      },
      create: {
        id: lessonId,
        topicId,
        title: l.title,
        summary: l.summary,
        estMinutes: l.estMinutes,
        content: lexicalContent as any,
        status: l.status,
        source: l.source,
        sortOrder: sortIdx,
      },
    });

    // Link check questions if any
    if (l.checkQuestionIndices && l.checkQuestionIndices.length > 0) {
      const topicQuestions = seededQuestionsList.filter((q) => q.topicId === topicId);
      for (let i = 0; i < l.checkQuestionIndices.length; i++) {
        const qIdx = l.checkQuestionIndices[i];
        const targetQ = topicQuestions[qIdx];
        if (targetQ) {
          await prisma.lessonQuestion.upsert({
            where: {
              lessonId_questionId: {
                lessonId: lesson.id,
                questionId: targetQ.id,
              },
            },
            update: { sortOrder: i },
            create: {
              lessonId: lesson.id,
              questionId: targetQ.id,
              sortOrder: i,
            },
          });
        }
      }
    }

    seededLessonsList.push({ id: lesson.id, topicId, title: lesson.title });
  }
  console.log(`✓ Seeded ${seededLessonsList.length} lessons with check questions.`);

  // ==========================================
  // 4. Seed Verified Support Resources
  // ==========================================
  console.log("🤝 Seeding verified mental health support resources...");
  if (SEED_SUPPORT_RESOURCES.length === 0) {
    console.log("ℹ No verified support resources in file. Skipping support resources.");
  } else {
    for (const res of SEED_SUPPORT_RESOURCES) {
      const resId = seedId(`support:${res.name}`);
      await prisma.supportResource.upsert({
        where: { id: resId },
        update: {
          name: res.name,
          type: res.type,
          contact: res.contact,
          url: res.url,
          isActive: res.isActive,
          lastVerifiedAt: res.lastVerifiedAt,
        },
        create: {
          id: resId,
          name: res.name,
          type: res.type,
          contact: res.contact,
          url: res.url,
          isActive: res.isActive,
          lastVerifiedAt: res.lastVerifiedAt,
        },
      });
    }
    console.log(`✓ Seeded ${SEED_SUPPORT_RESOURCES.length} verified support resources.`);
  }

  // ==========================================
  // 5. Seed Users via Better Auth Server API
  // ==========================================
  console.log("👤 Ensuring admin and demo student accounts via Better Auth API...");

  // 5a. Admin Account
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    try {
      const res = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: "Admin MOODI",
        },
      });
      adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    } catch (e: any) {
      console.warn("Notice during admin signup:", e.message || e);
      adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    }
  }

  if (adminUser) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: "admin" },
    });
    console.log(`✓ Admin user ready: ${adminUser.email} (Role: admin)`);
  }

  // 5b. Demo Student Account
  const demoEmail = "student@wtc.com";
  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: demoEmail,
          password: demoPassword,
          name: "Lia",
        },
      });
      demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
    } catch (e: any) {
      console.warn("Notice during demo student signup:", e.message || e);
      demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });
    }
  }

  if (!demoUser) {
    throw new Error("Failed to create or retrieve demo student account.");
  }

  const demoUserId = demoUser.id;

  // Student Profile
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

  // ==========================================
  // 6. Seed 14 Days Demo History
  // ==========================================
  console.log("🗓️ Seeding 14-day history relative to today...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 14 days of checkins: Days 13 to 1
  // Day 1 (yesterday): 4.0h sleep, stress 4 -> lands in Pemulihan (Recovery)
  // Day 0 (today): left without check-in so demo video can fill one in live!
  const checkinHistory = [
    { dayOffset: 13, sleep: 7.0, energy: 4, mood: 4, stress: 2, note: "Memulai jadwal belajar baru dengan semangat!" },
    { dayOffset: 12, sleep: 6.5, energy: 3, mood: 4, stress: 2, note: null },
    { dayOffset: 11, sleep: 7.0, energy: 4, mood: 4, stress: 2, note: null },
    { dayOffset: 10, sleep: 7.5, energy: 5, mood: 5, stress: 1, note: "Tidur nyenyak 7.5 jam, sangat fokus latihan soal." },
    { dayOffset: 9, sleep: 6.8, energy: 4, mood: 4, stress: 2, note: null },
    { dayOffset: 8, sleep: 7.2, energy: 4, mood: 4, stress: 2, note: null },
    { dayOffset: 7, sleep: 7.0, energy: 4, mood: 4, stress: 2, note: "Sesi review mingguan berjalan lancar." },
    { dayOffset: 6, sleep: 6.0, energy: 3, mood: 3, stress: 3, note: null },
    { dayOffset: 5, sleep: 6.5, energy: 4, mood: 4, stress: 2, note: null },
    { dayOffset: 4, sleep: 6.0, energy: 3, mood: 3, stress: 3, note: "Mulai agak cemas menjelang jadwal tryout simulasi penuh." },
    { dayOffset: 3, sleep: 5.5, energy: 2, mood: 3, stress: 3, note: null },
    { dayOffset: 2, sleep: 5.0, energy: 2, mood: 2, stress: 4, note: "Kelelahan setelah latihan panjang." },
    { dayOffset: 1, sleep: 4.0, energy: 2, mood: 2, stress: 4, note: "Kurang tidur dan kepala agak pusing." },
  ];

  for (const c of checkinHistory) {
    const cDate = new Date(today);
    cDate.setDate(cDate.getDate() - c.dayOffset);

    await prisma.checkin.upsert({
      where: {
        userId_checkinDate: {
          userId: demoUserId,
          checkinDate: cDate,
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
        checkinDate: cDate,
        sleepHours: c.sleep,
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
        note: c.note,
      },
    });

    // Evaluate daily mode through real evaluateDailyMode
    const evaluation = evaluateDailyMode(
      {
        sleepHours: c.sleep,
        energy: c.energy,
        mood: c.mood,
        stress: c.stress,
      },
      [],
      true,
    );

    const plan = await prisma.dailyPlan.upsert({
      where: {
        userId_planDate: {
          userId: demoUserId,
          planDate: cDate,
        },
      },
      update: {
        mode: evaluation.mode,
        ruleKey: evaluation.ruleKey,
        reason: evaluation.reason,
      },
      create: {
        userId: demoUserId,
        planDate: cDate,
        mode: evaluation.mode,
        ruleKey: evaluation.ruleKey,
        reason: evaluation.reason,
      },
    });

    // Plan tasks
    const candidateTopics = [
      { id: seededLessonsList[0]?.topicId || "", name: "Penalaran Deduktif" },
      { id: seededLessonsList[1]?.topicId || "", name: "Aljabar & Persamaan" },
    ];
    const candidateLessons = seededLessonsList.map((l) => ({
      id: l.id,
      title: l.title,
      topicId: l.topicId,
      estMinutes: 10,
    }));

    const generatedTasks = generateDailyPlanTasks(evaluation.mode, candidateTopics, candidateLessons);
    await prisma.planTask.deleteMany({ where: { dailyPlanId: plan.id } });

    for (const t of generatedTasks) {
      await prisma.planTask.create({
        data: {
          dailyPlanId: plan.id,
          type: t.type,
          title: t.title,
          reason: t.reason,
          estMinutes: t.estMinutes,
          sortOrder: t.sortOrder,
          topicId: t.topicId,
          lessonId: t.lessonId,
          status: c.dayOffset > 1 ? "done" : "pending",
        },
      });
    }
  }

  // Today's plan (Day 0): generated with recovery mode (from yesterday's strain)
  // Has a lesson task in today's plan!
  const todayPlan = await prisma.dailyPlan.upsert({
    where: {
      userId_planDate: {
        userId: demoUserId,
        planDate: today,
      },
    },
    update: {
      mode: "recovery",
      ruleKey: "recovery",
      reason: "Tidurmu kurang atau energimu rendah, jadi cukup ulas materi tanpa tekanan waktu.",
    },
    create: {
      userId: demoUserId,
      planDate: today,
      mode: "recovery",
      ruleKey: "recovery",
      reason: "Tidurmu kurang atau energimu rendah, jadi cukup ulas materi tanpa tekanan waktu.",
    },
  });

  const todayLesson = seededLessonsList[0];
  await prisma.planTask.deleteMany({ where: { dailyPlanId: todayPlan.id } });
  await prisma.planTask.createMany({
    data: [
      {
        dailyPlanId: todayPlan.id,
        type: "lesson",
        title: `Pelajari Konsep: ${todayLesson?.title || "Logika Kuantor"}`,
        reason: "Tidurmu kurang atau energimu rendah, jadi cukup baca materi konsep ringkas tanpa beban waktu.",
        estMinutes: 8,
        sortOrder: 0,
        topicId: todayLesson?.topicId,
        lessonId: todayLesson?.id,
        status: "pending",
      },
      {
        dailyPlanId: todayPlan.id,
        type: "calm",
        title: "Latihan Pernapasan Kotak (Box Breathing 4-4-4-4)",
        reason: "Meredakan ketegangan fisik dan menurunkan hormon stres tubuh.",
        estMinutes: 5,
        sortOrder: 1,
        status: "pending",
      },
      {
        dailyPlanId: todayPlan.id,
        type: "practice",
        title: "Latihan Santai 5 Soal Penalaran Deduktif",
        reason: "Latihan santai dengan pembahasan langsung di setiap nomor.",
        estMinutes: 15,
        sortOrder: 2,
        topicId: todayLesson?.topicId,
        status: "pending",
      },
    ],
  });

  // ==========================================
  // 7. Seed Lesson Progress for Demo Student
  // ==========================================
  console.log("📚 Seeding student lesson progress (2 completed, 1 in progress)...");
  if (seededLessonsList.length >= 3) {
    // Lesson 1: completed
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: demoUserId,
          lessonId: seededLessonsList[0].id,
        },
      },
      update: {
        status: "completed",
        checkCorrect: 2,
        checkTotal: 2,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: demoUserId,
        lessonId: seededLessonsList[0].id,
        status: "completed",
        checkCorrect: 2,
        checkTotal: 2,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    // Lesson 2: completed
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: demoUserId,
          lessonId: seededLessonsList[1].id,
        },
      },
      update: {
        status: "completed",
        checkCorrect: 1,
        checkTotal: 1,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: demoUserId,
        lessonId: seededLessonsList[1].id,
        status: "completed",
        checkCorrect: 1,
        checkTotal: 1,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    // Lesson 3: in progress (viewed yesterday)
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: demoUserId,
          lessonId: seededLessonsList[2].id,
        },
      },
      update: {
        status: "in_progress",
        lastViewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      create: {
        userId: demoUserId,
        lessonId: seededLessonsList[2].id,
        status: "in_progress",
        lastViewedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    });
  }

  // ==========================================
  // 8. Seed Tryout Session & Error Autopsy
  // ==========================================
  console.log("⏱️ Seeding tryout sessions with error autopsy in last 15 minutes...");
  const kpuSubtestId = subtestMap.get("KPU");
  if (kpuSubtestId) {
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - 2);

    const sessionId = seedId(`session:demo:${kpuSubtestId}:day2`);
    const session = await prisma.tryoutSession.upsert({
      where: { id: sessionId },
      update: {
        subtestId: kpuSubtestId,
        mode: "timed",
        startedAt: sessionDate,
        finishedAt: new Date(sessionDate.getTime() + 25 * 60 * 1000),
        timeLimitSeconds: 1800,
        score: 65,
      },
      create: {
        id: sessionId,
        userId: demoUserId,
        subtestId: kpuSubtestId,
        mode: "timed",
        startedAt: sessionDate,
        finishedAt: new Date(sessionDate.getTime() + 25 * 60 * 1000),
        timeLimitSeconds: 1800,
        score: 65,
      },
    });

    // Answers with mistakes clustered in the last 15 minutes (under time pressure)
    const kpuQuestions = seededQuestionsList.filter((q) => q.subtestCode === "KPU");
    for (let i = 0; i < kpuQuestions.length; i++) {
      const q = kpuQuestions[i];
      const isLateQuestion = i >= 3;
      const isCorrect = !isLateQuestion;
      const correctOpt = q.options.find((o) => o.isCorrect);
      const wrongOpt = q.options.find((o) => !o.isCorrect);
      const chosenOpt = isCorrect ? correctOpt : wrongOpt;

      const answerId = seedId(`answer:${session.id}:${q.id}`);
      await prisma.sessionAnswer.upsert({
        where: { id: answerId },
        update: {
          selectedOptionId: chosenOpt?.id || null,
          isCorrect,
          secondsSpent: isLateQuestion ? 35 : 85,
          elapsedSeconds: 300 + i * 90,
          errorTag: isCorrect ? null : ("out_of_time" as ErrorCause),
          tagSource: isCorrect ? null : ("user" as TagSource),
        },
        create: {
          id: answerId,
          sessionId: session.id,
          questionId: q.id,
          sortOrder: i,
          selectedOptionId: chosenOpt?.id || null,
          isCorrect,
          secondsSpent: isLateQuestion ? 35 : 85,
          elapsedSeconds: 300 + i * 90,
          errorTag: isCorrect ? null : ("out_of_time" as ErrorCause),
          tagSource: isCorrect ? null : ("user" as TagSource),
        },
      });
    }

    // TopicStats
    const kpuTopic = topicMap.get("KPU:Penalaran Deduktif");
    if (kpuTopic) {
      await prisma.topicStat.upsert({
        where: {
          userId_topicId: {
            userId: demoUserId,
            topicId: kpuTopic,
          },
        },
        update: {
          attempts: 6,
          correct: 4,
          lastPracticedAt: sessionDate,
        },
        create: {
          userId: demoUserId,
          topicId: kpuTopic,
          attempts: 6,
          correct: 4,
          lastPracticedAt: sessionDate,
        },
      });
    }
  }

  console.log("✅ MOODI database seed completed successfully!");
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  runSeed()
    .catch((e) => {
      console.error("❌ Seed failed with error:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
