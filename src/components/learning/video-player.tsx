"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};

let apiLoadPromise: Promise<void> | null = null;
function loadYouTubeApi() {
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiLoadPromise;
}

/**
 * Provider-agnostic at the call site (see docs/ARCHITECTURE.md "Video
 * architecture") — this component is the YOUTUBE adapter specifically.
 * A different Video.provider would render a different player component,
 * chosen by the caller, not branched on inside this file.
 */
export function YouTubePlayer({
  videoId,
  startSeconds,
  onProgress,
  onEnded,
  registerSeek,
}: {
  videoId: string;
  startSeconds: number;
  onProgress: (seconds: number) => void;
  onEnded: () => void;
  /** Called once the player is ready with a function that seeks the video
   * to a given timestamp — lets sibling panels (transcript, notes) jump
   * playback without this component knowing they exist. */
  registerSeek?: (seek: (seconds: number) => void) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const registerSeekRef = useRef(registerSeek);

  useLayoutEffect(() => {
    onProgressRef.current = onProgress;
    onEndedRef.current = onEnded;
    registerSeekRef.current = registerSeek;
  });

  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      const player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { start: Math.floor(startSeconds), rel: 0 },
        events: {
          onReady: () => {
            playerRef.current = player;
            registerSeekRef.current?.((seconds) => player.seekTo(seconds, true));
            pollInterval = setInterval(() => {
              const t = player.getCurrentTime();
              if (Number.isFinite(t)) onProgressRef.current(Math.floor(t));
            }, 10_000);
          },
          onStateChange: (e) => {
            if (e.data === window.YT?.PlayerState.ENDED) onEndedRef.current();
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // videoId change = a real new lesson; start fresh rather than reusing the player instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
