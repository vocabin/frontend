"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { wordsApi, studyBookmarkApi, Word } from "@/lib/api";

type AnimState = "idle" | "exit" | "enter";
type LangMode = "en-ko" | "ko-en";

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

  // Save bookmark every time index changes
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
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (words.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center text-center page-in">
        <div className="glass-card rounded-3xl p-8 w-full text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-foreground mb-1">학습할 단어가 없어요</h2>
          <p className="text-xs text-slate-500 mb-6">해당 세트에 등록된 단어가 없습니다. 단어를 등록한 후에 다시 시작해 주세요.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all spring-active"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const total = results.correct + results.wrong;
    const rate = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center text-center page-in">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/[0.08] shadow-lg flex items-center justify-center mb-6">
          {rate >= 70 ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-correct">
              <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">세트 학습 완료!</h2>
        <p className="text-slate-400 text-sm mb-8 font-medium">{total}개의 단어 학습을 완료하였습니다.</p>

        {/* 통계 요약 피드백 */}
        <div className="grid grid-cols-3 gap-1 glass-card rounded-2xl w-full p-6 shadow-xl mb-8 relative">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-correct tabular-nums tracking-tight">{results.correct}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">아는 단어</p>
          </div>
          <div className="border-r border-white/[0.04]" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-wrong tabular-nums tracking-tight">{results.wrong}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">모르는 단어</p>
          </div>
          <div className="border-r border-white/[0.04]" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary tabular-nums tracking-tight">{rate}%</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">정답률</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={restart}
            className="flex-1 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm font-bold text-slate-300 hover:bg-white/[0.08] transition-all spring-active"
          >
            다시 학습하기
          </button>
          <button 
            onClick={() => router.back()}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all spring-active"
          >
            뒤로 가기
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
  const flipHint = langMode === "en-ko" ? "카드를 탭하거나 Space키로 확인" : "카드를 탭하거나 Space키로 확인";
  const revealLabel = langMode === "en-ko" ? "정답 확인하기" : "정답 확인하기";

  return (
    <div className="max-w-xl mx-auto px-6 py-10 page-in">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center spring-active"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 진행률 바 */}
        <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            style={{ width: `${(index / words.length) * 100}%` }} 
          />
        </div>
        <span className="text-xs font-bold text-slate-500 shrink-0 tabular-nums">{index + 1} / {words.length}</span>

        {/* 랜덤 토글 */}
        <button
          onClick={toggleRandom}
          className={`p-2 rounded-xl border transition-all spring-active ${
            isRandom 
              ? "text-primary bg-primary/10 border-primary/20" 
              : "text-slate-500 bg-white/[0.02] border-white/[0.08] hover:text-slate-300 hover:border-white/[0.15]"
          }`}
          title={isRandom ? "순서대로 학습하기" : "무작위 순서로 학습하기"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
          </svg>
        </button>

        {/* 언어 토글 */}
        <button
          onClick={() => { setLangMode((m) => m === "en-ko" ? "ko-en" : "en-ko"); setFlipped(false); }}
          className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all spring-active"
        >
          {langMode === "en-ko" ? "EN → KO" : "KO → EN"}
        </button>
      </div>

      {/* 카드 */}
      <div
        className={`card-perspective cursor-pointer mb-6 relative select-none ${cardAnimClass}`}
        onClick={() => animState === "idle" && setFlipped((f) => !f)}
      >
        <div
          className="card-inner relative w-full min-h-[300px] shadow-2xl"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* 앞면 */}
          <div
            className="card-face w-full min-h-[300px] glass-card rounded-3xl flex flex-col items-center justify-between px-8 py-10 border-white/[0.06] bg-[#0F121F]/80"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{frontLabel}</p>
            <p className="text-3xl font-extrabold text-foreground text-center leading-snug tracking-tight my-8">{frontText}</p>
            <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 opacity-60">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              {flipHint}
            </p>
          </div>
          {/* 뒷면 */}
          <div
            className="card-face card-back w-full min-h-[300px] bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex flex-col items-center justify-between px-8 py-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] absolute top-0 left-0"
          >
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{backLabel}</p>
            <p className="text-3xl font-extrabold text-white text-center leading-snug tracking-tight my-8">{backText}</p>
            <p className="text-[10px] font-bold text-blue-200/80">정답을 확인하셨나요?</p>
          </div>
        </div>
      </div>

      {/* O / X 버튼 및 뜻 보기 */}
      <div className="relative min-h-[72px]">
        {flipped ? (
          <div className="flex gap-3 fade-in">
            <button 
              onClick={(e) => { e.stopPropagation(); goNext(false); }}
              className="flex-1 py-4 bg-wrong/5 hover:bg-wrong/10 border border-wrong/20 text-wrong font-extrabold text-sm rounded-2xl shadow-lg shadow-wrong/5 flex items-center justify-center gap-2 transition-all spring-active"
            >
              <span>✗</span>
              <span>모르겠어요 (Left)</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); goNext(true); }}
              className="flex-1 py-4 bg-correct/5 hover:bg-correct/10 border border-correct/20 text-correct font-extrabold text-sm rounded-2xl shadow-lg shadow-correct/5 flex items-center justify-center gap-2 transition-all spring-active"
            >
              <span>✓</span>
              <span>알겠어요 (Right)</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setFlipped(true)}
            className="w-full py-4 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 font-bold text-sm rounded-2xl shadow-md transition-all spring-active fade-in"
          >
            {revealLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SetFlashcardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetFlashcardContent />
    </Suspense>
  );
}
