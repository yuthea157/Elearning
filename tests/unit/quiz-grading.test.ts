import { describe, it, expect } from "vitest";
import { gradeQuestion, calculateQuizScore, didPassQuiz } from "@/lib/services/quiz-grading";

const singleChoiceQuestion = {
  id: "q1",
  options: [
    { id: "a", isCorrect: true },
    { id: "b", isCorrect: false },
    { id: "c", isCorrect: false },
  ],
};

const multiChoiceQuestion = {
  id: "q2",
  options: [
    { id: "x", isCorrect: true },
    { id: "y", isCorrect: true },
    { id: "z", isCorrect: false },
  ],
};

describe("gradeQuestion", () => {
  it("marks the exact correct single-choice answer as correct", () => {
    expect(gradeQuestion(singleChoiceQuestion, ["a"]).isCorrect).toBe(true);
  });

  it("marks a wrong single-choice answer as incorrect", () => {
    expect(gradeQuestion(singleChoiceQuestion, ["b"]).isCorrect).toBe(false);
  });

  it("marks no answer as incorrect", () => {
    expect(gradeQuestion(singleChoiceQuestion, []).isCorrect).toBe(false);
  });

  it("requires the exact correct set for multi-choice — partial selection is wrong", () => {
    expect(gradeQuestion(multiChoiceQuestion, ["x"]).isCorrect).toBe(false);
  });

  it("requires the exact correct set for multi-choice — over-selection is wrong", () => {
    expect(gradeQuestion(multiChoiceQuestion, ["x", "y", "z"]).isCorrect).toBe(false);
  });

  it("accepts the exact correct multi-choice set regardless of order", () => {
    expect(gradeQuestion(multiChoiceQuestion, ["y", "x"]).isCorrect).toBe(true);
  });

  it("ignores duplicate selections of the same option", () => {
    expect(gradeQuestion(singleChoiceQuestion, ["a", "a"]).isCorrect).toBe(true);
  });

  it("does not let a client submit an unknown option id and pass", () => {
    expect(gradeQuestion(singleChoiceQuestion, ["a", "does-not-exist"]).isCorrect).toBe(false);
  });
});

describe("calculateQuizScore", () => {
  it("scores 100 when every question is answered correctly", () => {
    const result = calculateQuizScore([singleChoiceQuestion, multiChoiceQuestion], { q1: ["a"], q2: ["x", "y"] });
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(2);
  });

  it("scores 0 when nothing is answered", () => {
    const result = calculateQuizScore([singleChoiceQuestion, multiChoiceQuestion], {});
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
  });

  it("rounds a partial score to the nearest whole percent", () => {
    // 1 of 3 correct = 33.33% -> rounds to 33
    const q3 = { id: "q3", options: [{ id: "d", isCorrect: true }] };
    const result = calculateQuizScore([singleChoiceQuestion, multiChoiceQuestion, q3], { q1: ["a"] });
    expect(result.score).toBe(33);
  });

  it("treats a quiz with zero questions as a 0 score, not NaN or a crash", () => {
    const result = calculateQuizScore([], {});
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
  });
});

describe("didPassQuiz", () => {
  it("passes when the score meets the passing threshold exactly", () => {
    expect(didPassQuiz(70, 70)).toBe(true);
  });

  it("fails when the score is one point under the threshold", () => {
    expect(didPassQuiz(69, 70)).toBe(false);
  });

  it("passes when the score exceeds the threshold", () => {
    expect(didPassQuiz(100, 70)).toBe(true);
  });
});
