import { RULES } from "@/config/rules";
import type { DayMode } from "@/app/generated/prisma/enums";

export interface CheckinInput {
  sleepHours: number;
  energy: number;
  mood: number;
  stress: number;
}

export interface HistoricalCheckin {
  mood: number;
  stress: number;
  checkinDate: Date;
}

export interface ModeEvaluationResult {
  mode: DayMode;
  ruleKey: string;
  reason: string;
  isReferralTriggered: boolean;
}

export function evaluateDailyMode(
  input: CheckinInput,
  recentHistory: HistoricalCheckin[] = [],
  wellbeingConsent = true,
): ModeEvaluationResult {
  // Without consent, daily mode stays fixed to balanced (AGENTS.md section 8)
  if (!wellbeingConsent) {
    return {
      mode: "balanced",
      ruleKey: "no_consent",
      reason: "Persetujuan data kondisi harian belum aktif. Mode belajar disetel ke Seimbang.",
      isReferralTriggered: false,
    };
  }

  // 1. Check Referral Rule: 3 consecutive days of low mood (<= 2) and high stress (>= 4)
  let isReferralTriggered = false;
  const isTodayHighStrain =
    input.mood <= RULES.referral.moodAtMost &&
    input.stress >= RULES.referral.stressAtLeast;

  if (isTodayHighStrain && recentHistory.length >= 2) {
    const prevDay1 = recentHistory[0];
    const prevDay2 = recentHistory[1];

    const prev1HighStrain =
      prevDay1 &&
      prevDay1.mood <= RULES.referral.moodAtMost &&
      prevDay1.stress >= RULES.referral.stressAtLeast;

    const prev2HighStrain =
      prevDay2 &&
      prevDay2.mood <= RULES.referral.moodAtMost &&
      prevDay2.stress >= RULES.referral.stressAtLeast;

    if (prev1HighStrain && prev2HighStrain) {
      isReferralTriggered = true;
    }
  }

  // 2. Recovery Rule: sleep < 5 OR stress >= 4
  if (
    input.sleepHours < RULES.recovery.sleepBelowHours ||
    input.stress >= RULES.recovery.stressAtLeast
  ) {
    const reason =
      input.sleepHours < RULES.recovery.sleepBelowHours
        ? `Tidurmu ${input.sleepHours} jam, jadi hari ini kita fokus latihan ringan dan ulasan konsep santai.`
        : "Tingkat beban pikiranmu sedang tinggi. Hari ini disarankan istirahat aktif dan latihan ringan tanpa tekanan waktu.";

    return {
      mode: "recovery",
      ruleKey: "recovery",
      reason,
      isReferralTriggered,
    };
  }

  // 3. Challenge Rule: sleep >= 7 AND energy >= 4 AND stress <= 2
  if (
    input.sleepHours >= RULES.challenge.sleepAtLeastHours &&
    input.energy >= RULES.challenge.energyAtLeast &&
    input.stress <= RULES.challenge.stressAtMost
  ) {
    return {
      mode: "challenge",
      ruleKey: "challenge",
      reason:
        "Tidur cukup dan energimu prima hari ini. Waktu yang tepat untuk simulasi penuh atau mengerjakan target soal menantang!",
      isReferralTriggered,
    };
  }

  // 4. Default: Balanced
  return {
    mode: "balanced",
    ruleKey: "balanced",
    reason:
      "Kondisimu dalam ritme stabil. Jaga konsistensi dengan latihan terarah dan ulasan topik harian.",
    isReferralTriggered,
  };
}
