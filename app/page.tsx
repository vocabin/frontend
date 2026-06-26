"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statsApi, wordSetsApi, StatsSummary, WordSetProgress } from "@/lib/api";

function IconBook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconCards() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export default function HomePage() {
  const [progress, setProgress] = useState<WordSetProgress[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const failsafe = setTimeout(() => setLoading(false), 8000);

    Promise.all([wordSetsApi.getProgress(), statsApi.getSummary()])
      .then(([progressRes, summaryRes]) => {
        setProgress(progressRes.data);
        setSummary(summaryRes.data);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(failsafe);
        setLoading(false);
      });

    return () => clearTimeout(failsafe);
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
        <div className="grid grid-cols-3 gap-3 mb-8 stagger">
          <div className="bg-card border border-white/[0.06] rounded-2xl p-4 card-lift">
            <div className="text-primary mb-2"><IconBook /></div>
            <p className="text-xl font-bold text-foreground tabular-nums num-pop">{summary.totalWords}</p>
            <p className="text-xs text-slate-500 mt-0.5">전체 단어</p>
          </div>
          <div className="bg-card border border-white/[0.06] rounded-2xl p-4 card-lift">
            <div className="text-correct mb-2"><IconCheck /></div>
            <p className="text-xl font-bold text-foreground tabular-nums num-pop">{Math.round(summary.correctRate * 100)}%</p>
            <p className="text-xs text-slate-500 mt-0.5">전체 정답률</p>
          </div>
          <div className="bg-card border border-white/[0.06] rounded-2xl p-4 card-lift">
            <div className="text-orange-400 mb-2"><IconFlame /></div>
            <p className="text-xl font-bold text-foreground tabular-nums num-pop">{summary.streakDays}</p>
            <p className="text-xs text-slate-500 mt-0.5">연속 학습일</p>
          </div>
        </div>
      )}

      {/* 전체 학습 모드 */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/study/flashcard" className="bg-card border border-white/[0.06] rounded-2xl p-5 card-lift group">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500/15 transition-colors">
            <IconCards />
          </div>
          <p className="text-sm font-semibold text-foreground">플래시카드</p>
          <p className="text-xs text-slate-500 mt-0.5">전체 단어 SM-2 복습</p>
        </Link>
        <Link href="/study/speedrun" className="bg-card border border-white/[0.06] rounded-2xl p-5 card-lift group">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3 group-hover:bg-orange-500/15 transition-colors">
            <IconZap />
          </div>
          <p className="text-sm font-semibold text-foreground">스피드런</p>
          <p className="text-xs text-slate-500 mt-0.5">60초 타임어택</p>
        </Link>
      </div>

      {/* 세트별 진행률 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">내 단어 세트</h2>
        <Link href="/words/upload" className="text-sm text-primary font-medium hover:underline">
          + 새 세트
        </Link>
      </div>

      <div className="space-y-3 stagger">
        {progress.map((set) => {
          const pct = set.totalWords > 0 ? Math.round((set.studiedWords / set.totalWords) * 100) : 0;
          return (
            <div key={set.wordSetId} className="bg-card border border-white/[0.06] rounded-2xl p-5 card-lift">
              <div className="flex items-start justify-between mb-3">
                <Link href={`/words/${set.wordSetId}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm hover:text-primary transition-colors">{set.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {set.studiedWords} / {set.totalWords}단어 학습
                  </p>
                </Link>
                <span className="text-sm font-bold text-primary tabular-nums">{pct}%</span>
              </div>

              <div className="h-1.5 bg-white/[0.07] rounded-full mb-4">
                <div
                  className="h-1.5 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/words/${set.wordSetId}`}
                  className="block text-center py-2.5 bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs font-medium rounded-xl hover:bg-white/[0.08] active:scale-95 transition-all"
                >
                  단어 목록
                </Link>
                <Link
                  href={`/study/weak?wordSetId=${set.wordSetId}`}
                  className="block text-center py-2.5 bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs font-medium rounded-xl hover:bg-white/[0.08] active:scale-95 transition-all"
                >
                  취약 단어
                </Link>
              </div>
            </div>
          );
        })}

        {progress.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 mx-auto mb-3">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-400">아직 단어 세트가 없어요</p>
            <Link href="/words/upload" className="mt-3 inline-block text-sm text-primary font-medium hover:underline">
              첫 번째 세트 만들기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
