"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import { checkinFormSchema, type CheckinFormData } from "./schemas";
import { evaluateDailyMode } from "@/lib/rules/daily-mode";
import { generateDailyPlanTasks, type TopicCandidate } from "@/lib/rules/plan-generator";
import type { TaskStatus } from "@/app/generated/prisma/enums";

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

export async function submitCheckinAction(rawData: CheckinFormData) {
  const session = await getAuthSession();
  if (!session) {
    return { error: "Silakan masuk terlebih dahulu." };
  }

  const parsed = checkinFormSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data check-in tidak valid.",
    };
  }

  const data = parsed.data;
  const userId = session.user.id;
  const today = getStartOfToday();

  try {
    // 1. Get or update profile consent
    let profile = await prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: {
          userId,
          wellbeingConsent: data.wellbeingConsent ?? true,
          consentedAt: data.wellbeingConsent ? new Date() : null,
        },
      });
    } else if (data.wellbeingConsent !== undefined && data.wellbeingConsent !== profile.wellbeingConsent) {
      profile = await prisma.studentProfile.update({
        where: { userId },
        data: {
          wellbeingConsent: data.wellbeingConsent,
          consentedAt: data.wellbeingConsent ? new Date() : null,
        },
      });
    }

    const consent = profile.wellbeingConsent;

    // 2. Fetch past 3 days checkin history for referral evaluation
    const recentCheckinsRaw = await prisma.checkin.findMany({
      where: {
        userId,
        checkinDate: { lt: today },
      },
      orderBy: { checkinDate: "desc" },
      take: 2,
      select: { mood: true, stress: true, checkinDate: true },
    });

    // 3. Evaluate Mode via Rule Engine
    const evaluation = evaluateDailyMode(data, recentCheckinsRaw, consent);

    // 4. Save Checkin record only if consent is given (AGENTS.md section 8)
    if (consent) {
      await prisma.checkin.upsert({
        where: {
          userId_checkinDate: {
            userId,
            checkinDate: today,
          },
        },
        update: {
          sleepHours: data.sleepHours,
          energy: data.energy,
          mood: data.mood,
          stress: data.stress,
          note: data.note?.trim() || null,
        },
        create: {
          userId,
          checkinDate: today,
          sleepHours: data.sleepHours,
          energy: data.energy,
          mood: data.mood,
          stress: data.stress,
          note: data.note?.trim() || null,
        },
      });
    }

    // 5. Gather topic candidates from student topicStats or general topics
    const topicStats = await prisma.topicStat.findMany({
      where: { userId },
      orderBy: [{ correct: "asc" }, { attempts: "asc" }],
      take: 4,
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
    });

    let candidates: TopicCandidate[] = topicStats.map((ts) => ({
      id: ts.topic.id,
      name: ts.topic.name,
      attempts: ts.attempts,
      accuracy: ts.attempts > 0 ? (ts.correct / ts.attempts) * 100 : 0,
    }));

    if (candidates.length < 2) {
      const fallbackTopics = await prisma.topic.findMany({
        take: 4,
        select: { id: true, name: true },
      });
      candidates = fallbackTopics.map((t) => ({ id: t.id, name: t.name }));
    }

    // 6. Generate tasks for evaluated mode
    const taskPlans = generateDailyPlanTasks(evaluation.mode, candidates);

    // 7. Upsert DailyPlan and replace tasks atomically
    await prisma.$transaction(async (tx) => {
      const plan = await tx.dailyPlan.upsert({
        where: {
          userId_planDate: {
            userId,
            planDate: today,
          },
        },
        update: {
          mode: evaluation.mode,
          ruleKey: evaluation.ruleKey,
          reason: evaluation.reason,
        },
        create: {
          userId,
          planDate: today,
          mode: evaluation.mode,
          ruleKey: evaluation.ruleKey,
          reason: evaluation.reason,
        },
      });

      // Clear previous tasks for today's plan
      await tx.planTask.deleteMany({
        where: { dailyPlanId: plan.id },
      });

      // Create new tasks
      for (const t of taskPlans) {
        await tx.planTask.create({
          data: {
            dailyPlanId: plan.id,
            type: t.type,
            title: t.title,
            reason: t.reason,
            estMinutes: t.estMinutes,
            sortOrder: t.sortOrder,
            topicId: t.topicId,
            status: "pending",
          },
        });
      }
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      mode: evaluation.mode,
      isReferralTriggered: evaluation.isReferralTriggered,
    };
  } catch (err) {
    console.error("Check-in submission failed:", err);
    return { error: "Gagal menyimpan check-in. Cek koneksi lalu coba lagi." };
  }
}

export async function toggleTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus,
) {
  const session = await getAuthSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const task = await prisma.planTask.findUnique({
      where: { id: taskId },
      include: { dailyPlan: true },
    });

    if (!task || task.dailyPlan.userId !== session.user.id) {
      return { error: "Tugas tidak ditemukan." };
    }

    await prisma.planTask.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to toggle task status:", err);
    return { error: "Gagal mengubah status tugas." };
  }
}

export async function swapTaskAction(taskId: string) {
  const session = await getAuthSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const task = await prisma.planTask.findUnique({
      where: { id: taskId },
      include: { dailyPlan: true },
    });

    if (!task || task.dailyPlan.userId !== session.user.id) {
      return { error: "Tugas tidak ditemukan." };
    }

    // Pick an alternative topic
    const currentTopicId = task.topicId;
    const alternativeTopic = await prisma.topic.findFirst({
      where: currentTopicId ? { id: { not: currentTopicId } } : {},
      select: { id: true, name: true },
    });

    const isRestSwap = task.type === "practice";

    await prisma.planTask.update({
      where: { id: taskId },
      data: {
        type: isRestSwap ? "review" : "practice",
        title: alternativeTopic
          ? `Latihan Pilihan: ${alternativeTopic.name}`
          : "Latihan Alternatif Soal Pilihan",
        reason: "Tugas diganti sesuai kenyamanan ritme belajarmu hari ini.",
        topicId: alternativeTopic?.id ?? null,
        status: "pending",
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to swap task:", err);
    return { error: "Gagal menukar tugas." };
  }
}
