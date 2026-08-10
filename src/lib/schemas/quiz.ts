import { z } from "zod";

export const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  // Maps questionId -> array of selected option ids (single-choice
  // questions will just have one entry).
  answers: z.record(z.string(), z.array(z.string())),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
