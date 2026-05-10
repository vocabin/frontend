"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statsApi, wordSetsApi, WordSet, StatsSummary } from "@/lib/api";

export default function HomePage() {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([wordSetsApi.getAll(), statsApi.getSummary()])
      .then(([setsRes, summaryRes]) => {
        setWordSets(setsRes.data);
        setSummary(summaryRes.data);
      })
      .catch(() => {
        // 백엔드 연결 전 더미 데이터
        setWordSets([
          { id: 1, name: "Week 1 — 기초 어휘", wordCount: 40, learnedCount: 32, correctRate: 80 },
          { id: 2, name: "Week 2 — 중급 어휘", wordCount: 50, learnedCount: 18, correctRate: 62 },
          { id: 3, name: "Week 3 — 고급 어휘", wordCount: 45, learnedCount: 5, correctRate: 40 },
        ]);
        setSummary({
          todayReviewCount: 24,
          weeklyCorrectRate: 71,
          streakDays: 5,
          totalWords: 135,
          totalSessions: 18,
          totalCorrectRate: 68,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">안녕하세요 👋</h1>
        <p className="text-slate-400 mt-1 text-sm">오늘도 꾸준히 학습해봐요</p>
      </div>

      {/* 오늘 통계 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{summary.todayReviewCount}</p>
            <p className="text-xs text-slate-400 mt-1">오늘 복습할 단어</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{summary.weeklyCorrectRate}%</p>
            <p className="text-xs text-slate-400 mt-1">이번 주 정답률</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{summary.streakDays}일</p>
            <p className="text-xs text-slate-400 mt-1">연속 학습</p>
          </div>
        </div>
      )}

      {/* 세트별 진행률 카드 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">내 단어 세트</h2>
        <Link href="/words/upload" className="text-sm text-primary font-medium hover:underline">
          + 새 세트
        </Link>
      </div>

      <div className="space-y-3">
        {wordSets.map((set) => {
          const progress = set.wordCount > 0 ? Math.round((set.learnedCount / set.wordCount) * 100) : 0;
          return (
            <div key={set.id} className="bg-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{set.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {set.learnedCount} / {set.wordCount}단어 · 정답률 {set.correctRate}%
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{progress}%</span>
              </div>

              {/* 진행률 바 */}
              <div className="h-1.5 bg-slate-700 rounded-full mb-4">
                <div
                  className="h-1.5 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* 학습 모드 버튼 */}
              <div className="flex gap-2">
                <Link
                  href={`/study/flashcard?wordSetId=${set.id}`}
                  className="flex-1 text-center py-2 bg-primary text-white text-xs font-medium rounded-xl hover:bg-primary-hover transition-colors"
                >
                  플래시카드
                </Link>
                <Link
                  href={`/study/speedrun?wordSetId=${set.id}`}
                  className="flex-1 text-center py-2 bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  스피드런
                </Link>
                <Link
                  href={`/study/weak?wordSetId=${set.id}`}
                  className="flex-1 text-center py-2 bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  취약 단어
                </Link>
              </div>
            </div>
          );
        })}

        {wordSets.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">아직 단어 세트가 없어요</p>
            <Link
              href="/words/upload"
              className="mt-3 inline-block text-sm text-primary font-medium hover:underline"
            >
              첫 번째 세트 만들기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
