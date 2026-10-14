"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import type { CalmTool, CalmTrigger } from "@/app/generated/prisma/enums";

export async function saveCalmSessionAction({
  tool,
  triggerSource = "manual",
  durationSeconds = 60,
  note = null,
}: {
  tool: CalmTool;
  triggerSource?: CalmTrigger;
  durationSeconds?: number;
  note?: string | null;
}) {
  const session = await getAuthSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: { wellbeingConsent: true },
    });

    // Only record sensitive calm session if consent is on (AGENTS.md section 8 & 9)
    if (profile?.wellbeingConsent) {
      await prisma.calmSession.create({
        data: {
          userId: session.user.id,
          tool,
          triggerSource,
          durationSeconds,
          note: note?.trim() || null,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calm");
    return { success: true };
  } catch (err) {
    console.error("Failed to save calm session:", err);
    return { error: "Gagal menyimpan sesi tenang." };
  }
}
