"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { submitQuizSchema, type SubmitQuizInput } from "@/lib/schemas/quiz";
import { recomputeCourseProgress } from "@/lib/services/progress";
import { calculateQuizScore, didPassQuiz } from "@/lib/services/quiz-grading";

/**
 * Quiz results are graded here, server-side, from the questions/options
 * actually stored in the database — never trusting a score the client
 * claims to have computed (brief section 15: "Quiz results must be
 * validated server-side").
 */
export async function submitQuizAction(input: SubmitQuizInput) {
  const { userId } = await verifySession();
  const { quizId, answers } = submitQuizSchema.parse(input);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { include: { options: true } },
      lesson: { select: { id: true, courseId: true, course: { select: { slug: true } } } },
    },
  });
  if (!quiz) throw new Error("Quiz not found.");

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: quiz.lesson.courseId } },
  });
  if (!enrolled) throw new Error("Not enrolled in this course.");

  const attempt = await prisma.quizAttempt.create({
    data: { quizId, userId, status: "SUBMITTED", submittedAt: new Date() },
  });

  const { grades, correctCount, score } = calculateQuizScore(quiz.questions, answers);
  const passed = didPassQuiz(score, quiz.passingScore);

  await Promise.all(
    grades.map((grade) =>
      prisma.quizAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: grade.questionId,
          selectedOptions: { connect: grade.selectedIds.map((id) => ({ id })) },
        },
      })
    )
  );

  await prisma.quizAttempt.update({ where: { id: attempt.id }, data: { score, passed } });

  let justCompleted = false;
  let certificateCode: string | undefined;
  if (passed) {
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId: quiz.lesson.id } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: {
        userId,
        lessonId: quiz.lesson.id,
        courseId: quiz.lesson.courseId,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    const result = await recomputeCourseProgress(userId, quiz.lesson.courseId, quiz.lesson.id);
    justCompleted = result.justCompleted;
    certificateCode = result.certificateCode;
  }

  revalidatePath(`/learn/${quiz.lesson.course.slug}/${quiz.lesson.id}`);
  revalidatePath("/dashboard");

  return {
    score,
    passed,
    passingScore: quiz.passingScore,
    correctCount,
    totalQuestions: quiz.questions.length,
    justCompleted,
    certificateCode,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      explanation: q.explanation,
      selected: [...(answers[q.id] ?? [])],
      correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
      options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}
