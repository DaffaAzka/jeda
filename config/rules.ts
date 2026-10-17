export const RULES = {
  recovery: { sleepBelowHours: 5, stressAtLeast: 4 },
  challenge: { sleepAtLeastHours: 7, energyAtLeast: 4, stressAtMost: 2 },
  referral: { consecutiveDays: 3, moodAtMost: 2, stressAtLeast: 4 },
  restSuggestion: { consecutiveDays: 2 },
  gradedExposure: { panicOrTimeoutShare: 0.4, recentTryouts: 3 },
  insights: { minCheckins: 7 },
  autopsy: { lastWindowSeconds: 900, quickAnswerShare: 0.5 },
  learning: { shortLessonMinutes: 10 },
} as const;
