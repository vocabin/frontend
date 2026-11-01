"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { listeningApi, pocketApi, ListeningVideo } from "@/lib/api";
import { formatTime, parseMemoTimestamp, parseVideoId, thumbnailUrl } from "@/lib/youtube";
import { fieldClass, secondaryButtonClass } from "@/lib/ui";
import Toast from "@/components/Toast";

function ListeningLibrary() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [videos, setVideos]       = useState<ListeningVideo[]>([]);
  const [counts, setCounts]       = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(true);
  const [urlInput, setUrlInput]   = useState("");
  const [adding, setAdding]       = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast]         = useState("");
  const clearToast = useCallback(() => setToast(""), []);

  // Old links (/study/listening?v=…&t=…) now live on the video detail page
  useEffect(() => {
    const legacy = parseVideoId(searchParams.get("v") ?? "");
    if (!legacy) return;
    const t = searchParams.get("t");
    router.replace(`/study/listening/${legacy}${t ? `?t=${t}` : ""}`);
  }, [searchParams, router]);

  useEffect(() => {
    Promise.all([listeningApi.getAll(), pocketApi.getAll()])
      .then(([videoRes, pocketRes]) => {
        setVideos(videoRes.data);
        const byVideo: Record<string, number> = {};
        for (const word of pocketRes.data) {
          const id = parseMemoTimestamp(word.memo)?.videoId;
          if (id) byVideo[id] = (byVideo[id] ?? 0) + 1;
        }
        setCounts(byVideo);
      })
      .catch(() => setToast("영상 목록을 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, []);

  const openVideo = async (raw: string) => {
    const id = parseVideoId(raw);
    if (!id) { setToast("유튜브 링크를 확인해 주세요"); return; }
    setAdding(true);
    try {
      await listeningApi.open(id);
      router.push(`/study/listening/${id}`);
    } catch {
      setToast("영상을 추가하지 못했어요");
      setAdding(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    openVideo(urlInput);
  };

  // Phone flow: copy the link in the YouTube app, then one tap here
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrlInput(text);
      if (parseVideoId(text)) openVideo(text);
      else setToast("복사한 내용이 유튜브 링크가 아니에요");
    } catch {
      setToast("붙여넣기 권한이 없어요. 입력칸에 직접 붙여넣어 주세요");
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      await listeningApi.remove(videoId);
      setVideos((list) => list.filter((v) => v.videoId !== videoId));
      setToast("목록에서 지웠어요 (담은 표현은 포켓에 남아 있어요)");
    } catch {
      setToast("지우지 못했어요");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">리스닝 노트</h1>
        <p className="text-sm text-muted mt-1">영상을 들으며 모르는 표현을 포켓에 담아요</p>
      </div>

      {/* 영상 추가 */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-3 mb-6 space-y-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="유튜브 링크 붙여넣기"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          className={fieldClass}
        />
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={pasteFromClipboard} disabled={adding} className={`h-11 rounded-xl text-sm font-bold ${secondaryButtonClass}`}>
            복사한 링크로 열기
          </button>
          <button
            type="submit"
            disabled={adding || !urlInput.trim()}
            className="h-11 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-hover transition-colors spring-active disabled:opacity-40"
          >
            {adding ? "여는 중…" : "추가하고 보기"}
          </button>
        </div>
      </form>

      {/* 영상 목록 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl px-6 py-10 text-center">
          <p className="text-base font-bold text-foreground">아직 추가한 영상이 없어요</p>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            유튜브 앱에서 <span className="font-semibold text-foreground">공유 → 링크 복사</span> 후<br />
            위의 &lsquo;복사한 링크로 열기&rsquo;를 눌러 보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {videos.map((video) => {
            const count = counts[video.videoId] ?? 0;
            return (
              <li key={video.videoId} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-stretch">
                  <Link href={`/study/listening/${video.videoId}`} className="flex flex-1 min-w-0 gap-3 p-3 active:bg-primary/[0.04] transition-colors">
                    <div className="relative w-32 shrink-0 aspect-video rounded-lg overflow-hidden bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailUrl(video.videoId)} alt="" loading="lazy" className="w-full h-full object-cover" />
                      {video.lastPositionSeconds > 0 && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white tabular-nums">
                          {formatTime(video.lastPositionSeconds)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                        {video.title ?? "제목을 불러오는 중이에요"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? "bg-pocket/15 text-pocket" : "bg-background text-sub"}`}>
                          ★ {count}
                        </span>
                        <span className="text-xs text-muted">
                          {video.lastPositionSeconds > 0 ? `${formatTime(video.lastPositionSeconds)}부터 이어보기` : "처음부터"}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {confirmId !== video.videoId && (
                    <button
                      onClick={() => setConfirmId(video.videoId)}
                      className="w-11 shrink-0 flex items-center justify-center text-sub hover:text-wrong transition-colors"
                      aria-label="목록에서 지우기"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                {confirmId === video.videoId && (
                  <div className="flex items-center gap-2 px-3 pb-3 fade-in">
                    <p className="flex-1 text-xs text-muted">목록에서 지울까요? 담은 표현은 남아요</p>
                    <button onClick={() => setConfirmId(null)} className={`h-10 px-3 text-xs font-bold rounded-lg ${secondaryButtonClass}`}>
                      취소
                    </button>
                    <button onClick={() => handleDelete(video.videoId)} className="h-10 px-3 text-xs font-bold text-white bg-wrong rounded-lg spring-active">
                      지우기
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}

export default function ListeningLibraryPage() {
  return (
    <Suspense fallback={null}>
      <ListeningLibrary />
    </Suspense>
  );
}
