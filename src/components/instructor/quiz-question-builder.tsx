"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, Trash2, Plus, X } from "lucide-react";
import { addQuizQuestionAction, deleteQuizQuestionAction, type QuizBuilderFormState } from "@/app/actions/quiz-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Question = { id: string; text: string; options: { id: string; text: string; isCorrect: boolean }[] };

export function QuizQuestionBuilder({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quiz questions</p>

      {questions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start gap-2 rounded-md bg-secondary/50 p-2 text-sm">
              <span className="flex-1">
                <span className="font-medium text-foreground">
                  {i + 1}. {q.text}
                </span>
                <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                  {q.options.map((o) => (
                    <li key={o.id} className={o.isCorrect ? "flex items-center gap-1 text-success" : "text-muted-foreground"}>
                      {o.isCorrect && <CheckCircle2 className="size-3" />} {o.text}
                    </li>
                  ))}
                </ul>
              </span>
              <button
                type="button"
                onClick={() => startTransition(() => deleteQuizQuestionAction(q.id))}
                aria-label="Delete question"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Keyed by questions.length so a successful add (which grows the
          array via revalidation) remounts this with fresh local state,
          instead of resetting it imperatively from an effect. */}
      <AddQuestionForm key={questions.length} quizId={quizId} />
    </div>
  );
}

function AddQuestionForm({ quizId }: { quizId: string }) {
  const [state, formAction, isPending] = useActionState<QuizBuilderFormState, FormData>(addQuizQuestionAction, null);
  const [optionCount, setOptionCount] = useState(3);
  const [correctIndex, setCorrectIndex] = useState("0");

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
      <input type="hidden" name="quizId" value={quizId} />
      {state?.formError && <p className="text-sm text-destructive">{state.formError}</p>}
      <Input name="text" placeholder="Question text" required />
      {state?.errors?.text && <p className="text-sm text-destructive">{state.errors.text[0]}</p>}

      <RadioGroup value={correctIndex} onValueChange={setCorrectIndex} name="correctIndex" className="flex flex-col gap-1.5">
        {Array.from({ length: optionCount }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <RadioGroupItem value={String(i)} id={`opt-${quizId}-${i}`} aria-label={`Option ${i + 1} is correct`} />
            <Input name="options" placeholder={`Option ${i + 1}`} required />
            {optionCount > 2 && i === optionCount - 1 && (
              <button
                type="button"
                onClick={() => setOptionCount((c) => Math.max(2, c - 1))}
                aria-label="Remove option"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ))}
      </RadioGroup>
      {state?.errors?.options && <p className="text-sm text-destructive">{state.errors.options[0]}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOptionCount((c) => Math.min(6, c + 1))}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
          disabled={optionCount >= 6}
        >
          <Plus className="size-3.5" /> Add option
        </button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding…" : "Add question"}
        </Button>
      </div>
    </form>
  );
}
