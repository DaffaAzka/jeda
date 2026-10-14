export interface CandidateOption {
  id?: string;
  body?: string;
  isCorrect: boolean;
}

export interface CandidateQuestion {
  id: string;
  isPublished?: boolean;
  stem?: string | null;
  options: CandidateOption[];
}

/**
 * Validates whether a question is fully ready for practice/tryout sessions:
 * - Must be published (if isPublished flag is provided)
 * - Must have valid stem content
 * - Must have between 2 and 5 options
 * - Must have exactly 1 correct option
 */
export function isQuestionReady(question: CandidateQuestion): boolean {
  if (question.isPublished !== undefined && !question.isPublished) {
    return false;
  }

  if (question.stem !== undefined && question.stem !== null) {
    const trimmed = question.stem.trim();
    if (!trimmed || trimmed === '{"type":"doc","content":[{"type":"paragraph"}]}') {
      return false;
    }
  }

  if (!Array.isArray(question.options)) {
    return false;
  }

  const optionCount = question.options.length;
  if (optionCount < 2 || optionCount > 5) {
    return false;
  }

  const correctCount = question.options.filter((opt) => opt.isCorrect).length;
  if (correctCount !== 1) {
    return false;
  }

  return true;
}
