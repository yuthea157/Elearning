/**
 * Pure quiz-grading logic — no Prisma, no I/O — so it can be unit tested
 * directly. `submitQuizAction` (src/app/actions/quiz.ts) is the only
 * caller in the app; everything here operates on plain data it's handed.
 */

export type GradableQuestion = {
  id: string;
  options: { id: string; isCorrect: boolean }[];
};

export type QuestionGrade = { questionId: string; isCorrect: boolean; selectedIds: string[] };

/** A question is correct only if the selected set is *exactly* the
 * correct set — for a MULTIPLE_CHOICE question, picking 2 of 3 correct
 * options isn't partial credit, matching how the quiz-builder UI presents
 * "which options are correct" as a single all-or-nothing set per
 * question. */
export function gradeQuestion(question: GradableQuestion, selectedOptionIds: string[]): QuestionGrade {
  const selectedIds = new Set(selectedOptionIds);
  const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
  const isCorrect = selectedIds.size === correctIds.size && [...selectedIds].every((id) => correctIds.has(id));
  return { questionId: question.id, isCorrect, selectedIds: [...selectedIds] };
}

export function calculateQuizScore(questions: GradableQuestion[], answers: Record<string, string[]>) {
  const grades = questions.map((q) => gradeQuestion(q, answers[q.id] ?? []));
  const correctCount = grades.filter((g) => g.isCorrect).length;
  const score = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);
  return { grades, correctCount, score };
}

export function didPassQuiz(score: number, passingScore: number) {
  return score >= passingScore;
}
