"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";

async function assertOwnsQuiz(quizId: string) {
  const user = await requireRole("INSTRUCTOR", "ADMIN");
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { lesson: { select: { courseId: true, course: { select: { instructorId: true } } } } },
  });
  if (!quiz) throw new Error("Quiz not found.");
  if (quiz.lesson.course.instructorId !== user.id && user.role !== "ADMIN") {
    throw new Error("You don't have permission to edit this quiz.");
  }
  return quiz.lesson.courseId;
}

const addQuestionSchema = z.object({
  quizId: z.string().min(1),
  text: z.string().trim().min(5, "Question must be at least 5 characters."),
  // .nullish() not .optional() — this form has no explanation input, so
  // formData.get("explanation") is null, not undefined (see the identical
  // note on videoId in schemas/course.ts).
  explanation: z.string().trim().max(500).nullish(),
  options: z
    .array(z.string().trim().min(1))
    .min(2, "Add at least 2 answer options.")
    .max(6, "At most 6 answer options."),
  correctIndex: z.coerce.number().int().min(0),
});

export type QuizBuilderFormState = { errors?: Record<string, string[]>; formError?: string } | null;

export async function addQuizQuestionAction(_prev: QuizBuilderFormState, formData: FormData): Promise<QuizBuilderFormState> {
  const parsed = addQuestionSchema.safeParse({
    quizId: formData.get("quizId"),
    text: formData.get("text"),
    explanation: formData.get("explanation"),
    options: formData.getAll("options").filter((v) => String(v).trim().length > 0),
    correctIndex: formData.get("correctIndex"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  if (parsed.data.correctIndex >= parsed.data.options.length) {
    return { formError: "Select which option is correct." };
  }

  const courseId = await assertOwnsQuiz(parsed.data.quizId);
  const order = await prisma.quizQuestion.count({ where: { quizId: parsed.data.quizId } });

  const question = await prisma.quizQuestion.create({
    data: {
      quizId: parsed.data.quizId,
      text: parsed.data.text,
      explanation: parsed.data.explanation || null,
      type: "SINGLE_CHOICE",
      order,
    },
  });

  await prisma.quizOption.createMany({
    data: parsed.data.options.map((text, i) => ({
      questionId: question.id,
      text,
      isCorrect: i === parsed.data.correctIndex,
      order: i,
    })),
  });

  revalidatePath(`/instructor/courses/${courseId}/edit`);
  return null;
}

export async function deleteQuizQuestionAction(questionId: string) {
  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: { quizId: true },
  });
  if (!question) throw new Error("Question not found.");
  const courseId = await assertOwnsQuiz(question.quizId);
  await prisma.quizQuestion.delete({ where: { id: questionId } });
  revalidatePath(`/instructor/courses/${courseId}/edit`);
}
