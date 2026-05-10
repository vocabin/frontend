"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { wordsApi, studyApi, wordSetsApi, Word, WordSet } from "@/lib/api";

const DUMMY_WORDS: Word[] = [
  { id: 1, term: "abandon", definition: "포기하다, 버리다", wordSetId: 1, weakCount: 0 },
  { id: 2, term: "abstract", definition: "추상적인; 요약하다", wordSetId: 1, weakCount: 1 },
  { id: 3, term: "accelerate", definition: "가속하다", wordSetId: 1, weakCount: 0 },
  { id: 4, term: "accumulate", definition: "축적하다", wordSetId: 1, weakCount: 3 },
  { id: 5, term: "benevolent", definition: "자애로운, 친절한", wordSetId: 1, weakCount: 2 },
];

function SpeedrunContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const wordSetId = searchParams.get("wordSetId");

  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    wordSetsApi.getAll()
      .then((res) => setWordSets(res.data))
      .catch(() => setWordSets([
        { id: 1, name: "Week 1 — 기초 어휘", wordCount: 5, learnedCount: 3, correctRate: 80 },
        { id: 2, name: "Week 2 — 중급 어휘", wordCount: 5, learnedCount: 1, correctRate: 62 },
      ]));
  }, []);

  const loadWords = useCallback((id: number) => {
    setLoading(true);
    setIndex(0);
    setInput("");
    setFeedback(null);
    setFinished(false);
    setResults({ correct: 0, wrong: 0 });
    wordsApi.getByWordSet(id)
      .then((res) => setWords(res.data))
      .catch(() => setWords(DUMMY_WORDS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (wordSetId) loadWords(Number(wordSetId));
    else setLoading(false);
  }, [wordSetId, loadWords]);

  useEffect(() => {
    if (!loading && !finished && feedback === null) inputRef.current?.focus();
  }, [loading, finished, feedback, index]);

  const next = (correct: boolean) => {
    const word = words[index];
    studyApi.recordResult({ wordId: word.id, correct, mode: "SPEEDRUN" }).catch(() => {});
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }));
    setTimeout(() => {
      if (index + 1 >= words.length) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setInput("");
        setFeedback(null);
      }
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== null) return;
    const word = words[index];
    const isCorrect = word.term.trim().toLowerCase() === input.trim().toLowerCase();
    setFeedback(isCorrect ? "correct" : "wrong");
    next(isCorrect);
  };

  const handleSkip = () => {
    if (feedback !== null) return;
    setFeedback("wrong");
    next(false);
  };

  // 세트 선택
  if (!wordSetId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">스피드런</h1>
        <p className="text-sm text-slate-400 mb-6">학습할 단어 세트를 선택하세요</p>
        <div className="space-y-3">
          {wordSets.map((set) => (
            <button key={set.id} onClick={() => router.push(`/study/speedrun?wordSetId=${set.id}`)} className="w-full bg-card rounded-2xl p-4 text-left hover:bg-slate-800 transition-colors">
              <p className="font-semibold text-sm text-foreground">{set.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{set.wordCount}단어</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (finished) {
    const total = results.correct + results.wrong;
    const rate = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center">
        <div className="text-5xl mb-4">{rate >= 70 ? "🎉" : "💪"}</div>
        <h2 className="text-2xl font-bold text-foreground mb-1">완료!</h2>
        <p className="text-slate-400 text-sm mb-8">{total}개 단어 완료</p>
        <div className="flex gap-6 mb-8">
          <div className="text-center"><p className="text-3xl font-bold text-correct">{results.correct}</p><p className="text-xs text-slate-500 mt-1">정답</p></div>
          <div className="text-center"><p className="text-3xl font-bold text-wrong">{results.wrong}</p><p className="text-xs text-slate-500 mt-1">오답</p></div>
          <div className="text-center"><p className="text-3xl font-bold text-primary">{rate}%</p><p className="text-xs text-slate-500 mt-1">정답률</p></div>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={() => loadWords(Number(wordSetId))} className="flex-1 py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/50">다시 하기</button>
          <button onClick={() => router.push("/")} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover">홈으로</button>
        </div>
      </div>
    );
  }

  const currentWord = words[index];
  const bgClass = feedback === "correct" ? "bg-correct/5 border-correct/20" : feedback === "wrong" ? "bg-wrong/5 border-wrong/20" : "bg-card border-transparent";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 진행률 */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-slate-500 shrink-0">{index + 1} / {words.length}</span>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
          <div className="h-1.5 bg-primary rounded-full transition-all duration-300" style={{ width: `${((index + 1) / words.length) * 100}%` }} />
        </div>
      </div>

      {/* 단어 카드 */}
      <div className={`rounded-3xl border-2 p-8 mb-6 text-center transition-all duration-300 ${bgClass}`}>
        <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-widest">한국어 뜻</p>
        <p className="text-2xl font-bold text-foreground leading-snug">{currentWord.definition}</p>
        {feedback === "wrong" && (
          <p className="mt-4 text-sm text-wrong font-medium">정답: {currentWord.term}</p>
        )}
        {feedback === "correct" && (
          <p className="mt-4 text-sm text-correct font-medium">정답! {currentWord.term}</p>
        )}
      </div>

      {/* 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={feedback !== null}
          placeholder="영단어를 입력하세요"
          className={`w-full border rounded-2xl px-4 py-3.5 text-sm focus:outline-none transition-all ${
            feedback === "correct" ? "border-correct/30 bg-correct/5 text-correct" :
            feedback === "wrong" ? "border-wrong/30 bg-wrong/5 text-wrong" :
            "bg-slate-900/50 border-slate-700 text-foreground focus:border-primary"
          }`}
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleSkip} disabled={feedback !== null} className="flex-1 py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 disabled:opacity-40 transition-colors">
            모르겠어요
          </button>
          <button type="submit" disabled={feedback !== null || !input.trim()} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover disabled:opacity-40 transition-colors">
            확인
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SpeedrunPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <SpeedrunContent />
    </Suspense>
  );
}
