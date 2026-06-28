"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { wordsApi, studyBookmarkApi, Word } from "@/lib/api";

type AnimState = "idle" | "exit" | "enter";
type LangMode = "en-ko" | "ko-en"; // front face language

function SetFlashcardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wordSetId = Number(searchParams.get("wordSetId"));

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState({ correct: 0, wrong: 0 });
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [langMode, setLangMode] = useState<LangMode>("en-ko");
  const [isRandom, setIsRandom] = useState(false);
  const originalWords = useRef<Word[]>([]);

  // Load words and bookmark
  useEffect(() => {
    if (!wordSetId) return;
    Promise.all([
      wordsApi.getByWordSet(wordSetId),
      studyBookmarkApi.get(wordSetId).catch(() => null),
    ]).then(([wordsRes, bookmarkRes]) => {
      const loaded = wordsRes.data;
      originalWords.current = loaded;
      setWords(loaded);
      if (bookmarkRes && bookmarkRes.status === 200 && bookmarkRes.data.wordIndex < loaded.length) {
        setIndex(bookmarkRes.data.wordIndex);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [wordSetId]);

  // Save bookmark every time index changes (debounced via ref)
  const saveBookmark = useCallback((idx: number) => {
    if (!wordSetId) return;
    studyBookmarkApi.upsert(wordSetId, idx).catch(() => {});
  }, [wordSetId]);

  const goNext = useCallback(async (correct: boolean) => {
    if (animState !== "idle") return;
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }));

    setAnimState("exit");
    setTimeout(() => {
      const nextIndex = index + 1;
      if (nextIndex >= words.length) {
        setFinished(true);
        setAnimState("idle");
        return;
      }
      setIndex(nextIndex);
      saveBookmark(nextIndex);
      setFlipped(false);
      setAnimState("enter");
      setTimeout(() => setAnimState("idle"), 180);
    }, 140);
  }, [animState, words, index, saveBookmark]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === "ArrowRight" && flipped) goNext(true);
      if (e.key === "ArrowLeft" && flipped) goNext(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, goNext]);

  const toggleRandom = () => {
    setIsRandom((prev) => {
      const next = !prev;
      if (next) {
        const shuffled = [...originalWords.current].sort(() => Math.random() - 0.5);
        setWords(shuffled);
      } else {
        setWords([...originalWords.current]);
      }
      setIndex(0);
      setFlipped(false);
      return next;
    });
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setResults({ correct: 0, wrong: 0 });
    setAnimState("idle");
    if (isRandom) {
      setWords([...originalWords.current].sort(() => Math.random() - 0.5));
    } else {
      setWords([...originalWords.current]);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (finished) {
    const total = results.correct + results.wrong;
    const rate = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-card shadow-sm flex items-center justify-center mb-5">
          {rate >= 70 ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-correct">
              <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">학습 완료!</h2>
        <p className="text-slate-400 text-sm mb-8">{total}개 단어 완료</p>
        <div className="flex gap-6 mb-8 bg-card rounded-3xl px-10 py-6 shadow-sm">
          <div className="text-center"><p className="text-3xl font-bold text-correct">{results.correct}</p><p className="text-xs text-slate-500 mt-1">정답</p></div>
          <div className="w-px bg-slate-700" />
          <div className="text-center"><p className="text-3xl font-bold text-wrong">{results.wrong}</p><p className="text-xs text-slate-500 mt-1">오답</p></div>
          <div className="w-px bg-slate-700" />
          <div className="text-center"><p className="text-3xl font-bold text-primary">{rate}%</p><p className="text-xs text-slate-500 mt-1">정답률</p></div>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={restart}
            className="flex-1 py-3.5 bg-card border border-slate-700 rounded-2xl text-sm font-medium text-slate-300 hover:bg-slate-800/50 transition-all">
            다시 하기
          </button>
          <button onClick={() => router.back()}
            className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary-hover transition-all">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const word = words[index];
  const cardAnimClass = animState === "exit" ? "card-exit" : animState === "enter" ? "card-enter" : "";

  const frontLabel = langMode === "en-ko" ? "영단어" : "한국어 뜻";
  const frontText = langMode === "en-ko" ? word.english : word.korean;
  const backLabel = langMode === "en-ko" ? "한국어 뜻" : "영단어";
  const backText = langMode === "en-ko" ? word.korean : word.english;
  const flipHint = langMode === "en-ko" ? "탭하거나 Space로 뜻 확인" : "탭하거나 Space로 영단어 확인";
  const revealLabel = langMode === "en-ko" ? "뜻 보기" : "영단어 보기";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 진행률 바 */}
        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-1 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(index / words.length) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums">{index + 1}/{words.length}</span>

        {/* 랜덤 토글 */}
        <button
          onClick={toggleRandom}
          className={`p-1.5 rounded-lg transition-colors ${isRandom ? "text-primary bg-primary/10" : "text-slate-600 hover:text-slate-400"}`}
          title={isRandom ? "순서대로" : "랜덤 순서"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
          </svg>
        </button>

        {/* 언어 토글 */}
        <button
          onClick={() => { setLangMode((m) => m === "en-ko" ? "ko-en" : "en-ko"); setFlipped(false); }}
          className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
        >
          {langMode === "en-ko" ? "EN→KO" : "KO→EN"}
        </button>
      </div>

      {/* 카드 */}
      <div
        className={`relative cursor-pointer mb-5 ${cardAnimClass}`}
        style={{ perspective: "1000px" }}
        onClick={() => animState === "idle" && setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-400"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* 앞면 */}
          <div
            className="w-full bg-card border border-slate-700/50 rounded-3xl flex flex-col items-center justify-center min-h-60 px-8 py-10 select-none shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-[11px] font-semibold text-slate-500 mb-5 uppercase tracking-widest">{frontLabel}</p>
            <p className="text-2xl font-bold text-foreground text-center leading-snug">{frontText}</p>
            <p className="text-xs text-slate-500 mt-6">{flipHint}</p>
          </div>
          {/* 뒷면 */}
          <div
            className="w-full bg-primary rounded-3xl flex flex-col items-center justify-center min-h-60 px-8 py-10 select-none shadow-sm absolute top-0 left-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-[11px] font-semibold text-blue-200 mb-5 uppercase tracking-widest">{backLabel}</p>
            <p className="text-3xl font-bold text-white text-center">{backText}</p>
          </div>
        </div>
      </div>

      {/* O / X 버튼 */}
      <div className={`transition-all duration-200 ${flipped && animState === "idle" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="flex gap-3">
          <button onClick={() => goNext(false)}
            className="flex-1 py-4 bg-card border border-slate-700/50 rounded-2xl shadow-sm text-wrong font-bold text-lg hover:shadow-md hover:bg-slate-800/50 active:scale-95 transition-all duration-100 flex items-center justify-center gap-1.5">
            <span className="text-base">✗</span>
            <span className="text-xs font-normal text-slate-500">몰라요</span>
          </button>
          <button onClick={() => goNext(true)}
            className="flex-1 py-4 bg-card border border-slate-700/50 rounded-2xl shadow-sm text-correct font-bold text-lg hover:shadow-md hover:bg-slate-800/50 active:scale-95 transition-all duration-100 flex items-center justify-center gap-1.5">
            <span className="text-base">✓</span>
            <span className="text-xs font-normal text-slate-500">알아요</span>
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-3">← 몰라요 &nbsp;·&nbsp; 알아요 →</p>
      </div>

      {!flipped && (
        <button onClick={() => setFlipped(true)}
          className="w-full py-4 bg-card border border-slate-700/50 rounded-2xl shadow-sm text-sm font-medium text-slate-400 hover:bg-slate-800/50 transition-all">
          {revealLabel}
        </button>
      )}
    </div>
  );
}

export default function SetFlashcardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetFlashcardContent />
    </Suspense>
  );
}
