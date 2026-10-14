import type { TryoutMode } from "@/app/generated/prisma/enums";
import { PRACTICE } from "@/config/practice";

export type ExposureLevel = TryoutMode | "loose" | "full";

export interface TimerPlan {
  limitSeconds: number | null;
  onExpiry: "none" | "prompt" | "finish";
  panicPausesTimer: boolean;
}

export function normalizeLevel(level: ExposureLevel): TryoutMode {
  if (level === "loose") return "timed";
  if (level === "full") return "full_simulation";
  return level;
}

export function getTimerPlan(
  level: ExposureLevel,
  subtestLimitSeconds: number,
  config = PRACTICE,
): TimerPlan {
  const normalized = normalizeLevel(level);
  switch (normalized) {
    case "relaxed":
      return {
        limitSeconds: null,
        onExpiry: "none",
        panicPausesTimer: false,
      };
    case "timed":
      return {
        limitSeconds: Math.round(
          subtestLimitSeconds * config.looseTimeMultiplier,
        ),
        onExpiry: "prompt",
        panicPausesTimer: true,
      };
    case "full_simulation":
      return {
        limitSeconds: subtestLimitSeconds,
        onExpiry: "finish",
        panicPausesTimer: false,
      };
    default:
      return {
        limitSeconds: null,
        onExpiry: "none",
        panicPausesTimer: false,
      };
  }
}

export interface LevelOption {
  level: TryoutMode;
  label: string;
  description: string;
  recommended: boolean;
  recoveryNotice?: string;
}

export function getAllowedLevels(
  mode?: "recovery" | "balanced" | "challenge" | null,
): LevelOption[] {
  const isRecovery = mode === "recovery";
  return [
    {
      level: "relaxed",
      label: "Santai",
      description: "Tanpa timer",
      recommended: isRecovery,
    },
    {
      level: "timed",
      label: "Latihan waktu",
      description: "Timer longgar, berhenti saat Nafas dulu",
      recommended: mode === "balanced",
      recoveryNotice:
        isRecovery ?
          "Di mode Pemulihan, kamu disarankan memilih mode Santai agar tidak menambah tekanan."
        : undefined,
    },
    {
      level: "full_simulation",
      label: "Simulasi penuh",
      description: "Batas waktu asli, timer tetap jalan",
      recommended: mode === "challenge",
      recoveryNotice:
        isRecovery ?
          "Di mode Pemulihan, simulasi penuh mungkin terasa berat hari ini."
        : undefined,
    },
  ];
}
