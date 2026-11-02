"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { listeningApi, pocketApi, Word } from "@/lib/api";
import { buildTimestampLink, formatTime, parseMemoTimestamp, parseVideoId } from "@/lib/youtube";
import { fieldClass, secondaryButtonClass } from "@/lib/ui";
import Toast from "@/components/Toast";
import AiExpressionPanel from "@/components/AiExpressionPanel";
import { apiErrorMessage } from "@/lib/messages";

// ─── YouTube IFrame Player API (minimal typings) ──────────────────────────────

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setPlaybackRate(rate: number): void;
  getVideoData?(): { title?: string };
  destroy(): void;
}

interface YTNamespace {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    playerVars?: Record<string, number>;
    events?: {
      onReady?: () => void;
      onStateChange?: (event: { data: number }) => void;
      onError?: (event: { data: number }) => void;
    };
  }) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYING = 1;
const PAUSED = 2;
const RATES = [0.75, 1, 1.25];
const POSITION_SAVE_INTERVAL = 15; // seconds of playback between resume-point saves
// Same margin on both sides in landscape so the video stays centered (the notch/Dynamic Island is on one side only)
const SAFE_SIDE = "max(env(safe-area-inset-left), env(safe-area-inset-right))";

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT as YTNamespace);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ListeningVideoDetail() {
  const params = useParams<{ videoId: string }>();
  const searchParams = useSearchParams();
  const videoId = parseVideoId(params.videoId ?? "");

  const [title, setTitle]       = useState<string | null>(null);
  const [startAt, setStartAt]   = useState<number | null>(null);
  const [ready, setReady]       = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [rate, setRate]         = useState(1);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent]   = useState(0);
  const [playerError, setPlayerError] = useState(false);

  const [english, setEnglish]   = useState("");
  const [korean, setKorean]     = useState("");
  const [memo, setMemo]         = useState("");
  const [capturedAt, setCapturedAt] = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved]       = useState<Word[]>([]);
  const [flashId, setFlashId]   = useState<number | null>(null);
  const [toast, setToast]       = useState("");
  const [immersive, setImmersive] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const clearToast = useCallback(() => setToast(""), []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const resumeAfterSaveRef = useRef(false);
  const lastSavedPositionRef = useRef(0);
  const knownTitleRef = useRef<string | null>(null);

  const savePosition = useCallback(() => {
    const player = playerRef.current;
    if (!player || !videoId) return;
    const seconds = player.getCurrentTime();
    lastSavedPositionRef.current = seconds;
    listeningApi.savePosition(videoId, seconds).catch(() => {});
  }, [videoId]);

  // Register the visit and decide where to start: ?t= from a pocket link, else the resume point
  useEffect(() => {
    if (!videoId) return;
    const fromLink = Number(searchParams.get("t"));
    listeningApi.open(videoId)
      .then((res) => {
        knownTitleRef.current = res.data.title;
        setTitle(res.data.title);
        setStartAt(fromLink > 0 ? fromLink : res.data.lastPositionSeconds);
      })
      .catch(() => setStartAt(fromLink > 0 ? fromLink : 0));
    pocketApi.getAll()
      .then((res) => setSaved(res.data.filter((w) => parseMemoTimestamp(w.memo)?.videoId === videoId)))
      .catch(() => {});
  }, [videoId, searchParams]);

  // Create the player once the start position is known
  useEffect(() => {
    if (!videoId || startAt === null || !wrapperRef.current) return;
    let cancelled = false;
    const wrapper = wrapperRef.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      // The API replaces the target element with an iframe, so give it a node React does not manage
      const target = document.createElement("div");
      wrapper.appendChild(target);
      lastSavedPositionRef.current = startAt;
      playerRef.current = new YT.Player(target, {
        videoId,
        // fs: 0 hides YouTube's fullscreen button — on iPhone it switches to the native player, which drops captions
        playerVars: { playsinline: 1, rel: 0, fs: 0, start: Math.floor(startAt) },
        events: {
          onReady: () => {
            setReady(true);
            const playerTitle = playerRef.current?.getVideoData?.()?.title;
            if (playerTitle && playerTitle !== knownTitleRef.current) {
              knownTitleRef.current = playerTitle;
              setTitle(playerTitle);
              listeningApi.open(videoId, playerTitle).catch(() => {});
            }
          },
          onStateChange: (e) => {
            setPlaying(e.data === PLAYING);
            if (e.data === PAUSED) savePosition();
          },
          onError: () => setPlayerError(true),
        },
      });
    });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        savePosition();
        playerRef.current.destroy();
        playerRef.current = null;
      }
      wrapper.innerHTML = "";
    };
  }, [videoId, startAt, savePosition]);

  // Timeline sync + periodic resume-point save while playing
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const now = player.getCurrentTime();
      setCurrent(now);
      setDuration(player.getDuration());
      if (player.getPlayerState() === PLAYING && Math.abs(now - lastSavedPositionRef.current) >= POSITION_SAVE_INTERVAL) {
        savePosition();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [ready, savePosition]);

  // Rotating the phone to landscape fills the screen with our own player, so YouTube captions stay visible
  useEffect(() => {
    const landscape = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const sync = () => setImmersive(landscape.matches);
    sync();
    landscape.addEventListener("change", sync);
    return () => landscape.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!immersive) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [immersive]);

  const currentTime = () => playerRef.current?.getCurrentTime() ?? 0;

  // AI panel: pause like the manual form and report where the sentence was heard
  const pauseAndGetTime = (): number | null => {
    const player = playerRef.current;
    if (!player || !ready) return null;
    if (player.getPlayerState() === PLAYING) {
      resumeAfterSaveRef.current = true;
      player.pauseVideo();
    }
    return currentTime();
  };

  const resumeIfPaused = () => {
    if (!resumeAfterSaveRef.current) return;
    resumeAfterSaveRef.current = false;
    playerRef.current?.playVideo();
  };

  // Tapping a field pauses the video and remembers where the expression was heard
  const handleCaptureFocus = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (player.getPlayerState() === PLAYING) {
      resumeAfterSaveRef.current = true;
      player.pauseVideo();
    }
    if (capturedAt === null) setCapturedAt(currentTime());
  };

  const rewind = () => playerRef.current?.seekTo(Math.max(0, currentTime() - 5), true);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo(); else player.playVideo();
  };

  const changeRate = (next: number) => {
    playerRef.current?.setPlaybackRate(next);
    setRate(next);
  };

  const seekTo = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(seconds, true);
    player.playVideo();
    setCurrent(seconds);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoId || !english.trim() || !korean.trim() || saving) return;
    setSaving(true);
    setFormError("");
    const link = capturedAt !== null ? buildTimestampLink(videoId, capturedAt) : "";
    const fullMemo = [memo.trim(), link].filter(Boolean).join(" · ");
    try {
      const res = await pocketApi.add(english.trim(), korean.trim(), fullMemo);
      if (link) setSaved((list) => [res.data, ...list]);
      setFlashId(res.data.id);
      setEnglish(""); setKorean(""); setMemo(""); setCapturedAt(null);
      setToast("포켓에 담았어요");
      if (resumeAfterSaveRef.current) {
        resumeAfterSaveRef.current = false;
        playerRef.current?.playVideo();
      }
    } catch (err: unknown) {
      setFormError(apiErrorMessage(err, { 409: "이미 포켓에 담긴 표현이에요" }));
    } finally {
      setSaving(false);
    }
  };

  if (!videoId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-base font-bold text-foreground">영상을 찾을 수 없어요</p>
        <Link href="/study/listening" className="inline-block mt-4 text-sm font-bold text-primary">목록으로</Link>
      </div>
    );
  }

  const markers = saved.flatMap((w) => {
    const stamp = parseMemoTimestamp(w.memo);
    return stamp ? [{ id: w.id, english: w.english, seconds: stamp.seconds }] : [];
  });
  const percent = (seconds: number) => (duration > 0 ? Math.min(100, (seconds / duration) * 100) : 0);

  return (
    <div className="max-w-xl mx-auto sm:px-6 sm:py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-1 px-2 sm:px-0 pt-3 pb-2">
        <Link href="/study/listening" aria-label="영상 목록으로" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-muted hover:text-foreground">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <p className="flex-1 min-w-0 text-sm font-bold text-foreground line-clamp-2 leading-snug">{title ?? "리스닝 노트"}</p>
      </div>

      {/* 영상 + 컨트롤: 스크롤하거나 키보드가 올라와도 상단에 고정 */}
      <div className={`sticky top-0 bg-background pb-2 pt-[env(safe-area-inset-top)] ${immersive ? "z-[60]" : "z-20"}`}>
        {/* Only classes change between modes, so the iframe is never re-mounted (no reload, captions keep their state) */}
        <div
          className={immersive ? "fixed inset-0 z-[60] bg-black flex items-center justify-center" : "relative w-full aspect-video bg-black sm:rounded-2xl overflow-hidden"}
          style={immersive ? { paddingLeft: SAFE_SIDE, paddingRight: SAFE_SIDE } : undefined}
        >
          {/* Landscape: an exact 16:9 box, centered between equal side margins so the Dynamic Island never pushes it off-center */}
          <div
            className={immersive ? "relative aspect-video" : "absolute inset-0"}
            style={immersive ? { width: "min(100%, calc(100dvh * 16 / 9))" } : undefined}
          >
            <div ref={wrapperRef} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />
          </div>
          {immersive && (
            <button
              type="button"
              onClick={() => setImmersive(false)}
              className="absolute z-10 h-10 px-3 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur"
              style={{ top: "calc(env(safe-area-inset-top) + 8px)", left: "calc(env(safe-area-inset-left) + 8px)" }}
            >
              ✕ 작게 보기
            </button>
          )}
        </div>

        {playerError ? (
          <p className="text-sm text-muted px-4 sm:px-0 mt-3">
            이 영상은 다른 사이트에서 재생할 수 없어요.{" "}
            <a href={`https://youtu.be/${videoId}`} target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">
              유튜브에서 열기
            </a>
          </p>
        ) : (
          <div className="px-4 sm:px-0">
            <div className="flex items-center gap-2 mt-2">
              <button onClick={rewind} disabled={!ready} aria-label="5초 뒤로" className={`h-11 px-3 rounded-xl text-sm font-bold ${secondaryButtonClass}`}>
                ↺ 5초
              </button>
              <button onClick={togglePlay} disabled={!ready} className="h-11 px-5 rounded-xl text-sm font-bold text-white bg-primary disabled:opacity-40 spring-active">
                {playing ? "일시정지" : "재생"}
              </button>
              <button
                onClick={() => setImmersive(true)}
                disabled={!ready}
                aria-label="크게 보기 (자막 유지)"
                title="크게 보기"
                className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${secondaryButtonClass}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
              <div className="ml-auto flex h-11 rounded-xl bg-card border border-border p-1" role="group" aria-label="재생 속도">
                {RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => changeRate(r)}
                    disabled={!ready}
                    aria-pressed={rate === r}
                    className={`px-2.5 rounded-lg text-xs font-bold tabular-nums transition-colors disabled:opacity-40 ${rate === r ? "bg-primary text-white" : "text-muted"}`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* 타임라인: 이 영상에서 표현을 담은 시점 */}
            {duration > 0 && (
              <div className="mt-1">
                <div
                  className="relative h-11 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seekTo(((e.clientX - rect.left) / rect.width) * duration);
                  }}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
                  <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={{ width: `${percent(current)}%` }} />
                  {markers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); seekTo(m.seconds); }}
                      aria-label={`${formatTime(m.seconds)} ${m.english} 장면으로 이동`}
                      className={`absolute top-1/2 w-11 h-11 flex items-center justify-center rounded-full ${m.id === flashId ? "marker-pop" : ""}`}
                      style={{ left: `${percent(m.seconds)}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <span className="w-3 h-3 rounded-full bg-pocket ring-2 ring-background" />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between -mt-2 text-[11px] font-semibold tabular-nums text-sub">
                  <span>{formatTime(current)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 sm:px-0 pb-6">
        <AiExpressionPanel
          videoId={videoId}
          pauseAndGetTime={pauseAndGetTime}
          resume={resumeIfPaused}
          onSaved={(words) => {
            setSaved((list) => [...words, ...list]);
            setFlashId(words[0]?.id ?? null);
          }}
          onToast={setToast}
        />

        {/* 직접 입력: 뜻까지 알고 있을 때만 쓰도록 접어 둔다 */}
        {!manualOpen ? (
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            aria-expanded={false}
            className="w-full h-12 mt-2 rounded-2xl border border-dashed border-border text-sm font-bold text-muted hover:text-foreground transition-colors"
          >
            + 뜻을 알면 직접 입력하기
          </button>
        ) : (
        <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-4 mt-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-foreground"><span className="text-pocket">★</span> 직접 입력</p>
              <button type="button" onClick={() => setManualOpen(false)} aria-expanded={true} className="h-8 px-2 text-xs font-bold text-sub">접기</button>
            </div>
            {capturedAt !== null && (
              <div className="flex items-center gap-1 text-xs">
                <span className="font-bold text-pocket tabular-nums">⏱ {formatTime(capturedAt)}</span>
                <button type="button" onClick={() => setCapturedAt(currentTime())} className="h-8 px-2 font-bold text-primary">
                  지금으로
                </button>
                <button type="button" onClick={() => setCapturedAt(null)} className="h-8 px-2 font-bold text-sub">
                  빼기
                </button>
              </div>
            )}
          </div>
          <input
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            onFocus={handleCaptureFocus}
            placeholder="들린 영어 표현 (누르면 영상이 멈춰요)"
            maxLength={500}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            className={fieldClass}
          />
          <input
            value={korean}
            onChange={(e) => setKorean(e.target.value)}
            onFocus={handleCaptureFocus}
            placeholder="뜻"
            maxLength={500}
            enterKeyHint="next"
            className={fieldClass}
          />
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            maxLength={450}
            enterKeyHint="done"
            className={fieldClass}
          />
          {formError && <p className="text-sm font-semibold text-wrong">{formError}</p>}
          <button
            type="submit"
            disabled={!english.trim() || !korean.trim() || saving}
            className="w-full h-12 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors spring-active disabled:opacity-40"
          >
            {saving ? "담는 중…" : "포켓에 담기"}
          </button>
        </form>
        )}

        {/* 이 영상에서 담은 표현 */}
        <div className="mt-6">
          <p className="text-sm font-bold text-foreground mb-3">
            이 영상에서 담은 표현 <span className="text-pocket">{saved.length}</span>
          </p>
          {saved.length === 0 ? (
            <p className="text-sm text-muted bg-card border border-border rounded-2xl px-4 py-6 text-center">
              모르는 표현이 들리면 위 입력칸을 눌러 담아 보세요
            </p>
          ) : (
            <ul className="space-y-2">
              {saved.map((w) => {
                const stamp = parseMemoTimestamp(w.memo);
                return (
                  <li key={w.id}>
                    <button
                      type="button"
                      onClick={() => stamp && seekTo(stamp.seconds)}
                      disabled={!stamp || !ready}
                      className={`w-full text-left bg-card border border-border rounded-2xl p-3 flex items-center gap-3 active:bg-primary/[0.04] transition-colors ${w.id === flashId ? "pocket-flash" : ""}`}
                    >
                      <span aria-hidden className="self-stretch w-1 rounded-full bg-pocket/50" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-foreground break-words">{w.english}</span>
                        <span className="block text-sm text-muted break-words">{w.korean}</span>
                        {stamp?.rest && <span className="block text-xs text-sub mt-0.5 break-words">{stamp.rest}</span>}
                      </span>
                      {stamp && (
                        <span className="shrink-0 h-9 px-3 flex items-center rounded-full bg-pocket/15 text-pocket text-xs font-bold tabular-nums">
                          ▶ {formatTime(stamp.seconds)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}

export default function ListeningVideoPage() {
  return (
    <Suspense fallback={null}>
      <ListeningVideoDetail />
    </Suspense>
  );
}
