import type { ErrorCause } from "@/app/generated/prisma";
import { RULES } from "@/config/rules";

export interface GuessErrorTagInput {
  isCorrect: boolean;
  isAnswered: boolean;
  elapsedSeconds: number;
  secondsSpent?: number;
  timeLimitSeconds: number | null;
  averagePaceSeconds?: number;
}

/**
 * Pure heuristic function for estimating initial error tag cause:
 * - A wrong answer saved in the final window (default 900s) of a timed session -> out_of_time
 * - An unanswered question in a timed session -> out_of_time
 * - An answer submitted much faster than the student's pace in this session -> careless
 * - Otherwise -> didnt_know
 * - Note: "panic" is never guessed automatically. Only the student can tag panic.
 */
export function guessErrorTag(
  input: GuessErrorTagInput,
  thresholds = RULES.autopsy,
): ErrorCause | null {
  if (input.isCorrect) {
    return null;
  }

  // Unanswered questions in timed sessions are due to running out of time
  if (!input.isAnswered) {
    if (input.timeLimitSeconds !== null && input.timeLimitSeconds > 0) {
      return "out_of_time";
    }
    return "didnt_know";
  }

  // Answered in the last window of a timed session
  if (input.timeLimitSeconds !== null && input.timeLimitSeconds > 0) {
    const timeRemaining = input.timeLimitSeconds - input.elapsedSeconds;
    if (timeRemaining <= thresholds.lastWindowSeconds) {
      return "out_of_time";
    }
  }

  // Answered much faster than the session pace
  const pace = input.secondsSpent ?? input.elapsedSeconds;
  if (
    input.averagePaceSeconds !== undefined &&
    input.averagePaceSeconds > 0 &&
    pace > 0 &&
    pace < input.averagePaceSeconds * thresholds.quickAnswerShare
  ) {
    return "careless";
  }

  return "didnt_know";
}
