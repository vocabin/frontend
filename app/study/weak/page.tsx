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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">취약 단어</h1>
          <p className="text-xs text-slate-500 mt-0.5">오답 3회 이상</p>
        </div>
        <button
          onClick={() => router.push("/study/flashcard")}
          className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg border border-primary/20 hover:bg-primary/20 transition-all shrink-0"
        >
          전체 스마트 복습 →
        </button>
      </div>

      {/* 세트 필터 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        <button
          onClick={() => router.push("/study/weak")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-100 ${
            !wordSetIdParam
              ? "bg-primary/10 text-primary"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
          }`}
        >
          전체
        </button>
        {wordSets.map((set) => (
          <button
            key={set.id}
            onClick={() => router.push(`/study/weak?wordSetId=${set.id}`)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-100 ${
              wordSetIdParam === String(set.id)
                ? "bg-primary/10 text-primary"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
            }`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm text-slate-500">취약 단어가 없어요</p>
          <p className="text-xs text-slate-700 mt-1">모든 단어를 잘 알고 있네요</p>
        </div>
      ) : (
        <div className="space-y-px">
          {words.map((word, i) => (
            <div
              key={word.id}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[11px] text-slate-700 tabular-nums w-5 shrink-0 text-right">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm text-foreground">{word.english}</span>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{word.korean}</p>
              </div>
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
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WeakContent />
    </Suspense>
  );
}
