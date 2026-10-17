import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { runSeed } from "./seed";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

function getTargetHost(urlStr?: string): string {
  if (!urlStr) return "unknown-host";
  try {
    const parsed = new URL(urlStr);
    return parsed.host || parsed.hostname;
  } catch {
    return "unknown-host";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const scopeArg = args.find((a) => a.startsWith("--scope="))?.split("=")[1] || "demo";
  const hasYes = args.includes("--yes");

  const targetHost = getTargetHost(databaseUrl);
  console.log(`📡 Target database host: ${targetHost}`);

  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to run db:refresh in production environment!");
    process.exit(1);
  }

  if (scopeArg === "all") {
    if (!hasYes) {
      console.error(
        "⚠️  Wiping ALL tables (--scope=all) requires the --yes flag to confirm.\nUsage: npm run db:refresh -- --scope=all --yes",
      );
      process.exit(1);
    }

    console.log(`🧹 Wiping ALL tables on ${targetHost}...`);
    await prisma.$transaction([
      prisma.sessionAnswer.deleteMany(),
      prisma.tryoutSession.deleteMany(),
      prisma.topicStat.deleteMany(),
      prisma.lessonQuestion.deleteMany(),
      prisma.lessonProgress.deleteMany(),
      prisma.planTask.deleteMany(),
      prisma.dailyPlan.deleteMany(),
      prisma.checkin.deleteMany(),
      prisma.calmSession.deleteMany(),
      prisma.supportEvent.deleteMany(),
      prisma.aiGeneration.deleteMany(),
      prisma.questionOption.deleteMany(),
      prisma.question.deleteMany(),
      prisma.lesson.deleteMany(),
      prisma.topic.deleteMany(),
      prisma.subtest.deleteMany(),
      prisma.supportResource.deleteMany(),
      prisma.studentProfile.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.verification.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    console.log("✓ All tables wiped.");
  } else {
    // Default: scope=demo
    console.log("🧹 Resetting demo student data...");
    const demoEmail = "student@wtc.com";
    const demoUser = await prisma.user.findUnique({
      where: { email: demoEmail },
      select: { id: true },
    });

    if (demoUser) {
      // Cascades delete: StudentProfile, DailyCheckins, DailyPlans, PlanTasks, TryoutSessions, SessionAnswers, TopicStats, LessonProgress, CalmSessions
      await prisma.user.delete({
        where: { id: demoUser.id },
      });
      console.log(`✓ Demo student (${demoEmail}) reset.`);
    } else {
      console.log("ℹ Demo student not found. Proceeding with clean seed.");
    }
  }

  // Re-run seed
  console.log("\n🌱 Re-running seed to restore clean demo state...");
  await runSeed();
}

main()
  .catch((e) => {
    console.error("❌ Refresh failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
