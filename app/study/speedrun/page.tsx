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
        let next = Math.floor(Math.random() * words.length);
        if (next === i) next = (next + 1) % words.length;
        return next;
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
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (finished) {
    const total = results.correct + results.wrong;
    const rate = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center">
        <div className="text-5xl mb-4">{results.correct >= 15 ? "🔥" : "💪"}</div>
        <h2 className="text-2xl font-bold text-foreground mb-1">타임 아웃!</h2>
        <p className="text-slate-400 text-sm mb-8">60초 동안 {total}개의 단어를 풀었어요</p>
        <div className="flex gap-6 mb-8">
          <div className="text-center"><p className="text-3xl font-bold text-correct">{results.correct}</p><p className="text-xs text-slate-500 mt-1">정답</p></div>
          <div className="text-center"><p className="text-3xl font-bold text-wrong">{results.wrong}</p><p className="text-xs text-slate-500 mt-1">오답</p></div>
          <div className="text-center"><p className="text-3xl font-bold text-primary">{rate}%</p><p className="text-xs text-slate-500 mt-1">정답률</p></div>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={loadWords} className="flex-1 py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/50">다시 하기</button>
          <button onClick={() => router.push("/")} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover">홈으로</button>
        </div>
      </div>
    );
  }

  const currentWord = words[index];
  const bgClass = feedback === "correct" ? "bg-correct/5 border-correct/20" : feedback === "wrong" ? "bg-wrong/5 border-wrong/20" : "bg-card border-transparent";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 타이머 및 점수 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2.5 rounded-xl shrink-0">
          <span className="text-base font-bold text-primary">⏱ {timeLeft}초</span>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">맞힌 단어</p>
            <p className="text-xl font-bold text-correct leading-none">{results.correct}</p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">틀린 단어</p>
            <p className="text-xl font-bold text-wrong leading-none">{results.wrong}</p>
          </div>
        </div>
      </div>

      {/* 단어 카드 */}
      <div className={`rounded-3xl border-2 p-8 mb-6 text-center transition-all duration-300 ${bgClass}`}>
        <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-widest">한국어 뜻</p>
        <p className="text-2xl font-bold text-foreground leading-snug">{currentWord.korean}</p>
        {feedback === "wrong" && <p className="mt-4 text-sm text-wrong font-medium">정답: {currentWord.english}</p>}
        {feedback === "correct" && <p className="mt-4 text-sm text-correct font-medium">정답! {currentWord.english}</p>}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={feedback !== null}
          placeholder="영단어를 입력하세요"
          className={`w-full border rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all ${feedback === "correct" ? "border-correct/30 bg-correct/5 text-correct" :
              feedback === "wrong" ? "border-wrong/30 bg-wrong/5 text-wrong" :
                "bg-slate-900/50 border-slate-700 text-foreground focus:border-primary"
            }`}
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleSkip} disabled={feedback !== null}
            className="flex-1 py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 disabled:opacity-40 transition-colors">
            모르겠어요
          </button>
          <button type="submit" disabled={feedback !== null || !input.trim()}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors">
            확인
          </button>
        </div>
      </form>
    </div>
  );
}
