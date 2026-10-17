"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-session";
import type { CalmTool, CalmTrigger } from "@/app/generated/prisma/enums";
import { reframeThoughtLocally, type ReframedThoughtResult } from "@/lib/cbt/thought-reframe";

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

export async function reframeThoughtAction(
  thought: string,
): Promise<{ ok: boolean; data?: ReframedThoughtResult; error?: string }> {
  const session = await getAuthSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const clean = thought?.trim();
  if (!clean || clean.length < 3) {
    return { ok: false, error: "Tuliskan sedikit pikiran atau hal yang sedang membuatmu cemas." };
  }

  if (clean.length > 350) {
    return { ok: false, error: "Pikiran terlalu panjang (maksimal 350 karakter)." };
  }

  try {
    const result = reframeThoughtLocally(clean);
    return { ok: true, data: result };
  } catch (err) {
    console.error("Reframing action error:", err);
    return { ok: false, error: "Gagal memproses reframing saat ini. Coba lagi nanti." };
  }
}
