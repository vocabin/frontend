"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { pocketApi, Word } from "@/lib/api";
import { buildTimestampLink, formatTime, parseMemoTimestamp, parseVideoId } from "@/lib/youtube";
import Toast from "@/components/Toast";

// ─── YouTube IFrame Player API (minimal typings) ──────────────────────────────

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
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
const RATES = [0.75, 1, 1.25];
const LAST_VIDEO_KEY = "listening:lastVideo";

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

function readLastVideo(): string | null {
  try { return localStorage.getItem(LAST_VIDEO_KEY); } catch { return null; }
}

function writeLastVideo(videoId: string) {
  try { localStorage.setItem(LAST_VIDEO_KEY, videoId); } catch { /* storage unavailable */ }
}

const inputClass =
  "w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all";

// ─── Page ─────────────────────────────────────────────────────────────────────

function ListeningNote() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [urlInput, setUrlInput] = useState("");
  const [videoId, setVideoId]   = useState<string | null>(null);
  const [startAt, setStartAt]   = useState(0);
  const [ready, setReady]       = useState(false);
  const [playing, setPlaying]   = useState(false);
  const [rate, setRate]         = useState(1);
  const [playerError, setPlayerError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent]   = useState(0);
  const [flashId, setFlashId]   = useState<number | null>(null);

  const [english, setEnglish]   = useState("");
  const [korean, setKorean]     = useState("");
  const [memo, setMemo]         = useState("");
  const [capturedAt, setCapturedAt] = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved]       = useState<Word[]>([]);
  const [toast, setToast]       = useState("");
  const clearToast = useCallback(() => setToast(""), []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const resumeAfterSaveRef = useRef(false);

  // Initial video: ?v=&t= from a pocket timestamp link, otherwise the last watched video
  useEffect(() => {
    const fromQuery = parseVideoId(searchParams.get("v") ?? "");
    const initial = fromQuery ?? parseVideoId(readLastVideo() ?? "");
    if (initial) {
      setVideoId(initial);
      setUrlInput(`https://youtu.be/${initial}`);
      setStartAt(fromQuery ? Number(searchParams.get("t") ?? 0) || 0 : 0);
    }
  }, [searchParams]);

  // (Re)create the player whenever the video changes
  useEffect(() => {
    if (!videoId || !wrapperRef.current) return;
    let cancelled = false;
    const wrapper = wrapperRef.current;
    setReady(false); setPlaying(false); setPlayerError(false); setDuration(0); setCurrent(0);

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      // The API replaces the target element with an iframe, so give it a node React does not manage
      const target = document.createElement("div");
      wrapper.appendChild(target);
      playerRef.current = new YT.Player(target, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, start: startAt },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => setPlaying(e.data === PLAYING),
          onError: () => setPlayerError(true),
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      wrapper.innerHTML = "";
    };
  }, [videoId, startAt]);

  // Keep the timeline in sync with the player
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setCurrent(player.getCurrentTime());
      setDuration(player.getDuration());
    }, 500);
    return () => clearInterval(timer);
  }, [ready]);

  // Expressions already saved from this video
  useEffect(() => {
    if (!videoId) return;
    pocketApi.getAll()
      .then((res) => setSaved(res.data.filter((w) => parseMemoTimestamp(w.memo)?.videoId === videoId)))
      .catch(() => setSaved([]));
  }, [videoId]);

  const handleLoad = (e: FormEvent) => {
    e.preventDefault();
    const id = parseVideoId(urlInput);
    if (!id) { setToast("유튜브 링크를 확인해 주세요"); return; }
    writeLastVideo(id);
    setStartAt(0);
    setVideoId(id);
    router.replace(`/study/listening?v=${id}`);
  };

  const currentTime = () => playerRef.current?.getCurrentTime() ?? 0;

  // Tapping the input pauses the video and remembers where the expression was heard
  const handleCaptureFocus = () => {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (player.getPlayerState() === PLAYING) {
      resumeAfterSaveRef.current = true;
      player.pauseVideo();
    }
    if (capturedAt === null) setCapturedAt(currentTime());
  };

  const rewind = () => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(Math.max(0, currentTime() - 5), true);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo(); else player.playVideo();
  };

  const changeRate = (next: number) => {
    playerRef.current?.setPlaybackRate(next);
    setRate(next);
  };

  const seekTo = (seconds: number, scrollToPlayer = true) => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(seconds, true);
    player.playVideo();
    setCurrent(seconds);
    if (scrollToPlayer) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markers = saved.flatMap((w) => {
    const stamp = parseMemoTimestamp(w.memo);
    return stamp ? [{ id: w.id, english: w.english, seconds: stamp.seconds }] : [];
  });
  const percent = (seconds: number) => (duration > 0 ? Math.min(100, (seconds / duration) * 100) : 0);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !korean.trim() || saving) return;
    setSaving(true);
    setFormError("");
    const link = videoId && capturedAt !== null ? buildTimestampLink(videoId, capturedAt) : "";
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
      const status = (err as { response?: { status?: number } }).response?.status;
      setFormError(status === 409 ? "이미 포켓에 담긴 표현이에요" : "저장하지 못했어요. 잠시 후 다시 시도해 주세요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 page-in">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">리스닝 노트</h1>
        <p className="text-xs text-slate-500 mt-1">들으면서 모르는 표현을 바로 포켓에 담아요</p>
      </div>

      {/* 영상 불러오기 */}
      <form onSubmit={handleLoad} className="flex gap-2 mb-4">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="유튜브 링크 붙여넣기"
          inputMode="url"
          className={inputClass}
        />
        <button type="submit" className="shrink-0 px-4 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-200 text-xs font-bold rounded-xl transition-all spring-active">
          불러오기
        </button>
      </form>

      {/* 플레이어 */}
      {videoId && (
        <div className="mb-4">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/[0.06]">
            <div ref={wrapperRef} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full" />
          </div>
          {playerError ? (
            <p className="text-xs text-slate-400 mt-3">
              이 영상은 다른 사이트에서 재생할 수 없어요.{" "}
              <a href={`https://youtu.be/${videoId}`} target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">
                유튜브에서 열기
              </a>
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-3">
              <button onClick={rewind} disabled={!ready} className="px-3 py-2 text-xs font-bold text-slate-300 bg-white/[0.04] border border-white/[0.08] rounded-xl disabled:opacity-40 spring-active">
                ⏪ 5초
              </button>
              <button onClick={togglePlay} disabled={!ready} className="px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl disabled:opacity-40 spring-active">
                {playing ? "⏸ 일시정지" : "▶ 재생"}
              </button>
              <div className="ml-auto flex rounded-xl border border-white/[0.08] overflow-hidden">
                {RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => changeRate(r)}
                    disabled={!ready}
                    className={`px-2.5 py-2 text-[11px] font-bold transition-colors disabled:opacity-40 ${rate === r ? "bg-primary/20 text-primary" : "text-slate-400"}`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline: where in this video each expression was caught */}
          {!playerError && duration > 0 && (
            <div className="mt-4">
              <div
                className="relative h-8 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  seekTo(((e.clientX - rect.left) / rect.width) * duration, false);
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/[0.08]" />
                <div
                  className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary/70"
                  style={{ width: `${percent(current)}%` }}
                />
                {markers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); seekTo(m.seconds, false); }}
                    title={`${formatTime(m.seconds)} · ${m.english}`}
                    aria-label={`${formatTime(m.seconds)} ${m.english} 장면으로 이동`}
                    className={`absolute top-1/2 w-7 h-7 flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-pocket ${m.id === flashId ? "marker-pop" : ""}`}
                    style={{ left: `${percent(m.seconds)}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-pocket ring-2 ring-background" />
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-semibold tabular-nums text-slate-500">
                <span>{formatTime(current)}</span>
                <span>{markers.length > 0 ? `담은 표현 ${markers.length}` : "표현을 담으면 여기에 표시돼요"}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 빠른 담기 */}
      <form onSubmit={handleSave} className="glass-card rounded-2xl p-4 space-y-3 mb-8">
        <input
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          onFocus={handleCaptureFocus}
          placeholder="들린 영어 표현"
          maxLength={500}
          autoCapitalize="none"
          className={inputClass}
        />
        <input
          value={korean}
          onChange={(e) => setKorean(e.target.value)}
          onFocus={handleCaptureFocus}
          placeholder="뜻"
          maxLength={500}
          className={inputClass}
        />
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (선택)"
          maxLength={450}
          className={inputClass}
        />
        {capturedAt !== null && videoId && (
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>⏱ {formatTime(capturedAt)} 시간 링크가 함께 저장돼요</span>
            <button type="button" onClick={() => setCapturedAt(currentTime())} className="text-primary font-bold">
              지금 시간으로
            </button>
            <button type="button" onClick={() => setCapturedAt(null)} className="text-slate-500 font-bold" aria-label="시간 링크 빼기">
              빼기
            </button>
          </div>
        )}
        {formError && <p className="text-xs font-semibold text-wrong">{formError}</p>}
        <button
          type="submit"
          disabled={!english.trim() || !korean.trim() || saving}
          className="w-full py-3.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition-all spring-active disabled:opacity-40"
        >
          {saving ? "담는 중…" : "포켓에 담기"}
        </button>
      </form>

      {/* 이 영상에서 담은 표현 */}
      {videoId && saved.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 mb-3">이 영상에서 담은 표현 {saved.length}</p>
          <ul className="space-y-2">
            {saved.map((w) => {
              const stamp = parseMemoTimestamp(w.memo);
              return (
                <li key={w.id} className={`glass-card rounded-xl p-3 flex items-center gap-3 ${w.id === flashId ? "pocket-flash" : ""}`}>
                  <span aria-hidden className="self-stretch w-px bg-pocket/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground break-words">{w.english}</p>
                    <p className="text-xs text-slate-400 break-words">{w.korean}</p>
                  </div>
                  {stamp && (
                    <button
                      onClick={() => seekTo(stamp.seconds)}
                      disabled={!ready}
                      className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-pocket/10 text-pocket hover:bg-pocket/20 disabled:opacity-40 spring-active"
                    >
                      ▶ {formatTime(stamp.seconds)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}

export default function ListeningNotePage() {
  return (
    <Suspense fallback={null}>
      <ListeningNote />
    </Suspense>
  );
}
