"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { wordsApi, wordSetsApi, Word, WordSet } from "@/lib/api";

function WeakContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const wordSetIdParam = searchParams.get("wordSetId");

  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const DUMMY_WEAK: Word[] = [
    { id: 4, term: "accumulate", definition: "축적하다", wordSetId: 1, weakCount: 3 },
    { id: 7, term: "callous", definition: "냉담한, 무정한", wordSetId: 2, weakCount: 4 },
    { id: 5, term: "benevolent", definition: "자애로운, 친절한", wordSetId: 2, weakCount: 2 },
  ];

  useEffect(() => {
    wordSetsApi.getAll()
      .then((res) => setWordSets(res.data))
      .catch(() => setWordSets([
        { id: 1, name: "Week 1", wordCount: 40, learnedCount: 32, correctRate: 80 },
        { id: 2, name: "Week 2", wordCount: 50, learnedCount: 18, correctRate: 62 },
      ]));
  }, []);

  useEffect(() => {
    setLoading(true);
    wordsApi.getWeak(wordSetIdParam ? Number(wordSetIdParam) : undefined)
      .then((res) => setWords(res.data))
      .catch(() => setWords(DUMMY_WEAK))
      .finally(() => setLoading(false));
  }, [wordSetIdParam]);

  const handleStudy = (word: Word) => {
    router.push(`/study/flashcard?wordSetId=${word.wordSetId}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">취약 단어</h1>
        <p className="text-sm text-slate-400 mt-1">오답 3회 이상 단어 모음</p>
      </div>

      {/* 세트 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => router.push("/study/weak")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!wordSetIdParam ? "bg-primary text-white" : "bg-card text-slate-400 hover:text-foreground"}`}
        >
          전체
        </button>
        {wordSets.map((set) => (
          <button
            key={set.id}
            onClick={() => router.push(`/study/weak?wordSetId=${set.id}`)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${wordSetIdParam === String(set.id) ? "bg-primary text-white" : "bg-card text-slate-400 hover:text-foreground"}`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-sm font-medium">취약 단어가 없어요!</p>
          <p className="text-xs mt-1">모든 단어를 잘 알고 있네요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {words.map((word) => (
            <div key={word.id} className="bg-card rounded-xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{word.term}</span>
                  <span className="text-[10px] bg-wrong/10 text-wrong font-bold px-1.5 py-0.5 rounded-md">
                    ×{word.weakCount}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-0.5 block">{word.definition}</span>
              </div>
              <button
                onClick={() => handleStudy(word)}
                className="text-xs text-primary font-medium px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all"
              >
                학습
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeakPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <WeakContent />
    </Suspense>
  );
}
