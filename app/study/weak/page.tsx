"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { wordsApi, wordSetsApi, Word, WordSet } from "@/lib/api";

const DUMMY_WEAK: Word[] = [
  { id: 4, english: "accumulate", korean: "축적하다", wordSetId: 1 },
  { id: 7, english: "callous", korean: "냉담한, 무정한", wordSetId: 2 },
  { id: 5, english: "benevolent", korean: "자애로운, 친절한", wordSetId: 2 },
];

function WeakContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const wordSetIdParam = searchParams.get("wordSetId");

  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wordSetsApi.getAll()
      .then((res) => setWordSets(res.data))
      .catch(() => setWordSets([
        { id: 1, name: "Week 1", createdAt: "" },
        { id: 2, name: "Week 2", createdAt: "" },
      ]));
  }, []);

  useEffect(() => {
    setLoading(true);
    wordsApi.getWeak(wordSetIdParam ? Number(wordSetIdParam) : undefined)
      .then((res) => setWords(res.data))
      .catch(() => setWords(DUMMY_WEAK))
      .finally(() => setLoading(false));
  }, [wordSetIdParam]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 page-in">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">취약 단어장</h1>
          <p className="text-xs text-slate-400 mt-2 font-medium">복습 퀴즈에서 3회 이상 틀려 주의가 필요한 단어 목록</p>
        </div>
        <button
          onClick={() => router.push("/study/flashcard")}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all shrink-0 spring-active"
        >
          스마트 복습 시작 →
        </button>
      </div>

      {/* 세트 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          onClick={() => router.push("/study/weak")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 spring-active ${
            !wordSetIdParam
              ? "bg-primary text-white shadow-md shadow-primary/10"
              : "bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          }`}
        >
          전체 보기
        </button>
        {wordSets.map((set) => (
          <button
            key={set.id}
            onClick={() => router.push(`/study/weak?wordSetId=${set.id}`)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 spring-active ${
              wordSetIdParam === String(set.id)
                ? "bg-primary text-white shadow-md shadow-primary/10"
                : "bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            }`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="glass-card rounded-3xl text-center py-20 text-slate-500">
          <div className="w-12 h-12 bg-correct/10 text-correct rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-400">등록된 취약 단어가 없습니다</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">모든 등록 단어의 메커니즘을 시급하게 파악하고 있습니다.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl divide-y divide-white/[0.03] overflow-hidden">
          {words.map((word, i) => (
            <div
              key={word.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-xs font-bold text-slate-600 tabular-nums w-5 shrink-0 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[15px] font-bold text-foreground tracking-tight">{word.english}</span>
                <p className="text-xs text-slate-400 mt-1 truncate font-medium">{word.korean}</p>
              </div>
              <span className="text-[10px] font-bold text-wrong bg-wrong/10 px-2 py-0.5 rounded-full shrink-0 border border-wrong/10">
                주의 단어
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeakPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WeakContent />
    </Suspense>
  );
}
