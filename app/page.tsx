"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statsApi, wordSetsApi, StatsSummary, WordSetProgress } from "@/lib/api";

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconCards() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconEmpty() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="13" y2="13" />
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
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* 데스크톱: 2컬럼 / 모바일: 단일 컬럼 */}
      <div className="md:grid md:grid-cols-[300px_1fr] md:gap-8 md:items-start">

        {/* ── 왼쪽 컬럼 (모바일: 상단) ─────────────────────────── */}
        <div>
          {/* 헤더 */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground">안녕하세요 👋</h1>
            <p className="text-slate-400 mt-1 text-sm">오늘도 꾸준히 학습해봐요</p>
          </div>

          {/* 통계 요약 */}
          {summary && (
            <div className="grid grid-cols-3 gap-2.5 mb-7 stagger">
              <div className="bg-card rounded-2xl p-4 card-lift">
                <div className="text-primary mb-2 opacity-80"><IconBook /></div>
                <p className="text-xl font-bold text-foreground tabular-nums num-pop">{summary.totalWords}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">전체 단어</p>
              </div>
              <div className="bg-card rounded-2xl p-4 card-lift">
                <div className="text-correct mb-2 opacity-80"><IconCheck /></div>
                <p className="text-xl font-bold text-foreground tabular-nums num-pop">{Math.round(summary.correctRate * 100)}%</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">전체 정답률</p>
              </div>
              <div className="bg-card rounded-2xl p-4 card-lift">
                <div className="text-orange-400 mb-2 opacity-90"><IconFlame /></div>
                <p className="text-xl font-bold text-foreground tabular-nums num-pop">{summary.streakDays}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">연속 학습일</p>
              </div>
            </div>
          )}

          {/* 학습 모드 */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">학습 모드</p>
          <div className="space-y-2.5 mb-7 md:mb-0">
            <Link href="/study/flashcard" className="flex items-center gap-4 bg-card rounded-2xl p-4 card-lift group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-500/15 transition-colors">
                <IconCards />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">플래시카드</p>
                <p className="text-xs text-slate-500 mt-0.5">SM-2 알고리즘 복습</p>
              </div>
              <span className="text-slate-600 shrink-0"><IconChevronRight /></span>
            </Link>

            <Link href="/study/speedrun" className="flex items-center gap-4 bg-card rounded-2xl p-4 card-lift group">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 group-hover:bg-orange-500/15 transition-colors">
                <IconZap />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">스피드런</p>
                <p className="text-xs text-slate-500 mt-0.5">60초 타임어택</p>
              </div>
              <span className="text-slate-600 shrink-0"><IconChevronRight /></span>
            </Link>
          </div>
        </div>

        {/* ── 오른쪽 컬럼 (모바일: 하단) ─────────────────────────── */}
        <div>
          {/* 세트별 진행률 헤더 */}
          <div className="flex items-center justify-between mb-4 mt-8 md:mt-0">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">내 단어 세트</p>
              <p className="text-[11px] text-slate-600">{progress.length}개 세트</p>
            </div>
            <Link
              href="/words/upload"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              새 세트
            </Link>
          </div>

          {/* 단어 세트 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3 stagger">
            {progress.map((set) => {
              const pct = set.totalWords > 0 ? Math.round((set.studiedWords / set.totalWords) * 100) : 0;
              return (
                <div key={set.wordSetId} className="bg-card rounded-2xl p-4 card-lift flex flex-col gap-3">
                  {/* 세트 정보 */}
                  <Link href={`/words/${set.wordSetId}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm hover:text-primary transition-colors line-clamp-1">{set.name}</h3>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-500">{set.studiedWords} / {set.totalWords}단어</p>
                      <span className="text-xs font-bold text-primary tabular-nums">{pct}%</span>
                    </div>
                  </Link>

                  {/* 진행률 바 */}
                  <div className="h-1 bg-slate-700/60 rounded-full">
                    <div
                      className="h-1 bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* 버튼 */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/words/${set.wordSetId}`}
                      className="block text-center py-2.5 bg-slate-700/30 border border-slate-700/60 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700/50 active:scale-95 transition-all"
                    >
                      단어 목록
                    </Link>
                    <Link
                      href={`/study/weak?wordSetId=${set.wordSetId}`}
                      className="block text-center py-2.5 bg-slate-700/30 border border-slate-700/60 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700/50 active:scale-95 transition-all"
                    >
                      취약 단어
                    </Link>
                  </div>
                </div>
              );
            })}

            {progress.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-2 text-center py-16 text-slate-500 bg-card/50 rounded-2xl">
                <div className="flex justify-center mb-3"><IconEmpty /></div>
                <p className="text-sm font-medium text-slate-400">아직 단어 세트가 없어요</p>
                <p className="text-xs text-slate-600 mt-1 mb-5">CSV 파일을 업로드해서 시작해봐요</p>
                <Link
                  href="/words/upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  첫 번째 세트 만들기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
