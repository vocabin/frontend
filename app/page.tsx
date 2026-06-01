"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statsApi, wordSetsApi, StatsSummary, WordSetProgress } from "@/lib/api";

export default function HomePage() {
  const [progress, setProgress] = useState<WordSetProgress[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([wordSetsApi.getProgress(), statsApi.getSummary()])
      .then(([progressRes, summaryRes]) => {
        setProgress(progressRes.data);
        setSummary(summaryRes.data);
      })
      .catch(() => {
        setProgress([
          { wordSetId: 1, name: "Week 1 — 기초 어휘", totalWords: 40, studiedWords: 32 },
          { wordSetId: 2, name: "Week 2 — 중급 어휘", totalWords: 50, studiedWords: 18 },
          { wordSetId: 3, name: "Week 3 — 고급 어휘", totalWords: 45, studiedWords: 5 },
        ]);
        setSummary({ totalWords: 135, correctRate: 0.71, streakDays: 5, totalRecords: 18 });
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

      {/* 통계 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{summary.totalWords}</p>
            <p className="text-xs text-slate-400 mt-1">전체 단어</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary tabular-nums">{Math.round(summary.correctRate * 100)}%</p>
            <p className="text-xs text-slate-400 mt-1">전체 정답률</p>
          </div>
          <div className="bg-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{summary.streakDays}</p>
            <p className="text-xs text-slate-400 mt-1">연속 학습일</p>
          </div>
        </div>
      )}

      {/* 전체 학습 모드 */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/study/flashcard" className="bg-card rounded-2xl p-5 hover:bg-slate-800/70 transition-colors">
          <p className="text-sm font-semibold text-foreground mb-1">플래시카드</p>
          <p className="text-xs text-slate-400">전체 단어 SM-2 복습</p>
        </Link>
        <Link href="/study/speedrun" className="bg-card rounded-2xl p-5 hover:bg-slate-800/70 transition-colors">
          <p className="text-sm font-semibold text-foreground mb-1">스피드런</p>
          <p className="text-xs text-slate-400">60초 타임어택</p>
        </Link>
      </div>

      {/* 세트별 진행률 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">내 단어 세트</h2>
        <Link href="/words/upload" className="text-sm text-primary font-medium hover:underline">
          + 새 세트
        </Link>
      </div>

      <div className="space-y-3">
        {progress.map((set) => {
          const pct = set.totalWords > 0 ? Math.round((set.studiedWords / set.totalWords) * 100) : 0;
          return (
            <div key={set.wordSetId} className="bg-card rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{set.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {set.studiedWords} / {set.totalWords}단어 학습
                  </p>
                </div>
                <span className="text-sm font-bold text-primary tabular-nums">{pct}%</span>
              </div>

              {/* 진행률 바 */}
              <div className="h-1.5 bg-slate-700 rounded-full mb-4">
                <div
                  className="h-1.5 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* 취약 단어 버튼 */}
              <Link
                href={`/study/weak?wordSetId=${set.wordSetId}`}
                className="block text-center py-2 bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700 transition-colors"
              >
                취약 단어
              </Link>
            </div>
          );
        })}

        {progress.length === 0 && (
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
