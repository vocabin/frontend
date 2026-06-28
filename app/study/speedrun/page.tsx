"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { wordsApi, studyApi, Word } from "@/lib/api";

const DUMMY_WORDS: Word[] = [
  { id: 1, english: "abandon", korean: "포기하다, 버리다", wordSetId: 1 },
  { id: 2, english: "abstract", korean: "추상적인; 요약하다", wordSetId: 1 },
  { id: 3, english: "accelerate", korean: "가속하다", wordSetId: 1 },
  { id: 4, english: "accumulate", korean: "축적하다", wordSetId: 1 },
  { id: 5, english: "benevolent", korean: "자애로운, 친절한", wordSetId: 1 },
];

export default function SpeedrunPage() {
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState({ correct: 0, wrong: 0 });
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadWords = useCallback(() => {
    setLoading(true);
    setIndex(0); setInput(""); setFeedback(null);
    setFinished(false); setResults({ correct: 0, wrong: 0 }); setTimeLeft(60);
    wordsApi.getDue()
      .then((res) => setWords(res.data))
      .catch(() => setWords(DUMMY_WORDS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadWords(); }, [loadWords]);

  useEffect(() => {
    if (!loading && !finished && feedback === null) inputRef.current?.focus();
  }, [loading, finished, feedback, index]);

  useEffect(() => {
    if (loading || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); setFinished(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, finished]);

  const next = (correct: boolean) => {
    const word = words[index];
    studyApi.recordResult({ wordId: word.id, correct, mode: "SPEEDRUN" }).catch(() => { });
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }));
    setTimeout(() => {
      setIndex((i) => {
        if (words.length <= 1) return 0;
        let nextIndex = Math.floor(Math.random() * words.length);
        if (nextIndex === i) nextIndex = (nextIndex + 1) % words.length;
        return nextIndex;
      });
      setInput(""); setFeedback(null);
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== null) return;
    const word = words[index];
    const isCorrect = word.english.trim().toLowerCase() === input.trim().toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");
    next(isCorrect);
  };

  const handleSkip = () => {
    if (feedback !== null) return;
    setFeedback("wrong");
    next(false);
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
          <h2 className="text-lg font-extrabold text-foreground mb-1">스피드런을 시작할 수 없어요</h2>
          <p className="text-xs text-slate-500 mb-6">학습할 수 있는 단어가 전혀 없습니다. 단어 세트에서 새로운 단어를 등록하거나 업로드해 주세요!</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all spring-active"
          >
            홈으로 가기
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
          {results.correct >= 15 ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">타임 아웃!</h2>
        <p className="text-slate-400 text-sm mb-8 font-medium">60초 제한시간 동안 총 {total}개의 퀴즈를 풀었습니다.</p>

        {/* 통계 요약 피드백 */}
        <div className="grid grid-cols-3 gap-1 glass-card rounded-2xl w-full p-6 shadow-xl mb-8 relative">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-correct tabular-nums tracking-tight">{results.correct}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">정답 개수</p>
          </div>
          <div className="border-r border-white/[0.04]" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-wrong tabular-nums tracking-tight">{results.wrong}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">오답 개수</p>
          </div>
          <div className="border-r border-white/[0.04]" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary tabular-nums tracking-tight">{rate}%</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">정답률</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={loadWords} 
            className="flex-1 py-3.5 bg-card border border-border rounded-xl text-sm font-bold text-muted hover:bg-primary/[0.03] hover:text-foreground transition-all spring-active"
          >
            다시 도전하기
          </button>
          <button 
            onClick={() => router.push("/")} 
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all spring-active"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[index];
  const borderClass = feedback === "correct" 
    ? "border-correct/35 shadow-[0_0_20px_rgba(16,185,129,0.12)] bg-correct/[0.02]" 
    : feedback === "wrong" 
      ? "border-wrong/35 shadow-[0_0_20px_rgba(239,68,68,0.12)] bg-wrong/[0.02]" 
      : "border-border bg-card";

  return (
    <div className="max-w-xl mx-auto px-6 py-10 page-in">
      {/* 타이머 및 점수 */}
      <div className="flex items-center justify-between mb-8">
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all ${
          timeLeft <= 10 
            ? "bg-wrong/10 border-wrong/30 text-wrong pulse-timer" 
            : "bg-card border-border text-primary"
        }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={timeLeft <= 10 ? "text-wrong" : "text-primary"}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[15px] font-extrabold tabular-nums leading-none">{timeLeft}초 남음</span>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">정답</p>
            <p className="text-2xl font-extrabold text-correct leading-none tabular-nums">{results.correct}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">오답</p>
            <p className="text-2xl font-extrabold text-wrong leading-none tabular-nums">{results.wrong}</p>
          </div>
        </div>
      </div>

      {/* 단어 카드 */}
      <div className={`glass-card rounded-3xl p-8 mb-6 text-center border-2 transition-all duration-300 ${borderClass}`}>
        <p className="text-[10px] font-bold text-sub mb-4 uppercase tracking-widest">한국어 뜻</p>
        <p className="text-2xl font-extrabold text-foreground leading-snug tracking-tight my-4">{currentWord?.korean}</p>
        <div className="min-h-[24px]">
          {feedback === "wrong" && (
            <p className="text-xs text-wrong font-bold fade-in">
              정답은 <span className="underline underline-offset-4 font-mono font-extrabold text-sm ml-1">{currentWord?.english}</span> 입니다
            </p>
          )}
          {feedback === "correct" && (
            <p className="text-xs text-correct font-bold fade-in">
              정답입니다! <span className="font-mono font-extrabold text-sm ml-1">{currentWord?.english}</span>
            </p>
          )}
        </div>
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={feedback !== null}
          placeholder={feedback !== null ? "다음 단어 준비 중..." : "영단어를 입력하고 Enter"}
          className={`w-full border rounded-2xl px-5 py-4 text-sm font-semibold tracking-wide focus:outline-none transition-all placeholder:text-sub ${
            feedback === "correct" 
              ? "border-correct/30 bg-correct/5 text-correct" 
              : feedback === "wrong" 
                ? "border-wrong/30 bg-wrong/5 text-wrong" 
                : "bg-background border-border text-foreground focus:border-primary/80 focus:ring-1 focus:ring-primary/30"
          }`}
        />
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={handleSkip} 
            disabled={feedback !== null}
            className="flex-1 py-3.5 bg-card border border-border hover:bg-primary/[0.02] rounded-xl text-sm font-bold text-muted hover:text-foreground transition-all disabled:opacity-40 spring-active"
          >
            패스하기 (Esc)
          </button>
          <button 
            type="submit" 
            disabled={feedback !== null || !input.trim()}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all disabled:opacity-40 spring-active"
          >
            정답 제출
          </button>
        </div>
      </form>
    </div>
  );
}
