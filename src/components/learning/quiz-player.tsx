"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, RotateCcw, Award } from "lucide-react";
import { submitQuizAction } from "@/app/actions/quiz";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { id: string; text: string };
type Question = { id: string; text: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; explanation: string | null; options: Option[] };

type SubmitResult = Awaited<ReturnType<typeof submitQuizAction>>;

export function QuizPlayer({ quizId, title, passingScore, questions }: { quizId: string; title: string; passingScore: number; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleOption(question: Question, optionId: string) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.type === "SINGLE_CHOICE") return { ...prev, [question.id]: [optionId] };
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [question.id]: next };
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitQuizAction({ quizId, answers });
      setResult(res);
    });
  }

  function handleRetry() {
    setResult(null);
    setAnswers({});
  }

  const allAnswered = questions.every((q) => (answers[q.id]?.length ?? 0) > 0);

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div
          className={cn(
            "flex items-center gap-4 rounded-xl border p-5",
            result.passed ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
          )}
        >
          {result.passed ? <CheckCircle2 className="size-8 shrink-0 text-success" /> : <XCircle className="size-8 shrink-0 text-warning" />}
          <div>
            <p className="font-heading text-lg font-semibold text-foreground">
              {result.passed ? "You passed!" : "Not quite — try again"}
            </p>
            <p className="text-sm text-muted-foreground">
              Score: {result.score}% ({result.correctCount}/{result.totalQuestions} correct) — passing score is {result.passingScore}%
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {result.questions.map((q) => {
            const isQuestionCorrect =
              q.selected.length === q.correctOptionIds.length && q.selected.every((id) => q.correctOptionIds.includes(id));
            return (
              <div key={q.id} className="rounded-lg border border-border p-4">
                <p className="flex items-start gap-2 font-medium text-foreground">
                  {isQuestionCorrect ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  {q.text}
                </p>
                <ul className="mt-3 flex flex-col gap-1.5 pl-6">
                  {q.options.map((o) => {
                    const wasSelected = q.selected.includes(o.id);
                    const isCorrectOption = q.correctOptionIds.includes(o.id);
                    return (
                      <li
                        key={o.id}
                        className={cn(
                          "rounded-md px-2 py-1 text-sm",
                          isCorrectOption && "font-medium text-success",
                          wasSelected && !isCorrectOption && "text-destructive line-through"
                        )}
                      >
                        {o.text}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && <p className="mt-2 pl-6 text-sm text-muted-foreground">{q.explanation}</p>}
              </div>
            );
          })}
        </div>

        {!result.passed && (
          <Button variant="outline" onClick={handleRetry} className="w-fit gap-1.5">
            <RotateCcw className="size-4" /> Try again
          </Button>
        )}

        {result.justCompleted && result.certificateCode && (
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
            <Award className="size-6 shrink-0 text-accent-foreground" aria-hidden="true" />
            <p className="flex-1 text-sm text-foreground">Course complete! Your certificate is ready.</p>
            <Button asChild size="sm">
              <Link href={`/certificates/${result.certificateCode}`}>View certificate</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {questions.length} question{questions.length === 1 ? "" : "s"} • {passingScore}% to pass
        </p>
      </div>

      {questions.map((question, i) => (
        <div key={question.id} className="rounded-lg border border-border p-4">
          <p className="font-medium text-foreground">
            {i + 1}. {question.text}
          </p>
          {question.type === "SINGLE_CHOICE" ? (
            <RadioGroup
              className="mt-3 flex flex-col gap-2"
              value={answers[question.id]?.[0]}
              onValueChange={(v) => toggleOption(question, v)}
            >
              {question.options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <RadioGroupItem value={o.id} id={o.id} />
                  <Label htmlFor={o.id} className="font-normal">
                    {o.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {question.options.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Checkbox
                    id={o.id}
                    checked={(answers[question.id] ?? []).includes(o.id)}
                    onCheckedChange={() => toggleOption(question, o.id)}
                  />
                  <Label htmlFor={o.id} className="font-normal">
                    {o.text}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={!allAnswered || isPending} className="w-fit">
        {isPending ? "Submitting…" : "Submit quiz"}
      </Button>
    </div>
  );
}
