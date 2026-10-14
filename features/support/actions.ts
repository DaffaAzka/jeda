"use server";

import { getAuthSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import type { SupportAction } from "@/app/generated/prisma/client";

interface RecordSupportEventInput {
  resourceId?: string | null;
  ruleKey: string;
  action: SupportAction;
}

export async function recordSupportEventAction(input: RecordSupportEventInput) {
  const session = await getAuthSession();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const event = await prisma.supportEvent.create({
      data: {
        userId: session.user.id,
        resourceId: input.resourceId ?? null,
        ruleKey: input.ruleKey.slice(0, 60),
        action: input.action,
      },
    });

    return { ok: true, eventId: event.id };
  } catch (err) {
    console.error("Failed to record support event:", err);
    return { ok: false, error: "Failed to record event" };
  }
}
