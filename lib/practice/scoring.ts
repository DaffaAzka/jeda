export interface AnswerEvaluationInput {
  questionId: string;
  topicId: string;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  elapsedSeconds: number;
}

export interface EvaluatedAnswer {
  questionId: string;
  topicId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
  isAnswered: boolean;
  elapsedSeconds: number;
}

export interface TopicStatDelta {
  topicId: string;
  attempts: number;
  correct: number;
}

export interface SessionScoreSummary {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  unansweredCount: number;
  scorePercentage: number;
  topicDeltas: TopicStatDelta[];
}

/**
 * Pure scoring function:
 * - Calculates correctness for each question
 * - Accumulates topic stats: ONLY answered questions count as attempts
 * - Unanswered questions are counted as not correct
 * - Returns clean summary for storage and presentation
 */
export function evaluateSessionAnswers(
  answers: AnswerEvaluationInput[],
): {
  evaluatedAnswers: EvaluatedAnswer[];
  summary: SessionScoreSummary;
} {
  const evaluatedAnswers: EvaluatedAnswer[] = [];
  const topicMap = new Map<string, { attempts: number; correct: number }>();

  let correctCount = 0;
  let answeredCount = 0;

  for (const ans of answers) {
    const isAnswered = ans.selectedOptionId !== null;
    const isCorrect =
      isAnswered &&
      ans.correctOptionId !== null &&
      ans.selectedOptionId === ans.correctOptionId;

    if (isAnswered) answeredCount++;
    if (isCorrect) correctCount++;

    evaluatedAnswers.push({
      questionId: ans.questionId,
      topicId: ans.topicId,
      selectedOptionId: ans.selectedOptionId,
      isCorrect,
      isAnswered,
      elapsedSeconds: ans.elapsedSeconds,
    });

    if (isAnswered) {
      const current = topicMap.get(ans.topicId) ?? { attempts: 0, correct: 0 };
      current.attempts += 1;
      if (isCorrect) {
        current.correct += 1;
      }
      topicMap.set(ans.topicId, current);
    }
  }

  const totalQuestions = answers.length;
  const unansweredCount = totalQuestions - answeredCount;
  const scorePercentage =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100 * 100) / 100
      : 0;

  const topicDeltas: TopicStatDelta[] = Array.from(
    topicMap.entries(),
  ).map(([topicId, stats]) => ({
    topicId,
    attempts: stats.attempts,
    correct: stats.correct,
  }));

  return {
    evaluatedAnswers,
    summary: {
      totalQuestions,
      answeredCount,
      correctCount,
      unansweredCount,
      scorePercentage,
      topicDeltas,
    },
  };
}
