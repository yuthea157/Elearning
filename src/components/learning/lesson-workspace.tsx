"use client";

import { useRef, useState } from "react";
import { FileText, Download } from "lucide-react";
import { YouTubePlayer } from "@/components/learning/video-player";
import { QuizPlayer } from "@/components/learning/quiz-player";
import { TranscriptPanel } from "@/components/learning/transcript-panel";
import { NotesPanel, type NoteData } from "@/components/learning/notes-panel";
import { MarkCompleteButton } from "@/components/learning/mark-complete-button";
import { updateVideoPositionAction } from "@/app/actions/learning";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LessonWorkspaceProps = {
  lesson: {
    id: string;
    title: string;
    description: string | null;
    type: "VIDEO" | "QUIZ" | "ARTICLE" | "RESOURCE";
    video: { externalId: string | null } | null;
    transcript: { segments: { id: string; order: number; startSeconds: number; text: string }[] } | null;
    quiz: {
      id: string;
      title: string;
      passingScore: number;
      questions: {
        id: string;
        text: string;
        type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
        explanation: string | null;
        options: { id: string; text: string }[];
      }[];
    } | null;
    resources: { id: string; title: string; fileUrl: string; fileType: string }[];
  };
  courseSlug: string;
  initialPositionSeconds: number;
  notes: NoteData[];
  isCompleted: boolean;
};

export function LessonWorkspace({ lesson, courseSlug, initialPositionSeconds, notes, isCompleted }: LessonWorkspaceProps) {
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const seekRef = useRef<((seconds: number) => void) | null>(null);

  function handleSeek(seconds: number) {
    seekRef.current?.(seconds);
    setCurrentTime(seconds);
  }

  const hasTranscript = (lesson.transcript?.segments.length ?? 0) > 0;
  const hasResources = lesson.resources.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {lesson.type === "QUIZ" && lesson.quiz ? (
        <QuizPlayer quizId={lesson.quiz.id} title={lesson.quiz.title} passingScore={lesson.quiz.passingScore} questions={lesson.quiz.questions} />
      ) : (
        <>
          {lesson.video?.externalId && (
            <YouTubePlayer
              videoId={lesson.video.externalId}
              startSeconds={initialPositionSeconds}
              onProgress={(seconds) => {
                setCurrentTime(seconds);
                void updateVideoPositionAction({ lessonId: lesson.id, positionSeconds: seconds });
              }}
              onEnded={() => void updateVideoPositionAction({ lessonId: lesson.id, positionSeconds: 0 })}
              registerSeek={(seek) => {
                seekRef.current = seek;
              }}
            />
          )}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-xl font-semibold text-foreground">{lesson.title}</h1>
              {lesson.description && <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>}
            </div>
            <MarkCompleteButton lessonId={lesson.id} isCompleted={isCompleted} />
          </div>

          <Tabs defaultValue={hasTranscript ? "transcript" : "notes"}>
            <TabsList>
              {hasTranscript && <TabsTrigger value="transcript">Transcript</TabsTrigger>}
              <TabsTrigger value="notes">Notes</TabsTrigger>
              {hasResources && <TabsTrigger value="resources">Resources</TabsTrigger>}
            </TabsList>
            {hasTranscript && (
              <TabsContent value="transcript" className="pt-4">
                <TranscriptPanel segments={lesson.transcript!.segments} currentTimeSeconds={currentTime} onSeek={handleSeek} />
              </TabsContent>
            )}
            <TabsContent value="notes" className="pt-4">
              <NotesPanel notes={notes} lessonId={lesson.id} courseSlug={courseSlug} currentTimeSeconds={currentTime} onSeek={handleSeek} />
            </TabsContent>
            {hasResources && (
              <TabsContent value="resources" className="pt-4">
                <ul className="flex flex-col gap-2">
                  {lesson.resources.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-secondary"
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="flex-1 text-foreground">{r.title}</span>
                        <Download className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}
